import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminNotificationsTab = () => {
  const { user } = useAuth();
  
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: false,
    notification_types: {
      reservation_alerts: true,
      order_alerts: true,
      review_alerts: true,
      marketing_emails: false
    }
  });
  
  const [prefsId, setPrefsId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const { toast } = useToast();

  const fetchPrefs = async () => {
    if (!user || !user.id) return;
    try {
      setLoading(true);
      setFetchError(null);
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) throw error;

      if (data) {
        setPreferences({
          email_enabled: data.email_enabled ?? true,
          sms_enabled: data.sms_enabled ?? false,
          push_enabled: data.push_enabled ?? false,
          notification_types: {
            reservation_alerts: data.notification_types?.reservation_alerts ?? true,
            order_alerts: data.notification_types?.order_alerts ?? true,
            review_alerts: data.notification_types?.review_alerts ?? true,
            marketing_emails: data.notification_types?.marketing_emails ?? false
          }
        });
        setPrefsId(data.id);
      }
    } catch (error) {
      console.error('[AdminNotificationsTab] Error fetching preferences:', error);
      setFetchError(error.message || "Impossible de charger les préférences de notification. Vérifiez les règles RLS.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrefs();
  }, [user]);

  const handleMainToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTypeToggle = (key) => {
    setPreferences(prev => {
      const currentTypes = prev.notification_types || {};
      return {
        ...prev,
        notification_types: {
          ...currentTypes,
          [key]: !currentTypes[key]
        }
      };
    });
  };

  const handleSave = async () => {
    if (!user || !user.id) {
      toast({ variant: "destructive", title: "Erreur", description: "Utilisateur non authentifié." });
      return;
    }
    
    try {
      setLoading(true);
      const payload = { 
        user_id: user.id, // CRITICAL: Explicitly set user_id for RLS check
        email_enabled: preferences.email_enabled,
        sms_enabled: preferences.sms_enabled,
        push_enabled: preferences.push_enabled,
        notification_types: preferences.notification_types,
        updated_at: new Date().toISOString() 
      };

      if (prefsId) {
        payload.id = prefsId;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        // Log detailed RLS error
        console.error('[AdminNotificationsTab] RLS or constraint violation during save:', error);
        throw error;
      }

      if (data) {
        setPrefsId(data.id);
      }

      toast({
        title: "Succès",
        description: "Préférences sauvegardées avec succès.",
        className: "bg-amber-500 text-white"
      });
    } catch (error) {
      console.error('[AdminNotificationsTab] Error saving preferences:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: error.message?.includes('row-level security') 
          ? "Violation des règles de sécurité (RLS). Impossible de sauvegarder." 
          : "Échec de la sauvegarde des préférences.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ToggleItem = ({ id, label, description, checked, onChange }) => (
    <div className="flex items-center justify-between space-x-2 py-4 border-b last:border-0">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-base">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch 
        id={id} 
        checked={checked} 
        onCheckedChange={onChange} 
        disabled={loading}
      />
    </div>
  );

  const getNotificationType = (key) => {
    return preferences?.notification_types?.[key] ?? false;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Préférences de Notification</CardTitle>
            <CardDescription>Gérez comment vous recevez les alertes et les mises à jour.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchPrefs} disabled={loading} title="Rafraîchir">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fetchError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur d'accès aux données</AlertTitle>
            <AlertDescription>
              {fetchError}
              <div className="mt-2 text-xs opacity-80">
                L'administrateur système doit vérifier les règles RLS sur la table <code>notification_preferences</code>.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wider">Canaux de communication</h3>
          <ToggleItem 
            id="email_enabled" 
            label="Notifications par Email" 
            description="Recevoir les mises à jour générales par email." 
            checked={preferences.email_enabled}
            onChange={() => handleMainToggle('email_enabled')}
          />
          <ToggleItem 
            id="sms_enabled" 
            label="Notifications SMS" 
            description="Recevoir les alertes urgentes par SMS." 
            checked={preferences.sms_enabled}
            onChange={() => handleMainToggle('sms_enabled')}
          />
          <ToggleItem 
            id="push_enabled" 
            label="Notifications Push" 
            description="Recevoir les notifications sur votre appareil mobile." 
            checked={preferences.push_enabled}
            onChange={() => handleMainToggle('push_enabled')}
          />

          <h3 className="font-medium text-sm text-muted-foreground mt-6 mb-2 uppercase tracking-wider">Types d'alertes</h3>
          <ToggleItem 
            id="reservation_alerts" 
            label="Alertes de Réservation" 
            description="Être notifié lors d'une nouvelle réservation de table." 
            checked={getNotificationType('reservation_alerts')}
            onChange={() => handleTypeToggle('reservation_alerts')}
          />
          <ToggleItem 
            id="order_alerts" 
            label="Alertes de Commande" 
            description="Être notifié pour les nouvelles commandes." 
            checked={getNotificationType('order_alerts')}
            onChange={() => handleTypeToggle('order_alerts')}
          />
          <ToggleItem 
            id="review_alerts" 
            label="Alertes d'Avis" 
            description="Être notifié lorsqu'un client laisse un avis." 
            checked={getNotificationType('review_alerts')}
            onChange={() => handleTypeToggle('review_alerts')}
          />
        </div>
        <div className="pt-6">
          <Button onClick={handleSave} disabled={loading || !!fetchError}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder les préférences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};