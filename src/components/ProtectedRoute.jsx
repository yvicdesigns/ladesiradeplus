import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const ProtectedRoute = ({ children, requireAdmin = false }) => {
  // Task 2: Correctly destructured `isAdmin` instead of `profile`
  const { user, isAdmin, role, loading } = useAuth();
  const location = useLocation();

  // Task 5: Debug logs to verify redirection logic
  useEffect(() => {
    if (!loading) {
      console.log(`[ProtectedRoute] Route check for ${location.pathname} | Auth: ${!!user} | Role: ${role} | RequireAdmin: ${requireAdmin} | IsAdmin: ${isAdmin}`);
    }
  }, [location.pathname, user, role, requireAdmin, isAdmin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97706]"></div>
      </div>
    );
  }

  // Check if user is unauthenticated and redirect appropriately
  if (!user) {
    const isTargetingAdmin = location.pathname.startsWith('/admin');
    
    console.log(`[ProtectedRoute] ❌ Access denied (not logged in). Redirecting to ${isTargetingAdmin ? '/admin/login' : '/login'}`);
    
    // Redirect to admin login if they were trying to access an admin route
    if (isTargetingAdmin) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    
    // Otherwise, redirect to normal client login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin) {
    if (!isAdmin) {
      const isTargetingAdmin = location.pathname.startsWith('/admin');
      const redirectTo = isTargetingAdmin ? '/admin/login' : '/login';
      console.log(`[ProtectedRoute] ❌ Not admin. Redirecting to ${redirectTo}`);
      return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }
    console.log("[ProtectedRoute] ✅ Admin access granted.");
  } else {
    console.log("[ProtectedRoute] ✅ Client access granted.");
  }

  return <>{children}</>;
};

export default ProtectedRoute;