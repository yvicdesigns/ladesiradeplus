import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EditAdminProfileModal } from '@/components/EditAdminProfileModal';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { User, Mail, Phone, Shield, LogOut, Key } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const AdminProfileTab = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
        
      if (error) throw error;
      
      setProfile(data || { email: user?.email, role: 'admin' });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  if (loading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.settings.profile.title', 'Informations Personnelles')}</CardTitle>
          <CardDescription>{t('admin.settings.profile.desc', 'Gérez les détails de votre profil.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">{t('admin.settings.profile.full_name', 'Nom Complet')}</label>
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">{profile?.full_name || t('admin.settings.profile.not_set', 'Non défini')}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">{t('admin.settings.profile.email', 'Email')}</label>
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-medium">{user?.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">{t('admin.settings.profile.phone', 'Téléphone')}</label>
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-medium">{profile?.phone || t('admin.settings.profile.not_set', 'Non défini')}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">{t('admin.settings.profile.role', 'Rôle')}</label>
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/20">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium capitalize">{profile?.role || 'User'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <Button onClick={() => setShowEditModal(true)}>
              {t('admin.settings.profile.edit_btn', 'Modifier')}
            </Button>
            <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
              <Key className="mr-2 h-4 w-4" /> {t('admin.settings.profile.pwd_btn', 'Mot de passe')}
            </Button>
            <Button variant="destructive" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> {t('admin.settings.profile.logout_btn', 'Déconnexion')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditAdminProfileModal 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)}
        profile={{...profile, id: profile?.id || user?.id, user_id: profile?.user_id || user?.id, email: user?.email}}
        onSuccess={fetchProfile}
      />
      
      <ChangePasswordModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};