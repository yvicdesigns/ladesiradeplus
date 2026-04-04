import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Shield, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function DebugPermissionsPanel() {
  const { user, role } = useAuth();
  const [dbPermissions, setDbPermissions] = useState({
    isRoleAdmin: null,
    isAdminOrManager: null,
    isAdminOrStaff: null,
    loading: true,
    error: null
  });

  // Helper extracted to guarantee correct return structure { success, data, error }
  const fetchPermissions = async () => {
    try {
      // safeRpc safely awaits the rpc call to avoid "catch is not a function" on the query builder
      const safeRpc = async (funcName) => {
        try {
          const { data, error } = await supabase.rpc(funcName);
          if (error) return { success: false, data: null, error };
          return { success: true, data, error: null };
        } catch (err) {
          return { success: false, data: null, error: err };
        }
      };

      const [strictAdmin, adminOrManager, staff] = await Promise.all([
        safeRpc('is_role_admin'),
        safeRpc('is_admin_or_manager'),
        safeRpc('is_admin_or_staff')
      ]);

      if (!strictAdmin.success) throw strictAdmin.error;
      if (!adminOrManager.success) throw adminOrManager.error;
      if (!staff.success) throw staff.error;

      return {
        success: true,
        data: {
          isRoleAdmin: strictAdmin.data,
          isAdminOrManager: adminOrManager.data,
          isAdminOrStaff: staff.data
        },
        error: null
      };
    } catch (err) {
      return { success: false, data: null, error: err };
    }
  };

  const checkDbPermissions = async () => {
    setDbPermissions(prev => ({ ...prev, loading: true, error: null }));
    
    if (!supabase) {
      setDbPermissions(prev => ({ 
        ...prev, 
        loading: false, 
        error: "Supabase client is not initialized." 
      }));
      return;
    }

    const result = await fetchPermissions();

    if (result.success) {
      setDbPermissions({
        isRoleAdmin: result.data.isRoleAdmin,
        isAdminOrManager: result.data.isAdminOrManager,
        isAdminOrStaff: result.data.isAdminOrStaff,
        loading: false,
        error: null
      });
    } else {
      console.error('[DebugPermissionsPanel] Permission check error:', result.error);
      
      let errorMessage = result.error?.message || "Unknown error occurred";
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error: Failed to fetch from Supabase. Check your internet connection, CORS settings, or Supabase project URL.';
      }

      setDbPermissions(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
    }
  };

  useEffect(() => {
    if (user) {
      checkDbPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  return (
    <Card className="mb-6 border-dashed border-2 border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800">
            <Shield className="h-4 w-4" />
            Debug Permissions (Frontend vs DB)
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={checkDbPermissions} disabled={dbPermissions.loading} className="h-6 w-6 p-0">
            <RefreshCw className={`h-3 w-3 ${dbPermissions.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          
          <div className="bg-white p-2 rounded border">
            <div className="text-muted-foreground mb-1">User ID</div>
            <div className="truncate font-bold" title={user.id}>{user.id}</div>
          </div>

          {/* Frontend UI Role Evaluation */}
          <div className="bg-white p-2 rounded border border-blue-200">
            <div className="text-muted-foreground mb-1">UI Context Role</div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-700">{role || 'null'}</span>
              {role === 'admin' ? 
                <CheckCircle2 className="h-3 w-3 text-blue-500" /> : 
                <AlertTriangle className="h-3 w-3 text-blue-400" />
              }
            </div>
            <div className="text-[9px] text-muted-foreground mt-1 leading-tight">Controls what panels you see.</div>
          </div>

          {/* Strict Database Role Admin */}
          <div className="bg-white p-2 rounded border border-amber-200">
            <div className="text-muted-foreground mb-1">DB is_role_admin()</div>
            <div className="flex items-center gap-2">
              {dbPermissions.loading ? 'Checking...' : (
                <>
                  <span className="font-bold">{String(dbPermissions.isRoleAdmin)}</span>
                  {dbPermissions.isRoleAdmin ? 
                    <Badge className="h-4 px-1 bg-amber-500 hover:bg-green-600 text-[10px]">TRUE</Badge> : 
                    <Badge variant="destructive" className="h-4 px-1 text-[10px]">FALSE</Badge>
                  }
                </>
              )}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1 leading-tight">Strict RLS check for Admins only.</div>
          </div>

          {/* Broad Database Admin OR Manager Role */}
          <div className="bg-white p-2 rounded border">
            <div className="text-muted-foreground mb-1">DB is_admin_or_manager()</div>
            <div>
              {dbPermissions.loading ? 'Checking...' : (
                <div className="flex items-center gap-2">
                  <span className="font-bold">{String(dbPermissions.isAdminOrManager)}</span>
                  {dbPermissions.isAdminOrManager ? 
                    <Badge className="h-4 px-1 bg-gray-500 hover:bg-gray-600 text-[10px]">TRUE</Badge> : 
                    <Badge variant="outline" className="h-4 px-1 text-[10px]">FALSE</Badge>
                  }
                </div>
              )}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1 leading-tight">RLS checks for Admin & Manager.</div>
          </div>
        </div>
        
        {dbPermissions.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-600 rounded flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs break-words">
              <span className="font-bold block mb-1">Error checking DB permissions:</span>
              {dbPermissions.error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}