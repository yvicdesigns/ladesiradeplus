import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Zap, Clock, RotateCcw, Info, ChevronRight, Loader2, CheckCircle2, AlertTriangle, Server } from 'lucide-react';
import { DEFAULT_WORKFLOW_SETTINGS, PROGRESSION_RULES } from '@/hooks/useOrderAutoProgression';

const STEP_COLORS = {
  pending_to_confirmed:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed_to_preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing_to_ready:     'bg-purple-100 text-purple-800 border-purple-200',
  ready_to_in_transit:    'bg-orange-100 text-orange-800 border-orange-200',
  in_transit_to_delivered:'bg-green-100 text-green-800 border-green-200',
};

const STATUS_LABELS = {
  pending:    'En attente',
  confirmed:  'Confirmée',
  preparing:  'En préparation',
  ready:      'Prête',
  in_transit: 'En route',
  delivered:  'Livrée',
};

export const WorkflowSettingsPanel = ({ settings, onUpdate, saving = false, dbAvailable = false }) => {
  const { toast } = useToast();

  const toggleGlobal = (enabled) => {
    onUpdate({ ...settings, enabled });
  };

  const toggleStep = (key, enabled) => {
    onUpdate({
      ...settings,
      steps: {
        ...settings.steps,
        [key]: { ...settings.steps[key], enabled }
      }
    });
  };

  const updateMinutes = (key, value) => {
    const minutes = Math.max(1, Math.min(480, parseInt(value) || 1));
    onUpdate({
      ...settings,
      steps: {
        ...settings.steps,
        [key]: { ...settings.steps[key], minutes }
      }
    });
  };

  const resetToDefaults = () => {
    onUpdate(DEFAULT_WORKFLOW_SETTINGS);
    toast({ description: 'Paramètres réinitialisés aux valeurs par défaut.' });
  };

  // Calcul du temps total estimé (étapes actives seulement)
  const totalMinutes = PROGRESSION_RULES.reduce((acc, rule) => {
    const step = settings.steps[rule.key];
    return step?.enabled ? acc + (step.minutes || 0) : acc;
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemainingMin = totalMinutes % 60;
  const totalLabel = totalHours > 0
    ? `${totalHours}h${totalRemainingMin > 0 ? ` ${totalRemainingMin}min` : ''}`
    : `${totalMinutes} min`;

  return (
    <div className="space-y-6">

      {/* Indicateur mode serveur / local */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
        dbAvailable
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <Server className="h-4 w-4 flex-shrink-0" />
        {dbAvailable ? (
          <div>
            <p className="font-semibold">Mode serveur actif</p>
            <p className="text-xs opacity-80">
              La progression fonctionne 24h/24 même si le dashboard est fermé. Les paramètres sont sauvegardés dans Supabase.
            </p>
          </div>
        ) : (
          <div>
            <p className="font-semibold">Mode local (dashboard uniquement)</p>
            <p className="text-xs opacity-80">
              La progression s'arrête si le dashboard est fermé. Pour activer le mode serveur, exécutez le fichier SQL dans Supabase.
              <br />Fichier : <code className="font-mono bg-amber-100 px-1 rounded">supabase/sql/workflow_auto_progression.sql</code>
            </p>
          </div>
        )}
        {saving && (
          <Loader2 className="h-4 w-4 animate-spin ml-auto flex-shrink-0" />
        )}
        {!saving && dbAvailable && (
          <CheckCircle2 className="h-4 w-4 ml-auto flex-shrink-0 text-green-600" />
        )}
      </div>

      {/* Activation globale */}
      <Card className={settings.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${settings.enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Zap className={`h-5 w-5 ${settings.enabled ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <CardTitle className="text-base">Progression automatique</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  Les commandes avancent automatiquement si l'administrateur ne valide pas dans les délais
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={toggleGlobal}
            />
          </div>
        </CardHeader>

        {settings.enabled && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>
                L'admin peut toujours valider manuellement à n'importe quelle étape.
                Le timer repart à zéro à chaque action manuelle.
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Étapes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Délais par étape
              </CardTitle>
              <CardDescription>
                Durée maximale avant avancement automatique à l'étape suivante
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={resetToDefaults} className="text-gray-500 gap-1">
              <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">

          {PROGRESSION_RULES.map((rule, index) => {
            const step = settings.steps[rule.key] ?? DEFAULT_WORKFLOW_SETTINGS.steps[rule.key];
            const isLast = index === PROGRESSION_RULES.length - 1;

            return (
              <div
                key={rule.key}
                className={`rounded-xl border p-4 transition-all ${
                  step.enabled && settings.enabled
                    ? 'bg-white border-gray-200 shadow-sm'
                    : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
              >
                {/* En-tête de l'étape */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs font-medium ${STEP_COLORS[rule.key]}`}>
                      {STATUS_LABELS[rule.from]}
                    </Badge>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    <Badge variant="outline" className={`text-xs font-medium ${STEP_COLORS[rule.key]}`}>
                      {STATUS_LABELS[rule.to]}
                    </Badge>
                    {isLast && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                        Recommandé manuel
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={step.enabled}
                    onCheckedChange={(v) => toggleStep(rule.key, v)}
                    disabled={!settings.enabled}
                  />
                </div>

                {/* Durée */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-gray-600 w-44 flex-shrink-0">
                    Avancement automatique après
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={480}
                      value={step.minutes}
                      onChange={(e) => updateMinutes(rule.key, e.target.value)}
                      disabled={!step.enabled || !settings.enabled}
                      className="w-20 text-center font-mono"
                    />
                    <span className="text-sm text-gray-500">minutes</span>
                    {step.minutes >= 60 && (
                      <span className="text-xs text-gray-400">
                        ({Math.floor(step.minutes / 60)}h{step.minutes % 60 > 0 ? ` ${step.minutes % 60}min` : ''})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Résumé de la durée totale */}
      {settings.enabled && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Durée totale estimée (commande → livraison)</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">{totalLabel}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Basé sur les délais configurés. La durée réelle peut être inférieure si l'admin valide manuellement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
