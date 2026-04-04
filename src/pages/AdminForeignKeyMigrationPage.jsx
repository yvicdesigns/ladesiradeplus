import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { verifyForeignKeyMigration, TARGET_CONSTRAINTS } from '@/lib/verifyForeignKeyMigration';
import { useToast } from '@/components/ui/use-toast';
import { Database, ShieldCheck, ShieldAlert, Loader2, Info, ArrowRight } from 'lucide-react';

export const AdminForeignKeyMigrationPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [allPassed, setAllPassed] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runVerification = async () => {
    setLoading(true);
    try {
      const response = await verifyForeignKeyMigration();
      if (response.success) {
        setResults(response.results);
        setAllPassed(response.allPassed);
        setHasRun(true);
        
        if (response.allPassed) {
          toast({
            title: "Vérification réussie",
            description: "Toutes les clés étrangères ciblées sont bien configurées avec CASCADE.",
            className: "bg-green-600 text-white border-none",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Action requise",
            description: "Certaines clés étrangères ne sont pas en CASCADE.",
          });
        }
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de vérification",
        description: error.message || "Impossible de vérifier les contraintes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run once on mount automatically
    runVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Database className="h-6 w-6" /></div>
              Migration CASCADE
            </h1>
            <p className="text-muted-foreground mt-1">
              Vérification des 14 relations modifiées pour supporter la suppression en cascade.
            </p>
          </div>
          <Button onClick={runVerification} disabled={loading} className="shrink-0 bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Relancer la vérification
          </Button>
        </div>

        <Alert className="bg-blue-50 border-blue-200 text-blue-800">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="font-bold text-blue-900">Pourquoi cette migration ?</AlertTitle>
          <AlertDescription className="mt-2 text-blue-800/90 leading-relaxed">
            Pour qu'un enregistrement parent (comme un client ou un produit) puisse être supprimé définitivement, 
            la base de données doit savoir comment gérer les enregistrements enfants qui en dépendent. 
            Le comportement par défaut (<code>NO ACTION</code>) bloque la suppression si des enfants existent. 
            Cette migration convertit ces règles en <code>ON DELETE CASCADE</code>, ce qui signifie que la suppression 
            du parent supprimera automatiquement et proprement tous les enfants liés.
          </AlertDescription>
        </Alert>

        {hasRun && (
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className={`border-b ${allPassed ? 'bg-amber-50/50' : 'bg-amber-50/50'}`}>
              <div className="flex items-center gap-3">
                {allPassed ? (
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <CardTitle>{allPassed ? "Migration Validée" : "Migration Incomplète"}</CardTitle>
                  <CardDescription>
                    {allPassed 
                      ? "Les 14 contraintes ont été mises à jour avec succès en ON DELETE CASCADE." 
                      : "Certaines contraintes doivent encore être migrées."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">Statut</TableHead>
                    <TableHead>Contrainte (Nom)</TableHead>
                    <TableHead>Relation</TableHead>
                    <TableHead>Règle Actuelle</TableHead>
                    <TableHead>Attendu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length > 0 ? (
                    results.map((res, i) => (
                      <TableRow key={i} className={res.isCascade ? "bg-amber-50/10" : "bg-red-50/30"}>
                        <TableCell className="text-center font-bold">
                          {res.isCascade ? (
                            <span className="text-amber-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{res.constraint_name}</TableCell>
                        <TableCell className="text-sm">
                          {res.table_name !== 'UNKNOWN' ? (
                            <span className="flex items-center text-muted-foreground gap-1.5">
                              {res.parent_table} <ArrowRight className="h-3 w-3" /> <strong className="text-foreground">{res.table_name}</strong>
                            </span>
                          ) : (
                            <span className="text-red-500 font-medium">Contrainte introuvable</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={res.isCascade ? "border-amber-200 bg-amber-100 text-amber-800" : "border-red-200 bg-red-100 text-red-800"}>
                            {res.delete_rule}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">CASCADE</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    TARGET_CONSTRAINTS.map((name, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5} className="text-muted-foreground italic text-xs font-mono py-2 pl-4 border-b">
                          En attente d'analyse pour {name}...
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminForeignKeyMigrationPage;