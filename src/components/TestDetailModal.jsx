import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TEST_STATUS } from '@/lib/testDefinitions';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export const TestDetailModal = ({ isOpen, onClose, test, initialResult, onSave }) => {
  const [status, setStatus] = useState(TEST_STATUS.NOT_RUN);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && test) {
      setStatus(initialResult?.status || TEST_STATUS.NOT_RUN);
      setNotes(initialResult?.notes || '');
    }
  }, [isOpen, test, initialResult]);

  if (!test) return null;

  const handleSave = () => {
    onSave(test.id, status, notes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
             <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">{test.category}</span>
             <span className="text-gray-400 text-xs font-mono">{test.id}</span>
          </div>
          <DialogTitle className="text-xl">{test.name}</DialogTitle>
          <DialogDescription className="text-base text-gray-700 mt-2">
            {test.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          {/* Instructions */}
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-3">
            <div>
              <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1 mb-1">
                <Info className="w-4 h-4" /> Étapes de test :
              </h4>
              <ul className="list-decimal pl-5 text-sm text-blue-800 space-y-1">
                {test.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="pt-2 border-t border-blue-100/50">
               <h4 className="font-bold text-sm text-blue-900 mb-1">Comportement Attendu :</h4>
               <p className="text-sm text-blue-800 font-medium">{test.expectedBehavior}</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-bold mb-3 block text-gray-900">Résultat du test</Label>
              <RadioGroup value={status} onValueChange={setStatus} className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:bg-amber-50 has-[:checked]:border-amber-200">
                  <RadioGroupItem value={TEST_STATUS.PASS} id="pass" />
                  <Label htmlFor="pass" className="flex items-center gap-2 cursor-pointer font-bold text-amber-700">
                    <CheckCircle2 className="w-4 h-4" /> Succès
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:bg-red-50 has-[:checked]:border-red-200">
                  <RadioGroupItem value={TEST_STATUS.FAIL} id="fail" />
                  <Label htmlFor="fail" className="flex items-center gap-2 cursor-pointer font-bold text-red-700">
                    <XCircle className="w-4 h-4" /> Échec
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:bg-yellow-50 has-[:checked]:border-yellow-200">
                  <RadioGroupItem value={TEST_STATUS.WARNING} id="warn" />
                  <Label htmlFor="warn" className="flex items-center gap-2 cursor-pointer font-bold text-yellow-700">
                    <AlertTriangle className="w-4 h-4" /> Alerte
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="notes" className="font-bold text-gray-900">Notes & Observations</Label>
              <Textarea 
                id="notes" 
                placeholder="Décrivez les anomalies rencontrées, les numéros d'erreur, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 h-24 resize-none bg-white text-gray-900"
              />
            </div>
          </div>

        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} className="bg-primary text-white">Enregistrer le résultat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};