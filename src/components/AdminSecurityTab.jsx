import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminSecurityTab = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Sécurité et Accès (RLS)</h2>
        <p className="text-muted-foreground">Test and verify that Row Level Security policies are correctly configured and enforced.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-100 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <ShieldCheck className="h-5 w-5 text-blue-600" /> Diagnostics RLS
            </CardTitle>
            <CardDescription>View RLS Configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-900/80 mb-6">
              Vérifiez que toutes vos tables sensibles (orders, profiles, admin_settings) sont correctement protégées par des politiques de sécurité (Row Level Security).
            </p>
            <Button disabled className="w-full gap-2 bg-blue-600 hover:bg-blue-700 opacity-50 cursor-not-allowed">
              <Shield className="h-4 w-4" /> Disponible en développement uniquement
            </Button>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Tests de Pénétration
            </CardTitle>
            <CardDescription>Test RLS Policies</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-900/80 mb-6">
              Exécutez des tests automatisés pour vous assurer que les utilisateurs non autorisés ne peuvent pas accéder aux données ou les modifier illégalement.
            </p>
            <Button disabled className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white opacity-50 cursor-not-allowed">
              <AlertTriangle className="h-4 w-4" /> Disponible en développement uniquement
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSecurityTab;