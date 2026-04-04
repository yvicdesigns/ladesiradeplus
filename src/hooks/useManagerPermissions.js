import { useAuth } from '@/contexts/SupabaseAuthContext';
import { 
  canManagerDelete, 
  canManagerCancel, 
  canManagerUpdate, 
  canManagerAccess 
} from '@/lib/managerPermissions';

/**
 * UI AUTHORIZATION HOOK
 * =====================
 * This hook is strictly for FRONTEND UI RENDERING DECISIONS.
 * It uses local state (`useAuth().role`) to determine if a button or page should be visible.
 * 
 * IMPORTANT: This does NOT enforce database security. 
 * Database security is enforced by RLS policies using RPC functions like `is_admin_or_manager()` or `is_role_admin()`.
 * 
 * Example: 
 * Frontend: useAuth().role === 'manager' → show manager panel.
 * Database: is_admin_or_manager() → enforce RLS policy for managers and admins.
 */
export const useManagerPermissions = (entityType = null) => {
  const { role } = useAuth();
  
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  
  // Admin can do everything
  if (isAdmin) {
    return {
      canDelete: true,
      canCancel: true,
      canUpdate: true,
      canAccess: true,
      isManager: false,
      isAdmin: true,
      role
    };
  }

  // Manager restrictions
  if (isManager) {
    return {
      canDelete: entityType ? canManagerDelete(entityType) : false,
      canCancel: entityType ? canManagerCancel(entityType) : false,
      canUpdate: entityType ? canManagerUpdate(entityType) : true,
      canAccess: entityType ? canManagerAccess(entityType) : true,
      isManager: true,
      isAdmin: false,
      role
    };
  }

  // Staff or others (Fallback restrictive)
  return {
    canDelete: false,
    canCancel: false,
    canUpdate: false, // Staff might update status but let's be safe
    canAccess: false,
    isManager: false,
    isAdmin: false,
    role
  };
};