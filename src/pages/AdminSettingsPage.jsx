import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { handleRLSError } from '@/lib/rlsErrorHandler';
import { Loader2, ShieldAlert, LogOut, Lock, CheckCircle2, Wrench } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';

// Tab Components
import { AdminProfileTab } from '@/components/AdminProfileTab';
import { AdminRestaurantTab } from '@/components/AdminRestaurantTab';
import { RestaurantLogoUploadTab } from '@/components/RestaurantLogoUploadTab';
import { AdminHoursTab } from '@/components/AdminHoursTab';
import { AdminNotificationsTab } from '@/components/AdminNotificationsTab';
import { AdminSoundSettingsTab } from '@/components/AdminSoundSettingsTab';
import { AdminResetSettingsTab } from '@/components/AdminResetSettingsTab';
import { AdminDeliverySettingsTab } from '@/components/AdminDeliverySettingsTab';
import { AdminUsersTab } from '@/components/AdminUsersTab';
import { AdminMobileMoneyPaymentsTab } from '@/components/AdminMobileMoneyPaymentsTab';
import { AdminPaymentSettingsTab } from '@/components/AdminPaymentSettingsTab';
import { AdminSecurityTab } from '@/components/AdminSecurityTab';
import { AdminDataTab } from '@/components/AdminDataTab';
import { WorkflowSettingsPanel } from '@/components/WorkflowSettingsPanel';
import { useOrderAutoProgression } from '@/hooks/useOrderAutoProgression';
import { AdminLoyaltyDiscountTab } from '@/components/AdminLoyaltyDiscountTab';

