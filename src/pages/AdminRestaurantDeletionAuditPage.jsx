import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Loader2, Search, Trash2, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { getRestaurantDeletionAudit, executeRestaurantDeletion } from '@/lib/getRestaurantDeletionAudit';

export default function AdminRestaurantDeletionAuditPage() {
  const [targetId, setTargetId] = useState('010bd333-5f84-49b4-9412-2dd8c4a81878');
  const [correctId] = useState('7eedf081-0268-4867-af38-61fa5932420a');
  
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const runAudit = async () => {
    if (!targetId.trim()) return;
    
    setLoading(true);
    setAuditData(null);
    try {
      const data = await getRestaurantDeletionAudit(targetId.trim());
      setAuditData(data);
      if (data.restaurantExists) {
        toast({ title: "Audit Terminé", description: "Les données ont été analysées avec succès." });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Restaurant Introuvable", 
          description: "Aucun restaurant trouvé avec cet ID." 
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur d'audit",
        description: err.message || "Une erreur est survenue lors de l'analyse."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== targetId) return;
    
    setDeleting(true);
    try {
      await executeRestaurantDeletion(targetId);
      
      toast({
        title: "Suppression Réussie",
        description: "Le restaurant et toutes ses données liées ont été supprimés.",
      });
      
      setIsConfirmOpen(false);
      navigate('/admin');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: err.message || "Impossible de finaliser la suppression. Des contraintes peuvent bloquer l'opération."
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-destructive" /> Audit de Suppression Restaurant
          </h1>
          <p className="text-muted-foreground mt-1">
            Vérifiez et purgez les données résiduelles d'un ancien restaurant avant suppression définitive.
          </p>
        </div>

        <Alert className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <AlertTitle className="font-bold">Zone de Danger</AlertTitle>
          <AlertDescription className="mt-2 text-sm text-destructive/90 space-y-2">
            <p>La suppression est <strong>irréversible</strong>. Toutes les données associées (commandes, clients, menus) seront détruites si elles ne sont pas protégées par des contraintes.</p>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center p-2 bg-background/50 rounded border border-destructive/10 font-mono text-xs">
              <div className="flex flex-col">
                <span className="text-muted-foreground">ID Valide Conservé:</span>
                <span className="text-amber-600 font-bold">{correctId}</span>
              </div>
              <ArrowRight className="w-4 h-4 hidden sm:block text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-muted-foreground">ID Cible à Supprimer:</span>
                <span className="text-red-600 font-bold">{targetId}</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Configuration de l'Audit</CardTitle>
            <CardDescription>Saisissez l'ID du restaurant à analyser pour quantifier les données orphelines.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <div className="flex-1">
              <Input 
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="Ex: 010bd333-5f84-49b4-9412-2dd8c4a81878"
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={runAudit} disabled={loading || !targetId.trim()}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Lancer l'audit
            </Button>
          </CardContent>
        </Card>

        {auditData && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Résultats de l'Audit
                    {auditData.restaurantExists ? (
                      <Badge variant="destructive">Restaurant Trouvé</Badge>
                    ) : (
                      <Badge variant="secondary">Restaurant Inexistant</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Total des enregistrements trouvés : <strong>{auditData.totalRecords}</strong></CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table Concernée</TableHead>
                    <TableHead className="text-right">Occurrences liées</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData.details.map((row, i) => (
                    <TableRow key={i} className={row.count > 0 ? "bg-red-50/30 dark:bg-red-950/20" : ""}>
                      <TableCell className="font-mono text-sm">{row.table}</TableCell>
                      <TableCell className={`text-right font-medium ${row.count > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {row.count === -1 ? "Erreur" : row.count}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.count > 0 ? (
                          <Badge variant="destructive" className="bg-red-500">À purger</Badge>
                        ) : row.count === -1 ? (
                          <Badge variant="outline" className="text-amber-500 border-amber-200">Erreur</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Propre</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-4 flex justify-between">
              <Button variant="outline" onClick={() => navigate('/admin')}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                disabled={!auditData.restaurantExists && auditData.totalRecords === 0}
                onClick={() => {
                  setConfirmText('');
                  setIsConfirmOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Procéder à la Suppression
              </Button>
            </CardFooter>
          </Card>
        )}

        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Confirmation Requise
              </DialogTitle>
              <DialogDescription className="space-y-4 pt-4 text-foreground">
                <p>Vous êtes sur le point de supprimer le restaurant et <strong>{auditData?.totalRecords || 0} enregistrements</strong> de manière définitive.</p>
                <div className="bg-muted p-3 rounded text-sm space-y-2 border border-border">
                  <p>Veuillez taper l'ID suivant pour confirmer :</p>
                  <p className="font-mono text-center font-bold text-destructive select-all">{targetId}</p>
                </div>
                <Input 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Tapez l'ID ici..."
                  className="font-mono"
                />
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={deleting}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={confirmText !== targetId || deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Confirmer la suppression
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}