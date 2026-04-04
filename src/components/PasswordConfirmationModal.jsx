import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Check, Copy, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export const PasswordConfirmationModal = ({ open, onClose, password, email }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast({
        title: "Copié !",
        description: "Mot de passe copié dans le presse-papier.",
        className: "bg-green-600 text-white"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de copier le mot de passe."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Check className="h-5 w-5" />
            Utilisateur créé avec succès
          </DialogTitle>
          <DialogDescription>
            Le compte pour <strong>{email}</strong> a été créé.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Important :</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Copiez ce mot de passe maintenant.</li>
                <li>Partagez-le de manière sécurisée avec l'utilisateur.</li>
                <li>Il ne sera plus jamais affiché par la suite.</li>
              </ul>
            </div>
          </div>

          <div className="relative">
            <div className="bg-muted p-4 rounded-lg border font-mono text-lg text-center break-all pr-12">
              {showPassword ? password : '••••••••••••••••'}
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleCopy}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copier le mot de passe
            </Button>
            <Button 
              type="button" 
              className="w-full sm:w-auto mt-2 sm:mt-0"
              onClick={onClose}
            >
              Fermer
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};