export const AdminSettingsPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const { settings: workflowSettings, updateSettings: updateWorkflowSettings, saving: workflowSaving, dbAvailable: workflowDbAvailable } = useOrderAutoProgression();
  
  const [initStatus, setInitStatus] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [rlsError, setRlsError] = useState(null);
  
  const tabParam = searchParams.get('tab') || searchParams.get('sub') || searchParams.get('main');
  
  // If tabParam was promo-banner (legacy link), redirect to the new page.
  // Otherwise, use the provided tab or default to 'profile'.
  useEffect(() => {
    if (tabParam === 'promo-banner') {
      navigate('/admin/promo-banner', { replace: true });
    }
  }, [tabParam, navigate]);

  const currentTab = (tabParam && tabParam !== 'promo-banner') ? tabParam : 'profile';

  const checkInitializationStatus = async () => {
    setIsChecking(true);
    setRlsError(null);
    try {
      const { data, error } = await supabase.rpc('check_admin_settings_status');
      if (error) {
        const handledError = handleRLSError(error, 'SELECT', 'admin_settings');
        if (handledError) setRlsError(handledError);
        throw error;
      }
      setInitStatus(data);
    } catch (err) {
      console.error("Failed to check settings status:", err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!authLoading && role === 'admin') {
      checkInitializationStatus();
    }
  }, [authLoading, role]);

  const handleTabChange = (value) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const isManager = role === 'manager';
  const managerAllowedTabs = ['profile', 'restaurant', 'logo', 'hours', 'notifications', 'delivery-alerts', 'loyalty', 'users', 'mobile-money', 'data'];

  useEffect(() => {
    if (!authLoading && role !== 'admin' && role !== 'manager') {
      toast({ variant: "destructive", title: "Accès refusé", description: "Vous n'avez pas accès aux paramètres." });
      const timer = setTimeout(() => navigate('/admin'), 2000);
      return () => clearTimeout(timer);
    }
  }, [role, authLoading, navigate, toast]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error("Logout error:", error);
      navigate('/login');
    }
  };

  const handleInitializeSettings = async () => {
    if (!user) return;
    setIsInitializing(true);
    try {
      const { data, error } = await supabase.rpc('initialize_admin_settings_secure', {
        admin_id: user.id,
        settings: {
          restaurant_name: "Nouveau Restaurant"
        }
      });
      
      if (error) {
        handleRLSError(error, 'INSERT', 'admin_settings');
        throw error;
      }
      if (!data?.success) throw new Error(data?.message || 'Erreur inconnue');
      
      toast({
        title: "Initialisation réussie",
        description: "Les paramètres ont été configurés avec succès.",
      });
      await checkInitializationStatus();
    } catch (err) {
      const handled = handleRLSError(err, 'INSERT', 'admin_settings');
      if (handled) {
        setRlsError(handled);
      }
      toast({
        variant: "destructive",
        title: "Erreur d'initialisation",
        description: err.message || "Impossible d'initialiser les paramètres.",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (authLoading || isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  }

  if (role !== 'admin' && role !== 'manager') {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Accès Refusé</h2>
          <p className="text-muted-foreground text-center max-w-md">Vous n'avez pas accès aux paramètres.</p>
        </div>
      </AdminLayout>
    );
  }

  if (initStatus && !initStatus.initialized) {
    return (
      <AdminLayout>
        <div className="max-w-2xl mx-auto mt-12 space-y-6">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="text-center pb-2">
              <Wrench className="h-12 w-12 mx-auto text-amber-500 mb-2" />
              <CardTitle className="text-2xl text-amber-800">Initialisation Requise</CardTitle>
              <CardDescription className="text-amber-700">
                La table des paramètres n'a pas encore été configurée. Vous devez initialiser les paramètres par défaut avant d'accéder à cette section.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-6 space-y-4">
              {rlsError && (
                <Alert variant="destructive" className="w-full">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Erreur RLS</AlertTitle>
                  <AlertDescription>{rlsError.message}</AlertDescription>
                </Alert>
              )}
              <Button 
                size="lg" 
                onClick={handleInitializeSettings} 
                disabled={isInitializing}
                className="w-full max-w-sm gap-2"
              >
                {isInitializing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                {isInitializing ? "Initialisation en cours..." : "Initialiser les paramètres"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 landscape:space-y-2 pb-12 landscape:pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 landscape:gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl landscape:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {t('admin.settings.title', 'Configuration Système')} <Lock className="h-5 w-5 text-primary opacity-50"/>
            </h1>
            <p className="text-muted-foreground text-sm landscape:text-xs">{t('admin.settings.subtitle', 'Gérez les préférences globales et les outils d\'administration.')}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" onClick={handleLogout} className="gap-2 border-red-200 text-red-600 hover:bg-red-50 min-h-[44px] landscape:min-h-[36px] w-full sm:w-auto">
               <LogOut className="h-4 w-4" /> {t('admin.topbar.logout', 'Déconnexion')}
             </Button>
          </div>
        </div>

        {rlsError && (
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Problème d'accès détecté</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>{rlsError.message}</span>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full space-y-4">
          <div className="w-full border rounded-lg bg-card/50 shadow-sm">
            <ScrollArea className="w-full max-w-[calc(100vw-32px)] lg:max-w-[calc(100vw-280px)]">
              <TabsList className="inline-flex w-max min-w-full justify-start h-12 p-1 bg-transparent">
                <TabsTrigger value="profile">{t('admin.settings.tabs.profile', 'Profil')}</TabsTrigger>
                <TabsTrigger value="restaurant">{t('admin.settings.tabs.restaurant', 'Restaurant')}</TabsTrigger>
                <TabsTrigger value="logo">{t('admin.settings.tabs.logo', 'Logo')}</TabsTrigger>
                <TabsTrigger value="hours">{t('admin.settings.tabs.hours', 'Heures')}</TabsTrigger>
                <TabsTrigger value="notifications">{t('admin.settings.tabs.notifications', 'Notifications')}</TabsTrigger>
                {!isManager && <TabsTrigger value="sound">{t('admin.settings.tabs.sound', 'Sons')}</TabsTrigger>}
                <TabsTrigger value="delivery-alerts">{t('admin.settings.tabs.delivery_alerts', 'Livraison')}</TabsTrigger>
                <TabsTrigger value="loyalty">Fidélité</TabsTrigger>
                {!isManager && <TabsTrigger value="workflow">Flux Auto</TabsTrigger>}
                <TabsTrigger value="users">{t('admin.settings.tabs.users', 'Utilisateurs')}</TabsTrigger>
                <TabsTrigger value="mobile-money">{t('admin.settings.tabs.mobile_money', 'Paiements Mobiles')}</TabsTrigger>
                {!isManager && <TabsTrigger value="security">{t('admin.settings.tabs.security', 'Sécurité')}</TabsTrigger>}
                <TabsTrigger value="data">{t('admin.settings.tabs.data', 'Données')}</TabsTrigger>
                {!isManager && <TabsTrigger value="reset">{t('admin.settings.tabs.reset', 'Réinitialisation')}</TabsTrigger>}
              </TabsList>
              <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>
          </div>

          <div className="bg-card rounded-xl border border-border/50 shadow-sm relative min-h-[400px] p-4 md:p-6">
            <TabsContent value="profile" className="m-0"><AdminProfileTab /></TabsContent>
            <TabsContent value="restaurant" className="m-0"><AdminRestaurantTab /></TabsContent>
            <TabsContent value="logo" className="m-0"><RestaurantLogoUploadTab /></TabsContent>
            <TabsContent value="hours" className="m-0"><AdminHoursTab /></TabsContent>
            <TabsContent value="notifications" className="m-0"><AdminNotificationsTab /></TabsContent>
            <TabsContent value="sound" className="m-0"><AdminSoundSettingsTab /></TabsContent>
            <TabsContent value="delivery-alerts" className="m-0"><AdminDeliverySettingsTab /></TabsContent>
            <TabsContent value="loyalty" className="m-0"><AdminLoyaltyDiscountTab /></TabsContent>
            <TabsContent value="workflow" className="m-0">
              <WorkflowSettingsPanel
                settings={workflowSettings}
                onUpdate={updateWorkflowSettings}
                saving={workflowSaving}
                dbAvailable={workflowDbAvailable}
              />
            </TabsContent>
            <TabsContent value="users" className="m-0"><AdminUsersTab /></TabsContent>
            <TabsContent value="mobile-money" className="m-0">
              <div className="space-y-6">
                <AdminPaymentSettingsTab />
                <AdminMobileMoneyPaymentsTab />
              </div>
            </TabsContent>
            <TabsContent value="security" className="m-0"><AdminSecurityTab /></TabsContent>
            <TabsContent value="data" className="m-0"><AdminDataTab /></TabsContent>
            <TabsContent value="reset" className="m-0"><AdminResetSettingsTab /></TabsContent>
          </div>
        </Tabs>

      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;