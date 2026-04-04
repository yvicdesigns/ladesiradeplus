import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Smartphone } from 'lucide-react';

export const AdminPaymentSettingsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // State to hold values and their specific IDs from the config table
  const [config, setConfig] = useState({
    mtn_mobile_money: { value: '', id: null },
    airtel_mobile_money: { value: '', id: null }
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setInitialLoading(true);
      // Fetch specific keys we are interested in
      const { data, error } = await supabase
        .from('admin_config')
        .select('*')
        .in('config_key', ['mtn_mobile_money', 'airtel_mobile_money']);

      if (error) throw error;

      const newConfig = {
        mtn_mobile_money: { value: '', id: null },
        airtel_mobile_money: { value: '', id: null }
      };

      // Map the fetched rows to our state
      if (data && data.length > 0) {
        data.forEach(item => {
          if (item.config_key === 'mtn_mobile_money') {
            newConfig.mtn_mobile_money = { value: item.config_value || '', id: item.id };
          } else if (item.config_key === 'airtel_mobile_money') {
            newConfig.airtel_mobile_money = { value: item.config_value || '', id: item.id };
          }
        });
      }
      
      setConfig(newConfig);
    } catch (error) {
      console.error('Error fetching admin config:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les configurations de paiement."
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = [];
      const timestamp = new Date().toISOString();

      // Prepare MTN update/insert
      const mtnPayload = {
        config_key: 'mtn_mobile_money',
        config_value: config.mtn_mobile_money.value,
        description: 'MTN Mobile Money Number',
        updated_at: timestamp
      };
      if (config.mtn_mobile_money.id) {
        mtnPayload.id = config.mtn_mobile_money.id;
      }
      updates.push(mtnPayload);

      // Prepare Airtel update/insert
      const airtelPayload = {
        config_key: 'airtel_mobile_money',
        config_value: config.airtel_mobile_money.value,
        description: 'Airtel Mobile Money Number',
        updated_at: timestamp
      };
      if (config.airtel_mobile_money.id) {
        airtelPayload.id = config.airtel_mobile_money.id;
      }
      updates.push(airtelPayload);

      // Perform upsert
      const { data, error } = await supabase
        .from('admin_config')
        .upsert(updates)
        .select();

      if (error) throw error;

      // Update local state with new IDs if they were created
      if (data) {
        const updatedConfig = { ...config };
        data.forEach(item => {
          if (item.config_key === 'mtn_mobile_money') {
            updatedConfig.mtn_mobile_money = { value: item.config_value, id: item.id };
          } else if (item.config_key === 'airtel_mobile_money') {
            updatedConfig.airtel_mobile_money = { value: item.config_value, id: item.id };
          }
        });
        setConfig(updatedConfig);
      }

      toast({
        title: "Configuration sauvegardée",
        description: "Les numéros Mobile Money ont été mis à jour avec succès."
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration."
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Configuration Mobile Money
          </CardTitle>
          <CardDescription>
            Définissez les numéros de téléphone pour recevoir les paiements MTN et Airtel Money.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mtn">Numéro MTN Mobile Money</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  MTN
                </span>
                <Input
                  id="mtn"
                  placeholder="Ex: 05 00 00 00 00"
                  value={config.mtn_mobile_money.value}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    mtn_mobile_money: { ...config.mtn_mobile_money, value: e.target.value } 
                  })}
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">Numéro qui sera affiché aux clients pour les transferts MTN.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="airtel">Numéro Airtel Money</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  Airtel
                </span>
                <Input
                  id="airtel"
                  placeholder="Ex: 04 00 00 00 00"
                  value={config.airtel_mobile_money.value}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    airtel_mobile_money: { ...config.airtel_mobile_money, value: e.target.value } 
                  })}
                  className="rounded-l-none"
                />
              </div>
              <p className="text-xs text-muted-foreground">Numéro qui sera affiché aux clients pour les transferts Airtel.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer les modifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};