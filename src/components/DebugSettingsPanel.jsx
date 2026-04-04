import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function DebugSettingsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Configuration Debug</CardTitle>
        <CardDescription>Paramètres de l'outil de maintenance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Mode Verbeux</Label>
            <p className="text-xs text-muted-foreground">Afficher tous les détails techniques</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Persistance Locale</Label>
            <p className="text-xs text-muted-foreground">Sauvegarder les logs dans le navigateur</p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Logs Réseau</Label>
            <p className="text-xs text-muted-foreground">Capturer les requêtes fetch/XHR</p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}