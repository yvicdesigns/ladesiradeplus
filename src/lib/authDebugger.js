import { supabase } from './customSupabaseClient';

/**
 * Logs the current authentication state to the console.
 * Only runs in development mode using Vite's environment check.
 */
export const logAuthState = async () => {
  // Use import.meta.env for Vite instead of process.env which causes "process is not defined"
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
  if (!isDev) return;
  
  console.group('🔐 Auth Debugger: Current State');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session Error:', error);
    } else if (session) {
      console.log('User ID:', session.user.id);
      console.log('Email:', session.user.email);
      console.log('Token Expires At:', new Date(session.expires_at * 1000).toLocaleString());
      console.log('Has Access Token:', !!session.access_token);
      console.log('Has Refresh Token:', !!session.refresh_token);
    } else {
      console.log('No active session found.');
    }

    // Check Local Storage for Supabase keys
    const sbKeys = Object.keys(localStorage).filter(key => key.startsWith('sb-'));
    console.log('Supabase LocalStorage Keys:', sbKeys);
    
  } catch (err) {
    console.error('Auth Debugger Exception:', err);
  }
  console.groupEnd();
};

/**
 * Detects if an error is related to token refresh or JWT issues.
 */
export const detectRefreshIssues = (error) => {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return msg.includes('refresh token') || 
         msg.includes('jwt') || 
         msg.includes('invalid claim') ||
         error.status === 400 || 
         error.status === 401;
};