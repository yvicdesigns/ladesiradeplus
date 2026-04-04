import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Database, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const AdminBackupPage = () => {
  const { t } = useLanguage();

  return (
    <AdminLayout
      title={t('admin.sidebar.backups') || "Sauvegardes"}
      subtitle="Gestion des sauvegardes de la base de données et des fichiers"
      icon={Database}
    >
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Module de sauvegarde</AlertTitle>
          <AlertDescription>
            La fonctionnalité de sauvegarde automatisée est gérée directement via l'interface d'administration de votre fournisseur de base de données (Supabase).
          </AlertDescription>
        </Alert>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Statut des sauvegardes
          </h2>
          <p className="text-muted-foreground text-sm">
            Les sauvegardes de la base de données sont effectuées automatiquement selon la configuration de votre projet Supabase (Généralement quotidiennes sur le plan Pro).
          </p>
          
          <div className="mt-6 pt-6 border-t">
            <a 
              href="https://supabase.com/dashboard/project/_/database/backups" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Accéder au tableau de bord des sauvegardes
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBackupPage;