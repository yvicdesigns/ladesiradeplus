import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const ToastService = {
  success: (message, title = "Succès") => {
    toast({
      title: title,
      description: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-amber-500" />
          <span>{message}</span>
        </div>
      ),
      className: "border-amber-200 bg-amber-50 text-amber-900",
      duration: 4000,
    });
  },
  
  error: (message, title = "Erreur") => {
    toast({
      title: title,
      description: (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span>{message}</span>
        </div>
      ),
      variant: "destructive",
      duration: 4000,
    });
  },
  
  warning: (message, title = "Attention") => {
    toast({
      title: title,
      description: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>{message}</span>
        </div>
      ),
      className: "border-amber-200 bg-amber-50 text-amber-900",
      duration: 4000,
    });
  },
  
  info: (message, title = "Information") => {
    toast({
      title: title,
      description: (
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span>{message}</span>
        </div>
      ),
      className: "border-blue-200 bg-blue-50 text-blue-900",
      duration: 4000,
    });
  }
};