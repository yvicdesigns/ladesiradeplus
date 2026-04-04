import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { BaseCard } from '@/components/ui/BaseCard';
import { Button } from '@/components/ui/button';
import { Activity, ShieldAlert, Link, Server, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { runFullOrderDeletionDiagnostic } from '@/lib/orderDeletionDiagnostics';

const StatusBadge = ({ status }) => {
  if (status === 'ok' || status === 'authenticated' || status === 'healthy') {
    return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full"><CheckCircle2 className="w-3 h-3"/> OK</span>;
  }
  if (status === 'pending') {
    return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-full"><RefreshCw className="w-3 h-3 animate-spin"/> En cours</span>;
  }
  if (status === 'warning') {
    return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full"><AlertTriangle className="w-3 h-3"/> Attention</span>;
  }
  return <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full"><XCircle className="w-3 h-3"/> Erreur</span>;
};

export const AdminOrderDeletionDiagnosticPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const result = await runFullOrderDeletionDiagnostic();
    setReport(result.report);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Diagnostic de Suppression de Commandes
            </h1>
            <p className="text-muted-foreground text-sm">Outil d'analyse des permissions RLS et contraintes de base de données.</p>
          </div>
          <Button onClick={runDiagnostic} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Relancer l'Analyse
          </Button>
        </div>

        {!report ? (
          <BaseCard className="flex items-center justify-center p-12 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mr-3" /> Analyse en cours...
          </BaseCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vue d'ensemble */}
            <BaseCard className="md:col-span-2">
              <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                <Server className="h-5 w-5 text-gray-500" /> État Général du Système
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Santé Globale</p>
                  <div className="mt-1"><StatusBadge status={report.overallHealth} /></div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Connexion DB</p>
                  <div className="mt-1"><StatusBadge status={report.connection.status} /></div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Authentification</p>
                  <div className="mt-1"><StatusBadge status={report.auth.status} /></div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Rôle Utilisateur</p>
                  <p className="mt-1 text-sm font-mono font-bold text-blue-700">{report.auth.role}</p>
                </div>
              </div>
              
              {report.issues?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4" /> Problèmes Détectés ({report.issues.length})
                  </h3>
                  <ul className="list-disc list-inside text-sm text-amber-700 ml-4 space-y-1">
                    {report.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </BaseCard>

            {/* Politiques RLS */}
            <BaseCard>
              <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-purple-500" /> Politiques RLS (orders)
              </h2>
              {report.policies?.success ? (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                      <span className="font-medium text-gray-700">Total Politiques:</span>
                      <span className="font-bold">{report.policies.totalPolicies}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                      <span className="font-medium text-gray-700">Politiques DELETE/ALL:</span>
                      <span className={`font-bold ${report.policies.hasDeletePolicy ? 'text-amber-600' : 'text-red-600'}`}>
                        {report.policies.deletePolicies?.length || 0}
                      </span>
                    </div>
                    
                    {report.policies.deletePolicies?.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Détails des politiques DELETE :</p>
                        <div className="space-y-2">
                          {report.policies.deletePolicies.map((p, i) => (
                            <div key={i} className="bg-purple-50 border border-purple-100 p-2 rounded-md text-xs">
                              <p className="font-bold text-purple-900">{p.policyname}</p>
                              <p className="text-purple-700 mt-1"><strong>Roles:</strong> {p.roles?.join(', ')}</p>
                              <code className="block bg-white p-1 mt-1 rounded border text-purple-800 break-all">{p.qual}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 mt-4 bg-red-50 p-3 rounded-md border border-red-200">
                        Aucune politique n'autorise la suppression. L'opération échouera avec une erreur RLS (42501).
                      </p>
                    )}
                 </div>
              ) : (
                <p className="text-sm text-red-500">Erreur lors de la récupération des politiques RLS.</p>
              )}
            </BaseCard>

            {/* Contraintes de Clé Étrangère */}
            <BaseCard>
              <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                <Link className="h-5 w-5 text-blue-500" /> Contraintes (Foreign Keys)
              </h2>
              {report.foreignKeys?.success ? (
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                      <span className="font-medium text-gray-700">Tables Dépendantes:</span>
                      <span className="font-bold">{report.foreignKeys.totalReferences}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                      <span className="font-medium text-gray-700">Contraintes Bloquantes:</span>
                      <span className={`font-bold ${report.foreignKeys.hasBlockingReferences ? 'text-red-600' : 'text-amber-600'}`}>
                        {report.foreignKeys.blockingReferences?.length || 0}
                      </span>
                    </div>

                    {report.foreignKeys.blockingReferences?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Tables qui bloqueront la suppression (Pas de CASCADE) :</p>
                        <div className="space-y-2">
                          {report.foreignKeys.blockingReferences.map((ref, i) => (
                            <div key={i} className="bg-red-50 border border-red-100 p-2 rounded-md text-xs">
                              <p className="font-bold text-red-900">Table: {ref.table_name}</p>
                              <p className="text-red-700">Colonne: {ref.column_name}</p>
                              <p className="text-red-700">Règle: {ref.delete_rule}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Solution: Le code de suppression (orderDeletion.js) doit supprimer les lignes de ces tables en premier.
                        </p>
                      </div>
                    )}
                 </div>
              ) : (
                <p className="text-sm text-red-500">Erreur lors de la récupération des contraintes.</p>
              )}
            </BaseCard>

          </div>
        )}
      </div>
    </AdminLayout>
  );
};
export default AdminOrderDeletionDiagnosticPage;