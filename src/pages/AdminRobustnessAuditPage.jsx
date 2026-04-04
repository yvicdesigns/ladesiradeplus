import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ShieldCheck, PlayCircle, Download, FileText, FileSpreadsheet, FileJson, Loader2, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdminLayout } from '@/components/AdminLayout';
import { runFullAudit } from '@/lib/robustness-audit/RobustnessAuditService';
import { exportAuditJSON, exportAuditCSV, exportAuditPDF } from '@/lib/robustness-audit/RobustnessAuditReportGenerator';
import { RobustnessAuditIssuesPanel } from '@/components/audit/RobustnessAuditIssuesPanel';
import { RobustnessAuditRecommendationsPanel } from '@/components/audit/RobustnessAuditRecommendationsPanel';
import { motion } from 'framer-motion';

export const AdminRobustnessAuditPage = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [auditData, setAuditData] = useState(null);

  const handleStartAudit = async () => {
    setIsRunning(true);
    setAuditData(null);
    setProgress(0);
    setStatusText('Initialisation de l\'audit de robustesse...');

    try {
      const results = await runFullAudit((prog, text) => {
        setProgress(prog);
        setStatusText(text);
      });
      setAuditData(results);
      toast({ title: "Audit terminé", description: "Le diagnostic complet a été généré avec succès." });
    } catch (error) {
      console.error("Audit failed:", error);
      toast({ variant: "destructive", title: "Erreur", description: "L'audit a échoué. Consultez la console." });
    } finally {
      setIsRunning(false);
    }
  };

  const handleExport = (type) => {
    if (!auditData) return;
    let success = false;
    
    if (type === 'pdf') success = exportAuditPDF(auditData);
    if (type === 'csv') success = exportAuditCSV(auditData);
    if (type === 'json') success = exportAuditJSON(auditData);

    if (success) {
      toast({ title: "Export réussi", description: `Le rapport ${type.toUpperCase()} a été téléchargé.` });
    } else {
      toast({ variant: "destructive", title: "Erreur d'export", description: "Une erreur est survenue lors de la génération du fichier." });
    }
  };

  // Helper to colorize score
  const getScoreColor = (score) => {
    if (score >= 85) return "text-amber-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };
  const getScoreBg = (score) => {
    if (score >= 85) return "bg-amber-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Audit de Robustesse (Pré-publication) - Admin</title>
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              Audit de Robustesse
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Analyse complète de stabilité, sécurité, et performance pour valider la mise en production.
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {auditData && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <Download className="w-4 h-4" /> Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer gap-2">
                    <FileText className="w-4 h-4 text-red-500" /> Format PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" /> Format CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('json')} className="cursor-pointer gap-2">
                    <FileJson className="w-4 h-4 text-blue-500" /> Format JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={handleStartAudit} disabled={isRunning} className="w-full sm:w-auto gap-2">
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {auditData ? "Relancer l'Audit" : "Démarrer l'Audit"}
            </Button>
          </div>
        </div>

        {/* Running State */}
        {isRunning && (
          <Card className="border-primary/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Exécution de l'audit en cours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <Progress value={progress} className="h-3 bg-muted" indicatorClassName="bg-primary transition-all duration-500" />
              <div className="flex justify-between text-sm text-muted-foreground font-medium">
                <span>{statusText}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results View */}
        {auditData && !isRunning && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Global Score & Verdict */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1 bg-card border-border shadow-sm flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-lg font-bold text-muted-foreground mb-2">Score Global de Robustesse</h3>
                <div className={`text-6xl font-black mb-2 ${getScoreColor(auditData.overallScore)}`}>
                  {auditData.overallScore}%
                </div>
                <Progress value={auditData.overallScore} className="w-full h-2 mt-4" indicatorClassName={getScoreBg(auditData.overallScore)} />
              </Card>

              <Card className={`md:col-span-2 border-2 ${auditData.verdict === 'YES' ? 'border-green-500/50 bg-amber-50/10' : 'border-red-500/50 bg-red-50/10'} shadow-sm`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {auditData.verdict === 'YES' ? <CheckCircle2 className="w-6 h-6 text-amber-500" /> : <AlertOctagon className="w-6 h-6 text-red-500" />}
                    Verdict : {auditData.verdict === 'YES' ? 'Prêt pour Publication' : 'Publication Déconseillée'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base font-medium text-foreground">{auditData.reason}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-background">Fait le : {new Date(auditData.timestamp).toLocaleString()}</Badge>
                    <Badge variant="outline" className="bg-background">Catégories : {auditData.categoryResults.length}</Badge>
                    <Badge variant="outline" className="bg-background">
                      Total Problèmes : {auditData.categoryResults.reduce((acc, cat) => acc + cat.issues.length, 0)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Scores Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {auditData.categoryResults.map((cat, idx) => (
                <Card key={idx} className="border border-border/50 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-sm text-foreground truncate pr-2" title={cat.category}>{cat.category}</span>
                      <span className={`font-bold text-sm ${getScoreColor(cat.score)}`}>{cat.score}%</span>
                    </div>
                    <Progress value={cat.score} className="h-1.5" indicatorClassName={getScoreBg(cat.score)} />
                    <div className="mt-3 text-xs text-muted-foreground font-medium">
                      {cat.issues.length} problème(s) détecté(s)
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Layout for Recommendations and Issues */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
               <div className="xl:col-span-1">
                 <RobustnessAuditRecommendationsPanel auditData={auditData} />
               </div>
               <div className="xl:col-span-2">
                 <RobustnessAuditIssuesPanel auditData={auditData} />
               </div>
            </div>

          </div>
        )}

        {/* Empty State */}
        {!auditData && !isRunning && (
          <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Audit de Robustesse Système</h3>
              <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Exécutez un diagnostic profond couvrant la stabilité, la sécurité, les performances et les scénarios réels d'utilisation avant de publier l'application.
              </p>
              <Button size="lg" onClick={handleStartAudit} className="px-8 shadow-md gap-2">
                <PlayCircle className="w-5 h-5" /> Démarrer l'Analyse
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRobustnessAuditPage;