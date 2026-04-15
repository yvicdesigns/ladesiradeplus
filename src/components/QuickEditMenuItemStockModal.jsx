import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useStockManagement } from '@/hooks/useStockManagement';
import { Loader2, Plus, Minus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

export const QuickEditMenuItemStockModal = ({ isOpen, onClose, menuItem, onSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState('set');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { updateStockQuantity, loading } = useStockManagement();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && menuItem) {
      setAdjustmentType('set');
      // null = unlimited; initialise to empty so admin must explicitly set a value
      setValue(menuItem.stock_quantity !== null ? menuItem.stock_quantity.toString() : '');
      setNotes('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, menuItem]);

  const calculateNewStock = () => {
    const numValue = parseInt(value || '0', 10);
    const currentStock = parseInt(menuItem?.stock_quantity || '0', 10);
    
    if (isNaN(numValue)) return currentStock;

    if (adjustmentType === 'set') return numValue;
    if (adjustmentType === 'add') return currentStock + numValue;
    if (adjustmentType === 'subtract') return currentStock - numValue;
    return currentStock;
  };

  const newStockPreview = calculateNewStock();
  const isInvalid = newStockPreview < 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!menuItem || isInvalid) return;

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    let isAbsolute = false;
    let quantityChange = 0;

    if (adjustmentType === 'set') {
      isAbsolute = true;
      quantityChange = numValue;
    } else if (adjustmentType === 'add') {
      quantityChange = numValue;
    } else if (adjustmentType === 'subtract') {
      quantityChange = -numValue;
    }

    const result = await updateStockQuantity(menuItem.id, quantityChange, isAbsolute, notes || 'Ajustement manuel');
    
    if (result.success) {
      setSuccess(true);
      toast({
        title: "Stock mis à jour",
        description: `Le stock de ${menuItem.name} a été modifié avec succès.`,
        variant: "default",
        className: "bg-amber-50 text-amber-900 border-amber-200"
      });
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } else {
      const errMsg = result.error?.message || "Une erreur inattendue est survenue.";
      setError(errMsg);
      toast({
        title: "Erreur de mise à jour",
        description: errMsg,
        variant: "destructive"
      });
    }
  };

  const adjustValue = (delta) => {
    const currentVal = parseInt(value || '0', 10);
    const newVal = Math.max(0, currentVal + delta);
    setValue(newVal.toString());
  };

  if (!menuItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Ajuster le stock du plat</DialogTitle>
          <DialogDescription className="font-medium text-gray-900">
            {menuItem.name} (Stock actuel: <span className="font-bold text-blue-600">{menuItem.stock_quantity === null ? '∞ Illimité' : menuItem.stock_quantity}</span>)
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="py-2 border-green-500 bg-amber-50 text-amber-800">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              <AlertTitle>Succès</AlertTitle>
              <AlertDescription>Mise à jour effectuée.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label className="text-gray-700">Type d'opération</Label>
            <RadioGroup value={adjustmentType} onValueChange={setAdjustmentType} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set" id="type-set" />
                <Label htmlFor="type-set" className="cursor-pointer font-normal">Définir à</Label>
              </div>
              <div className="flex items-center space-x-2 text-amber-700">
                <RadioGroupItem value="add" id="type-add" />
                <Label htmlFor="type-add" className="cursor-pointer font-normal">Ajouter (+)</Label>
              </div>
              <div className="flex items-center space-x-2 text-red-700">
                <RadioGroupItem value="subtract" id="type-subtract" />
                <Label htmlFor="type-subtract" className="cursor-pointer font-normal">Retirer (-)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label htmlFor="stock-value" className="text-gray-700">Quantité</Label>
            <div className="flex items-center gap-3">
               <Button type="button" variant="outline" size="icon" onClick={() => adjustValue(-1)} disabled={parseInt(value || '0') <= 0 || loading || success}>
                  <Minus className="h-4 w-4" />
               </Button>
               <Input
                 id="stock-value"
                 type="number"
                 min="0"
                 required
                 value={value}
                 onChange={(e) => setValue(e.target.value)}
                 disabled={loading || success}
                 className="text-center text-lg font-bold w-24 h-10 text-gray-900"
               />
               <Button type="button" variant="outline" size="icon" onClick={() => adjustValue(1)} disabled={loading || success}>
                  <Plus className="h-4 w-4" />
               </Button>
            </div>
            
            <div className={`text-sm font-medium ${isInvalid ? 'text-red-600' : 'text-gray-500'}`}>
              Nouveau stock estimé : <span className={`text-lg font-bold ml-1 ${isInvalid ? 'text-red-600' : 'text-blue-600'}`}>{newStockPreview}</span>
              {isInvalid && " (Le stock ne peut pas être négatif)"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-700">Motif / Notes (Requis pour l'historique)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Réception fournisseur, Perte, Erreur d'inventaire..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading || success}
              className="resize-none h-20 text-gray-900"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading || success}>
              Annuler
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={loading || value === '' || isInvalid || success || !notes.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer l'ajustement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};