import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminDebugTab } from '@/components/AdminDebugTab';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2, ShieldAlert, Wrench, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';

// Simple Error Boundary specifically for the debug components
class DebugErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Debug Tab Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-destructive/20 bg-destructive/5 rounded-lg text-center">
          <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold text-destructive">Erreur de chargement</h3>
          <p className="text-sm text-muted-foreground">
            Le système de débogage a rencontré une erreur critique. 
            Veuillez vérifier la console du navigateur pour plus de détails.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export const AdminMaintenancePage = () => {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Task 9: Console logging for verification
  useEffect(() => {
    console.log('AdminMaintenancePage mounted', { role, loading, timestamp: new Date().toISOString() });
  }, [role, loading]);

  useEffect(() => {
    if (!loading && role !== 'admin') {
      console.warn('Access denied: User is not admin', { role });
      toast({
        variant: "destructive",
        title: "Accès refusé",
        description: "Seuls les administrateurs peuvent accéder à la maintenance système."
      });
      navigate('/admin');
    }
  }, [role, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Accès Refusé</h2>
          <p className="text-muted-foreground">Zone réservée aux administrateurs système.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              Maintenance Système
            </h1>
            <p className="text-muted-foreground mt-2">
              Console de diagnostic et outils de débogage pour la gestion technique de la plateforme.
            </p>
          </div>
        </div>
        
        <Separator />

        <div className="bg-amber-50 border border-green-100 rounded-lg p-4 flex items-start gap-3 mb-6">
          <Activity className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Mode Diagnostic</h3>
            <p className="text-sm text-amber-700">
              Cette interface affiche des informations techniques sensibles. Utilisez ces outils avec précaution pour diagnostiquer les problèmes de connexion, de base de données ou de services tiers.
            </p>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              État du Système & Logs
            </CardTitle>
            <CardDescription>
              Vue en temps réel des performances et des erreurs système.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DebugErrorBoundary>
              <AdminDebugTab />
            </DebugErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMaintenancePage;