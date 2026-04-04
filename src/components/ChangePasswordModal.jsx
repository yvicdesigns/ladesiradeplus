import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Check, X } from 'lucide-react';

export const ChangePasswordModal = ({ open, onClose }) => {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const newPassword = watch('new_password', '');

  const requirements = [
    { text: "At least 8 characters", valid: newPassword.length >= 8 },
    { text: "Contains uppercase letter", valid: /[A-Z]/.test(newPassword) },
    { text: "Contains number", valid: /[0-9]/.test(newPassword) }
  ];

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: data.new_password
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully.",
        className: "bg-amber-500 text-white"
      });
      
      reset();
      onClose();
    } catch (error) {
      console.error('Password update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Enter your new password below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input 
              id="new_password" 
              type="password"
              {...register('new_password', { 
                required: 'New password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
                pattern: { value: /^(?=.*[A-Z])(?=.*[0-9])/, message: 'Must contain uppercase and number' }
              })} 
            />
          </div>

          <div className="space-y-1 bg-muted/30 p-3 rounded-md">
            <p className="text-xs font-semibold mb-2">Password Strength:</p>
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {req.valid ? <Check className="h-3 w-3 text-amber-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                <span className={req.valid ? "text-amber-600" : "text-muted-foreground"}>{req.text}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input 
              id="confirm_password" 
              type="password"
              {...register('confirm_password', { 
                required: 'Please confirm password',
                validate: val => val === newPassword || "Passwords do not match"
              })} 
            />
            {errors.confirm_password && <span className="text-xs text-red-500">{errors.confirm_password.message}</span>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};