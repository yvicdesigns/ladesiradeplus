import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { executeWithResilience } from '@/lib/supabaseErrorHandler';
import { logger } from '@/lib/logger';
import { clearAuthSession } from '@/lib/sessionCleanup';
import { retryWithExponentialBackoff, withTimeout, getNetworkStatus } from '@/lib/networkResilience';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';
import { logAudit } from '@/lib/auditLogUtils';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';
import { globalCircuitBreaker } from '@/lib/CircuitBreaker';
import { initPushNotifications, removePushToken } from '@/lib/pushNotificationService';

const AuthContext = createContext({
  user: null,
  role: null,
  isAdmin: false,
  session: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  authError: null,
  retryAuth: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  const isMountedRef = useRef(true);
  const authInitAttemptedRef = useRef(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const data = await executeWithResilience(
        async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, photo_url')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

          const { data: admin } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', userId)
            .eq('is_deleted', false)
            .limit(1)
            .maybeSingle();

          const resolvedRole = admin?.role || profile?.role || 'customer';
          const userIsAdmin = ['admin', 'manager', 'staff'].includes(admin?.role) || ['admin', 'manager', 'staff'].includes(profile?.role);

          return {
            role: resolvedRole,
            photo_url: profile?.photo_url,
            isAdmin: userIsAdmin
          };
        },
        { maxRetries: 2, timeout: 3000, context: 'fetchUserProfile', fallbackValue: { role: 'customer', isAdmin: false } }
      );
      return data || { role: 'customer', isAdmin: false };
    } catch (err) {
      globalCircuitBreaker.logErrorDeduped('fetchUserProfile', err);
      return { role: 'customer', isAdmin: false };
    }
  }, []);

  const clearAuthState = useCallback(() => {
    if (!isMountedRef.current) return;
    setUser(null);
    setRole(null);
    setIsAdmin(false);
    setSession(null);
    setLoading(false);
  }, []);

  const handleSession = useCallback(async (currentSession) => {
    if (!isMountedRef.current) return;
    
    if (currentSession && (!currentSession.access_token || !currentSession.refresh_token)) {
        await clearAuthSession();
        clearAuthState();
        return;
    }

    setSession(currentSession);
    let currentUser = currentSession?.user ?? null;

    if (currentUser) {
      // Prevent redundant fetches if user ID hasn't changed
      if (user?.id !== currentUser.id) {
        const profileData = await fetchUserProfile(currentUser.id);
        if (!isMountedRef.current) return;
        
        currentUser = {
          ...currentUser,
          photo_url: profileData?.photo_url,
          role: profileData?.role || 'customer'
        };
        
        setUser(currentUser);
        setRole(currentUser.role);
        setIsAdmin(profileData?.isAdmin || false);
        initPushNotifications(currentUser.id);
      }
    } else {
      clearAuthState();
    }

    setLoading(false);
    setAuthError(null);
  }, [clearAuthState, fetchUserProfile, user?.id]);

  const initAuth = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    // Prevent infinite initialization loops
    if (authInitAttemptedRef.current) return;
    authInitAttemptedRef.current = true;
    
    setLoading(true);
    setAuthError(null);
    
    try {
      const sessionData = await executeWithResilience(
        async () => {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          return data.session;
        },
        { maxRetries: 2, timeout: 4000, context: 'initAuth', fallbackValue: null }
      );

      if (sessionData) {
          await handleSession(sessionData);
      } else {
          clearAuthState();
      }
    } catch (err) {
      globalCircuitBreaker.logErrorDeduped('initAuth', err);
      if (isMountedRef.current) {
        setAuthError("Impossible de se connecter au serveur.");
        setLoading(false); 
      }
    }
  }, [clearAuthState, handleSession]);

  useEffect(() => {
    initAuth();

    let subscription = null;
    let timeoutId = null;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMountedRef.current) return;
        
        // Debounce state changes to prevent loops from rapid events
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(async () => {
          if (!isMountedRef.current) return;
          
          if (event === 'SIGNED_OUT') {
              clearAuthState();
              if (!window.location.pathname.includes('/admin/login') && !window.location.pathname.includes('/login')) {
                  navigate('/login', { replace: true }); 
              }
          } else if (['TOKEN_REFRESHED', 'USER_UPDATED', 'SIGNED_IN', 'INITIAL_SESSION'].includes(event)) {
              if (newSession) {
                  await handleSession(newSession);
              }
          }
        }, 100); // 100ms debounce
      });
      subscription = data.subscription;
    }

    return () => {
      if (subscription) subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [initAuth, clearAuthState, handleSession, navigate]);

  const signIn = useCallback(async (email, password) => {
    const { isOffline } = getNetworkStatus();
    if (isOffline) {
      throw new Error("Vous êtes hors ligne. Vérifiez votre connexion.");
    }

    const result = await retryWithExponentialBackoff(async () => {
      const res = await withTimeout(
        () => supabase.auth.signInWithPassword({ email, password }),
        15000
      );
      if (res.error) throw res.error;
      return res;
    }, 3, 1500, 'signIn');

    if (!result.success) {
      throw result.error;
    }

    if (result.data?.data?.session) {
      await handleSession(result.data.data.session);
      // Fire-and-forget: logAudit has no timeout and can hang on mobile (no await)
      logAudit(AUDIT_ACTIONS.LOGIN, 'users', result.data.data.session.user.id, null, 'User context signed in');
    }
    
    return result.data;
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const result = await retryWithExponentialBackoff(async () => {
      const res = await withTimeout(
        () => supabase.auth.signUp({ email, password, options }),
        15000
      );
      if (res.error) throw res.error;
      return res;
    }, 3, 1500, 'signUp');

    if (!result.success) throw result.error;

    // Ensure profile exists (trigger should handle it, but belt-and-suspenders)
    const newUser = result.data?.data?.user;
    if (newUser?.id) {
      const fullName = options?.data?.full_name || options?.data?.name || '';
      await supabase.from('profiles').upsert({
        user_id: newUser.id,
        email: newUser.email,
        full_name: fullName,
        phone: options?.data?.phone || null,
        role: 'customer',
      }, { onConflict: 'user_id', ignoreDuplicates: true });
    }

    return result.data;
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
          // Fire-and-forget to prevent hang on mobile
          logAudit(AUDIT_ACTIONS.LOGOUT, 'users', currentSession.user.id, null, 'User context signed out');
      }
    } catch (e) {
      console.warn("Could not log audit on signout", e);
    }
    
    try { const { data: { session: s } } = await supabase.auth.getSession(); if (s?.user) await removePushToken(s.user.id); } catch (_) {}
    await clearAuthSession();
    clearAuthState();
    if (!window.location.pathname.includes('/admin/login')) {
        navigate('/login', { replace: true });
    }
    return { error: null };
  }, [navigate, clearAuthState]);

  const value = useMemo(() => ({
    user, role, isAdmin, session, loading, signUp, signIn, signOut, authError, retryAuth: () => {
      authInitAttemptedRef.current = false;
      initAuth();
    }
  }), [user, role, isAdmin, session, loading, signUp, signIn, signOut, authError, initAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);