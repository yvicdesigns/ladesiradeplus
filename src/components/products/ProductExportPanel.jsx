import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const ProductExportPanel = ({ products = [], disabled = false }) => {
  const { toast } = useToast();
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const prepareDataForExport = () => {
    return products.map(p => ({
      'ID': p.id ? p.id.slice(0, 8) : 'N/A',
      'Nom': p.name || 'Sans nom',
      'Catégorie': p.menu_categories?.name || 'Non catégorisé',
      'Prix (XAF)': p.price || 0,
      'Stock': p.stock_quantity || 0,
      'Disponibilité': p.is_available ? 'Disponible' : 'Indisponible',
      'Temps Prép. (min)': p.preparation_time || 'N/A',
      'Créé le': p.created_at ? format(new Date(p.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'
    }));
  };

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast({ title: "Aucune donnée", description: "Il n'y a aucun produit à exporter.", variant: "destructive" });
      return;
    }
    
    setIsExportingCSV(true);
    try {
      const exportData = prepareDataForExport();
      const csv = Papa.unparse(exportData);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `produits_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: "Succès", description: "Export CSV réussi.", className: "bg-green-600 text-white border-none" });
    } catch (error) {
      console.error("Export CSV error:", error);
      toast({ title: "Erreur", description: "Échec de l'export CSV.", variant: "destructive" });
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = () => {
    if (products.length === 0) {
      toast({ title: "Aucune donnée", description: "Il n'y a aucun produit à exporter.", variant: "destructive" });
      return;
    }

    setIsExportingPDF(true);
    try {
      const exportData = prepareDataForExport();
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text('Catalogue des Produits', 14, 15);
      doc.setFontSize(10);
      doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);
      doc.text(`Nombre total de produits : ${products.length}`, 14, 28);

      const tableColumn = Object.keys(exportData[0]);
      const tableRows = exportData.map(obj => Object.values(obj));

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      doc.save(`produits_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({ title: "Succès", description: "Export PDF réussi.", className: "bg-green-600 text-white border-none" });
    } catch (error) {
      console.error("Export PDF error:", error);
      toast({ title: "Erreur", description: "Échec de l'export PDF.", variant: "destructive" });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleExportCSV} 
        disabled={disabled || isExportingCSV || products.length === 0}
        className="bg-white shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-700"
      >
        {isExportingCSV ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2 text-amber-600" />}
        <span className="hidden sm:inline">CSV</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleExportPDF} 
        disabled={disabled || isExportingPDF || products.length === 0}
        className="bg-white shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-700"
      >
        {isExportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2 text-red-500" />}
        <span className="hidden sm:inline">PDF</span>
      </Button>
    </div>
  );
};