import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export const AdminRestaurantConsolidationVerification = ({ 
  verificationData, 
  verifying, 
  onVerify 
}) => {
  if (!verificationData && !verifying) {
    return null;
  }

  const isFullyClean = verificationData?.verification?.every(v => v.clean) && !verificationData?.old_restaurant_exists;

  return (
    <Card className="mt-6 border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50 border-b pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Rapport de Vérification
              {verificationData && (
                isFullyClean 
                  ? <Badge className="bg-amber-500 hover:bg-green-600">Propre</Badge>
                  : <Badge variant="destructive">Anomalies Détectées</Badge>
              )}
            </CardTitle>
            <CardDescription>Analyse des occurrences de l'ancien et du nouveau restaurant_id</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onVerify} disabled={verifying}>
            {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {verifying && !verificationData ? (
          <div className="p-8 flex justify-center items-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Vérification en cours...</span>
          </div>
        ) : verificationData ? (
          <>
            <div className="p-4 bg-white border-b flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-700">Ancien Restaurant Supprimé :</span>
                 {verificationData.old_restaurant_exists ? (
                   <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3"/> Non (Toujours présent)</Badge>
                 ) : (
                   <Badge className="bg-amber-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Oui</Badge>
                 )}
               </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead className="text-right">Occurrences Ancien ID</TableHead>
                  <TableHead className="text-right">Occurrences Nouveau ID</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verificationData.verification?.map((log, i) => (
                  <TableRow key={i} className={!log.clean ? "bg-red-50/50" : ""}>
                    <TableCell className="font-mono text-sm">{log.table}</TableCell>
                    <TableCell className={`text-right font-medium ${log.old_id_count > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                      {log.old_id_count}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      {log.new_id_count}
                    </TableCell>
                    <TableCell className="text-center">
                      {log.clean ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-500 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};