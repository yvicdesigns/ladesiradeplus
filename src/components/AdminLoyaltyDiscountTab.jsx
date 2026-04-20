import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { clearLoyaltyCache } from '@/hooks/useLoyaltyDiscount';

export const AdminLoyaltyDiscountTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const [percent, setPercent] = useState(5);

  useEffect(() => {
    supabase
      .from('admin_settings')
      .select('id, loyalty_discount_enabled, loyalty_discount_percent')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettingsId(data.id);
          setEnabled(data.loyalty_discount_enabled ?? true);
          setPercent(parseFloat(data.loyalty_discount_percent ?? 5));
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    const { error } = await supabase
      .from('admin_settings')
      .update({
        loyalty_discount_enabled: enabled,
        loyalty_discount_percent: percent,
      })
      .eq('id', settingsId);

    setSaving(false);
    clearLoyaltyCache();

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Réduction fidélité mise à jour', description: `${enabled ? `${percent}% activé` : 'Désactivé'}` });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Gift className="w-5 h-5 text-[#D97706]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Réduction Fidélité</h2>
          <p className="text-sm text-gray-500">Appliquée automatiquement à chaque commande client</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paramètre global</CardTitle>
          <CardDescription>
            Cette réduction s'applique sur tous les plats. Vous pouvez la modifier plat par plat depuis la gestion du menu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="loyalty-enabled" className="font-medium">Activer la réduction fidélité</Label>
              <p className="text-sm text-gray-500 mt-0.5">Tous les clients connectés bénéficient de cette réduction</p>
            </div>
            <Switch
              id="loyalty-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className={`space-y-2 transition-opacity ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <Label htmlFor="loyalty-percent" className="font-medium">Pourcentage de réduction (%)</Label>
            <div className="flex items-center gap-3">
              <Input
                id="loyalty-percent"
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={percent}
                onChange={e => setPercent(parseFloat(e.target.value) || 0)}
                className="w-28"
              />
              <span className="text-sm text-gray-500">% sur chaque commande</span>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              Exemple : pour une commande de 10 000 XAF, le client paie {Math.round(10000 * (1 - percent / 100)).toLocaleString()} XAF (économie de {Math.round(10000 * percent / 100).toLocaleString()} XAF)
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2 w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-blue-50/50">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-semibold">Comment ça fonctionne ?</p>
              <ul className="space-y-1 text-blue-700 list-disc list-inside">
                <li>La réduction s'affiche dans le panier et au checkout</li>
                <li>Elle s'applique après les promos plat et avant les codes promo</li>
                <li>Vous pouvez définir un % différent par plat dans "Gestion du Menu"</li>
                <li>Mettre 0% sur un plat désactive la réduction pour ce plat uniquement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoyaltyDiscountTab;
