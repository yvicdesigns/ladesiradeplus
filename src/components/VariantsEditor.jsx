import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export const VariantsEditor = ({ variants, onChange }) => {
  const addVariant = () => {
    onChange([...variants, { name: '', is_required: true, options: [{ label: '', price_adjustment: 0 }] }]);
  };

  const removeVariant = (vi) => {
    onChange(variants.filter((_, i) => i !== vi));
  };

  const updateVariant = (vi, field, value) => {
    const updated = variants.map((v, i) => i === vi ? { ...v, [field]: value } : v);
    onChange(updated);
  };

  const addOption = (vi) => {
    const updated = variants.map((v, i) =>
      i === vi ? { ...v, options: [...(v.options || []), { label: '', price_adjustment: 0 }] } : v
    );
    onChange(updated);
  };

  const removeOption = (vi, oi) => {
    const updated = variants.map((v, i) =>
      i === vi ? { ...v, options: v.options.filter((_, j) => j !== oi) } : v
    );
    onChange(updated);
  };

  const updateOption = (vi, oi, field, value) => {
    const updated = variants.map((v, i) =>
      i === vi ? {
        ...v,
        options: v.options.map((o, j) => j === oi ? { ...o, [field]: value } : o)
      } : v
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Variantes</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Ex: Taille (Petit/Moyen/Grand), Cuisson...</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </Button>
      </div>

      {variants.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
          Aucune variante — cliquez "Ajouter" pour en créer une
        </p>
      )}

      {variants.map((variant, vi) => (
        <div key={vi} className="border rounded-xl p-4 space-y-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
            <Input
              placeholder="Nom du groupe (ex: Taille)"
              value={variant.name}
              onChange={e => updateVariant(vi, 'name', e.target.value)}
              className="flex-1 bg-white"
            />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-muted-foreground">Obligatoire</span>
              <Switch
                checked={variant.is_required}
                onCheckedChange={v => updateVariant(vi, 'is_required', v)}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
            <button type="button" onClick={() => removeVariant(vi)} className="text-red-400 hover:text-red-600 flex-shrink-0">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="pl-6 space-y-2">
            {(variant.options || []).map((option, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <Input
                  placeholder="Option (ex: Petit)"
                  value={option.label}
                  onChange={e => updateOption(vi, oi, 'label', e.target.value)}
                  className="flex-1 bg-white text-sm h-9"
                />
                <div className="flex items-center gap-1 w-32 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">+</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={option.price_adjustment}
                    onChange={e => updateOption(vi, oi, 'price_adjustment', e.target.value)}
                    className="bg-white text-sm h-9"
                  />
                  <span className="text-xs text-muted-foreground">F</span>
                </div>
                <button type="button" onClick={() => removeOption(vi, oi)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addOption(vi)}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 mt-1"
            >
              <Plus className="h-3 w-3" /> Ajouter une option
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
