import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const TestResultsSummary = ({ allResults }) => {
  const testsRun = Object.values(allResults).filter(r => r !== null).length;
  const testsPassed = Object.values(allResults).filter(r => r !== null && r.success).length;
  const totalTests = 5; // We have 5 test hooks returning results
  
  const percentage = testsRun === 0 ? 0 : Math.round((testsPassed / testsRun) * 100);
  const isReady = percentage === 100 && testsRun === totalTests;

  const failedTests = Object.entries(allResults)
    .filter(([_, result]) => result && !result.success)
    .map(([name, result]) => ({ name, errors: result.errors }));

  if (testsRun === 0) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-40 text-gray-500">
          <p>Exécutez les tests pour voir le résumé global ici.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 shadow-md">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Résumé d'Audit des Corrections</CardTitle>
            <CardDescription>Évaluation de la stabilité du système après correctifs</CardDescription>
          </div>
          <Badge variant={isReady ? "success" : "secondary"} className={`text-sm px-3 py-1 ${isReady ? 'bg-amber-500 hover:bg-green-600' : 'bg-gray-200 text-gray-700'}`}>
            Prêt pour la publication ? {isReady ? "OUI" : "NON"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Score Global de Stabilité</span>
            <span>{testsPassed} / {testsRun} Réussis ({percentage}%)</span>
          </div>
          <Progress value={percentage} className="h-3" indicatorColor={percentage === 100 ? 'bg-amber-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'} />
        </div>

        {failedTests.length > 0 && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="font-bold">Tests Échoués ({failedTests.length})</AlertTitle>
            <AlertDescription className="mt-2">
              <ul className="list-disc pl-5 space-y-1">
                {failedTests.map((t, idx) => (
                  <li key={idx}>
                    <strong>{t.name}:</strong> {t.errors.join(', ')}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {percentage > 0 && percentage < 100 && (
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="font-bold">Recommandations</AlertTitle>
            <AlertDescription className="mt-2">
              Certaines fonctionnalités montrent des instabilités. Il est recommandé de corriger les erreurs listées ci-dessus avant de déployer en production. Vérifiez particulièrement les logs d'erreurs Supabase.
            </AlertDescription>
          </Alert>
        )}

        {isReady && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
            <AlertTitle className="font-bold">Système Stable</AlertTitle>
            <AlertDescription className="mt-2">
              Tous les tests critiques ont été passés avec succès. Les transactions atomiques, la pagination, et la gestion des UUID fonctionnent correctement. Le système est prêt pour le déploiement.
            </AlertDescription>
          </Alert>
        )}

      </CardContent>
    </Card>
  );
};