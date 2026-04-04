import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * Composant réutilisable pour un champ de formulaire (Input)
 */
export const FormInput = React.forwardRef(({ 
  label, 
  id, 
  error, 
  helperText, 
  className, 
  containerClassName, 
  ...props 
}, ref) => {
  return (
    <div className={cn("grid w-full items-center gap-1.5", containerClassName)}>
      {label && (
        <Label htmlFor={id} className={cn(error && "text-destructive")}>
          {label}
        </Label>
      )}
      <Input
        id={id}
        ref={ref}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted-foreground mt-1">{helperText}</p>}
    </div>
  );
});
FormInput.displayName = 'FormInput';

/**
 * Composant réutilisable pour un champ de texte long (Textarea)
 */
export const FormTextarea = React.forwardRef(({ 
  label, 
  id, 
  error, 
  helperText, 
  className, 
  containerClassName, 
  ...props 
}, ref) => {
  return (
    <div className={cn("grid w-full items-center gap-1.5", containerClassName)}>
      {label && (
        <Label htmlFor={id} className={cn(error && "text-destructive")}>
          {label}
        </Label>
      )}
      <Textarea
        id={id}
        ref={ref}
        className={cn(
          "resize-none min-h-[100px]",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-muted-foreground mt-1">{helperText}</p>}
    </div>
  );
});
FormTextarea.displayName = 'FormTextarea';