import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { MANUAL_TESTS } from '@/lib/testDefinitions';

export const ExportReportButton = ({ results, stats }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const formatDataForExport = () => {
    return MANUAL_TESTS.map(test => {
      const res = results[test.id] || { status: 'NOT_RUN', notes: '', timestamp: null };
      return {
        ID: test.id,
        Catégorie: test.category,
        Nom: test.name,
        Statut: res.status,
        Notes: res.notes || 'Aucune note',
        Date: res.timestamp ? new Date(res.timestamp).toLocaleString() : 'Non exécuté'
      };
    });
  };

  const exportJSON = () => {
    setIsExporting(true);
    try {
      const data = {
        metadata: {
          exportedAt: new Date().toISOString(),
          stats: stats
        },
        tests: formatDataForExport()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_tests_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export réussi', description: 'Le fichier JSON a été téléchargé.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Échec de l\'exportation JSON.' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = () => {
    setIsExporting(true);
    try {
      const data = formatDataForExport();
      if (data.length === 0) return;
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(obj => 
        Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_tests_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Export réussi', description: 'Le fichier CSV a été téléchargé.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Échec de l\'exportation CSV.' });
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleString();
      
      // Header
      doc.setFontSize(20);
      doc.text("Rapport d'Audit - Tests Manuels", 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Date de génération : ${date}`, 14, 28);
      
      // Summary
      doc.setFontSize(14);
      doc.text("Résumé", 14, 40);
      
      doc.setFontSize(10);
      doc.text(`Total des tests: ${stats.total}`, 14, 48);
      doc.text(`Complétés: ${stats.completed}`, 14, 54);
      doc.text(`Succès: ${stats.passed} (${stats.successRate}%)`, 14, 60);
      doc.text(`Échecs: ${stats.failed}`, 70, 60);
      doc.text(`Alertes: ${stats.warnings}`, 120, 60);

      // Table data
      const data = formatDataForExport();
      const tableColumn = ["ID", "Catégorie", "Test", "Statut", "Notes"];
      const tableRows = data.map(item => [
        item.ID,
        item.Catégorie,
        item.Nom,
        item.Statut,
        item.Notes.substring(0, 50) + (item.Notes.length > 50 ? '...' : '')
      ]);

      doc.autoTable({
        startY: 70,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [234, 88, 12] }, // Brand orange
        willDrawCell: function(data) {
          if (data.column.index === 3 && data.cell.section === 'body') {
            if (data.cell.raw === 'PASS') data.cell.styles.textColor = [22, 163, 74];
            if (data.cell.raw === 'FAIL') data.cell.styles.textColor = [220, 38, 38];
            if (data.cell.raw === 'WARNING') data.cell.styles.textColor = [202, 138, 4];
          }
        }
      });

      doc.save(`rapport_tests_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: 'Export réussi', description: 'Le rapport PDF a été généré.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Échec de la génération PDF. Vérifiez la console.' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting} className="gap-2 bg-gray-900 text-white hover:bg-gray-800">
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exporter le Rapport
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportPDF} className="cursor-pointer gap-2">
          <FileText className="w-4 h-4 text-red-500" /> Format PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV} className="cursor-pointer gap-2">
          <FileSpreadsheet className="w-4 h-4 text-amber-600" /> Format CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON} className="cursor-pointer gap-2">
          <FileJson className="w-4 h-4 text-blue-500" /> Format JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};