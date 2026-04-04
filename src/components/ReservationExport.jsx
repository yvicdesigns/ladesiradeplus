import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const ReservationExport = ({ reservations = [], loading = false }) => {
  const { toast } = useToast();
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const prepareDataForExport = () => {
    return reservations.map(res => {
      return {
        'ID': res.id ? res.id.slice(0, 8) : 'N/A',
        'Date Création': res.created_at ? format(new Date(res.created_at), 'dd/MM/yyyy HH:mm') : 'N/A',
        'Client': res.customer_name || 'Anonyme',
        'Email': res.customer_email || 'N/A',
        'Téléphone': res.customer_phone || 'N/A',
        'Date Réservation': res.reservation_date ? format(new Date(res.reservation_date), 'dd/MM/yyyy') : 'N/A',
        'Heure': res.reservation_time || 'N/A',
        'Couverts': res.party_size || 0,
        'Statut': res.status || 'pending',
        'Notes': res.notes || ''
      };
    });
  };

  const handleExportCSV = () => {
    if (reservations.length === 0) {
      toast({ title: "Aucune donnée", description: "Il n'y a aucune donnée à exporter.", variant: "destructive" });
      return;
    }
    
    setIsExportingCSV(true);
    try {
      const exportData = prepareDataForExport();
      const csv = Papa.unparse(exportData);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reservations_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ 
        title: "Succès", 
        description: "Export CSV réussi.", 
        className: "bg-green-600 text-white" 
      });
    } catch (error) {
      console.error("Export CSV error:", error);
      toast({ title: "Erreur", description: "Échec de l'export CSV.", variant: "destructive" });
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = () => {
    if (reservations.length === 0) {
      toast({ title: "Aucune donnée", description: "Il n'y a aucune donnée à exporter.", variant: "destructive" });
      return;
    }

    setIsExportingPDF(true);
    try {
      const exportData = prepareDataForExport();
      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text('Rapport des Réservations', 14, 15);
      doc.setFontSize(10);
      doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);
      doc.text(`Nombre total de réservations : ${reservations.length}`, 14, 28);
      
      const totalGuests = reservations.reduce((sum, res) => sum + (Number(res.party_size) || 0), 0);
      doc.text(`Nombre total de couverts : ${totalGuests}`, 14, 34);

      const tableColumn = Object.keys(exportData[0]);
      const tableRows = exportData.map(obj => Object.values(obj));

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      doc.save(`reservations_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({ 
        title: "Succès", 
        description: "Export PDF réussi.", 
        className: "bg-green-600 text-white" 
      });
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
        disabled={isExportingCSV || reservations.length === 0 || loading}
        className="bg-white shadow-sm border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-700 h-10"
      >
        {isExportingCSV ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2 text-amber-600" />}
        CSV
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleExportPDF} 
        disabled={isExportingPDF || reservations.length === 0 || loading}
        className="bg-white shadow-sm border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-red-700 h-10"
      >
        {isExportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2 text-red-500" />}
        PDF
      </Button>
    </div>
  );
};