import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const EditAdminUserRoleModal = ({ open, onClose, user, onSuccess }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role || 'user');
      setShowConfirmation(false);
    }
  }, [user, open]);

  const handleSaveClick = () => {
    if (!user) return;

    // Check 1: Self-modification
    // Note: checking against admin_users.user_id if mapped, or perhaps email match if user_id is null in admin_users
    // We'll try user_id match first, then email match as fallback
    const isSelf = (user.user_id && user.user_id === currentUser?.id) || (user.email === currentUser?.email);
    
    if (isSelf) {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez pas modifier votre propre rôle",
        variant: "destructive",
      });
      return;
    }

    // Check 2: Target is Admin
    if (user.role === 'admin') {
      toast({
        title: "Action non autorisée",
        description: "Vous ne pouvez pas modifier le rôle d'un admin",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmation(true);
  };

  const confirmUpdate = async () => {
    try {
      setLoading(true);

      // Update admin_users table
      const { error: adminUserError } = await supabase
        .from('admin_users')
        .update({ role: selectedRole, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (adminUserError) throw adminUserError;

      // If the user has a linked profile (user_id is present), attempt to update profiles table too
      // This ensures RLS and system permissions are synced
      if (user.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: selectedRole })
          .eq('user_id', user.user_id);
          
        if (profileError) {
          console.warn("Could not update profile role:", profileError);
          // We don't throw here to avoid failing the whole operation if profile update fails (e.g. RLS issues)
          // But ideally both should sync.
        }
      }

      toast({
        title: "Succès",
        description: "Rôle modifié avec succès",
        className: "bg-green-600 text-white"
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Update role error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du rôle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle>Modifier le rôle</DialogTitle>
              <DialogDescription>
                Changer le niveau d'accès pour {user?.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role-select">Nouveau rôle</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button onClick={handleSaveClick}>Continuer</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmer le changement
              </DialogTitle>
              <DialogDescription className="py-2">
                Êtes-vous sûr de vouloir changer le rôle de <strong>{user?.name}</strong> de <span className="underline">{user?.role}</span> à <strong>{selectedRole}</strong> ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={loading}>
                Annuler
              </Button>
              <Button onClick={confirmUpdate} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};