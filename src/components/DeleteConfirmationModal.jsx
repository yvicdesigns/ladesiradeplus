import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DeleteConfirmationModal = ({ open, onClose, onConfirm, recordType, recordName, dependencies = [], loading = false }) => {
  const hasDependencies = dependencies && dependencies.length > 0;
  
  const handleConfirm = (e) => {
    e.stopPropagation();
    if (onConfirm) onConfirm();
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={(val) => !val && !loading && onClose()}>
          <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white border-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    Êtes-vous sûr de vouloir supprimer?
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 pt-3 text-base">
                    Vous êtes sur le point de supprimer {recordType ? <strong>{recordType}</strong> : "cet élément"} : <br/>
                    <span className="inline-block mt-2 font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {recordName || 'Élément sélectionné'}
                    </span>
                  </DialogDescription>
                </DialogHeader>
                
                {hasDependencies && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 text-red-800">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Dépendances détectées</h4>
                        <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
                          {dependencies.map((dep, idx) => (
                            <li key={idx}>
                              {dep.count} {dep.name} seront affectés
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="mt-6 gap-3 sm:gap-0">
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={loading}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
                  >
                    Annuler
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleConfirm} 
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Supprimer
                  </Button>
                </DialogFooter>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};