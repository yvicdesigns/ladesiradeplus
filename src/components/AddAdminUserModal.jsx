import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Eye, EyeOff, Check, X } from 'lucide-react';
import { validatePassword, generateRandomPassword } from '@/lib/passwordValidator';
import { PasswordConfirmationModal } from '@/components/PasswordConfirmationModal';

export const AddAdminUserModal = ({ open, onClose, onSuccess }) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: { role: 'user', password: '' }
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, errors: [] });
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [createdUserEmail, setCreatedUserEmail] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const { toast } = useToast();
  const password = watch('password');

  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password));
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
    }
  }, [password]);

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setValue('password', newPassword, { shouldValidate: true, shouldDirty: true });
  };

  const handleClose = () => {
    if (showConfirmation) {
      // If closing from confirmation, just reset fully
      setShowConfirmation(false);
      setGeneratedPassword(null);
      setCreatedUserEmail(null);
      onSuccess?.(); // Refresh parent list
      onClose();
    } else {
      // If closing form, just close
      onClose();
    }
  };

  const onSubmit = async (data) => {
    // Final validation check
    const validation = validatePassword(data.password);
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Mot de passe invalide",
        description: "Veuillez respecter tous les critères de sécurité."
      });
      return;
    }

    try {
      setLoading(true);

      const { data: result, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: data.email,
          name: data.name,
          role: data.role,
          phone: data.phone || '', // Optional
          password: data.password
        }
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error || "Une erreur inconnue est survenue.");

      // Success
      setGeneratedPassword(data.password);
      setCreatedUserEmail(data.email);
      reset();
      setShowConfirmation(true);
      
    } catch (error) {
      console.error('Create user error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Requirement indicator helper
  const Requirement = ({ met, text }) => (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-amber-600' : 'text-muted-foreground'}`}>
      {met ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current opacity-50" />}
      <span className={met ? 'font-medium' : ''}>{text}</span>
    </div>
  );

  if (showConfirmation) {
    return (
      <PasswordConfirmationModal 
        open={open} 
        onClose={handleClose} 
        password={generatedPassword} 
        email={createdUserEmail} 
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>Créer un nouveau compte pour votre équipe avec un mot de passe sécurisé.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" {...register('name', { required: 'Le nom est requis' })} placeholder="Jean Dupont" />
              {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone (Optionnel)</Label>
              <Input id="phone" {...register('phone')} placeholder="+33 6..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email', { required: "L'email est requis" })} placeholder="jean@example.com" />
            {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select onValueChange={(val) => setValue('role', val)} defaultValue="user">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleGeneratePassword}
                className="h-7 text-xs gap-1.5"
              >
                <RefreshCw className="h-3 w-3" />
                Générer
              </Button>
            </div>
            
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                {...register('password', { required: "Le mot de passe est requis" })} 
                className="pr-10 font-mono"
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-md border border-border/50">
              <Requirement met={password?.length >= 8} text="8+ caractères" />
              <Requirement met={/[A-Z]/.test(password || '')} text="1 majuscule" />
              <Requirement met={/[a-z]/.test(password || '')} text="1 minuscule" />
              <Requirement met={/\d/.test(password || '')} text="1 chiffre" />
              <Requirement met={/[!@#$%^&*]/.test(password || '')} text="1 caractère spécial" />
            </div>
            
            {errors.password && <span className="text-xs text-red-500 block">{errors.password.message}</span>}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>Annuler</Button>
            <Button 
              type="submit" 
              disabled={loading || !passwordValidation.isValid} 
              className="bg-primary text-primary-foreground"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};