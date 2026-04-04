import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayCircle, ShieldCheck } from 'lucide-react';
import { runAllAudits } from '@/lib/auditTestUtils';
import { AdminAuditResultsPanel } from '@/components/AdminAuditResultsPanel';

export const AdminAuditCompletePage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [results, setResults] = useState(null);

  const handleStartAudit = async () => {
    setIsRunning(true);
    setResults(null);
    setProgress(0);
    setStatusText('Initialisation de l\'audit...');

    try {
      const auditResults = await runAllAudits((prog, text) => {
        setProgress(prog);
        setStatusText(text);
      });
      setResults(auditResults);
    } catch (error) {
      console.error("Audit failed:", error);
      setStatusText('Erreur lors de l\'exécution de l\'audit.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Audit Complet du Système - Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Audit Complet du Système
          </h1>
          <p className="text-muted-foreground mt-1">
            Exécutez des tests automatisés pour vérifier l'intégrité, la sécurité et la configuration de votre application.
          </p>
        </div>

        {!results && !isRunning && (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <PlayCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lancer le Diagnostic</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Cette opération va vérifier les composants vitaux : Navigation, Intégrité des données du menu, Authentification, et Sécurité (RLS).
              </p>
              <Button size="lg" onClick={handleStartAudit} className="px-8 shadow-md">
                Démarrer l'Audit
              </Button>
            </CardContent>
          </Card>
        )}

        {isRunning && (
          <Card>
            <CardHeader>
              <CardTitle>Audit en cours d'exécution</CardTitle>
              <CardDescription>Veuillez patienter pendant que nous analysons votre système.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-8">
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground font-medium">
                <span>{statusText}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {results && !isRunning && (
          <AdminAuditResultsPanel results={results} onRetest={handleStartAudit} />
        )}
      </div>
    </>
  );
};

export default AdminAuditCompletePage;