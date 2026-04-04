import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Volume2, AppWindow } from 'lucide-react';
import { useDeliveryOrderNotifications } from '@/hooks/useDeliveryOrderNotifications';
import { Button } from '@/components/ui/button';
import { playNotificationSound } from '@/lib/soundUtils';

export const AdminDeliverySettingsTab = () => {
  const { prefs, updatePreferences } = useDeliveryOrderNotifications();

  // Defensive check: Ensure prefs exists before access
  const safePrefs = prefs || { sound_enabled: false, toast_enabled: false };

  const handleSoundTest = () => {
    playNotificationSound(0.5, 'chime');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notifications de Livraison</CardTitle>
          </div>
          <CardDescription>
            Gérez la façon dont vous êtes alerté des nouvelles commandes de livraison.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center justify-between space-x-2 border-b pb-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                 <Volume2 className="h-4 w-4 text-gray-500" />
                 <Label htmlFor="sound-notifications" className="font-medium">Alertes Sonores</Label>
              </div>
              <span className="text-sm text-muted-foreground pl-6">
                Jouer un son lorsqu'une nouvelle commande arrive.
              </span>
            </div>
            <div className="flex items-center gap-4">
               <Button variant="outline" size="sm" onClick={handleSoundTest}>Tester le son</Button>
               <Switch 
                id="sound-notifications" 
                checked={safePrefs?.sound_enabled ?? false}
                onCheckedChange={(checked) => updatePreferences && updatePreferences({ sound_enabled: checked })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                 <AppWindow className="h-4 w-4 text-gray-500" />
                 <Label htmlFor="toast-notifications" className="font-medium">Notifications Visuelles</Label>
              </div>
              <span className="text-sm text-muted-foreground pl-6">
                Afficher une bannière (toast) en bas de l'écran.
              </span>
            </div>
            <Switch 
              id="toast-notifications" 
              checked={safePrefs?.toast_enabled ?? false}
              onCheckedChange={(checked) => updatePreferences && updatePreferences({ toast_enabled: checked })}
            />
          </div>

        </CardContent>
      </Card>
    </div>
  );
};