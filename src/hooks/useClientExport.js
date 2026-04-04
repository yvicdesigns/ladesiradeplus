import { useCallback } from 'react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const useClientExport = () => {
  const exportToCSV = useCallback((filteredClients, filename = `clients_${format(new Date(), 'yyyy-MM-dd')}.csv`) => {
    try {
      if (!filteredClients || filteredClients.length === 0) {
        return { success: false, error: 'Aucune donnée à exporter' };
      }

      const exportData = filteredClients.map(client => ({
        'ID': client.id,
        'Nom': client.name || 'Sans nom',
        'Email': client.email || 'Non spécifié',
        'Téléphone': client.phone || 'Non spécifié',
        'Adresse': client.address || 'Non spécifiée',
        'Ville': client.city || '',
        'Code Postal': client.postal_code || '',
        'Date Inscription': client.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy HH:mm') : 'N/A',
        'Dernière Visite': client.last_visit ? format(new Date(client.last_visit), 'dd/MM/yyyy') : 'N/A',
        'Total Commandes': client.total_visits || 0,
        'Total Dépensé (XAF)': client.total_spent || 0,
        'Statut': client.statut_client || 'Actif',
        'Source': client.source_client || 'Non spécifiée'
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const exportToPDF = useCallback((filteredClients, filename = `clients_${format(new Date(), 'yyyy-MM-dd')}.pdf`) => {
    try {
      if (!filteredClients || filteredClients.length === 0) {
        return { success: false, error: 'Aucune donnée à exporter' };
      }

      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text('Liste des Clients', 14, 15);
      doc.setFontSize(10);
      doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);
      doc.text(`Nombre de clients : ${filteredClients.length}`, 14, 28);

      const tableColumn = [
        'Nom', 'Email', 'Téléphone', 'Inscription', 'Commandes', 'Total (XAF)', 'Statut'
      ];

      const tableRows = filteredClients.map(client => [
        client.name || 'Sans nom',
        client.email || 'Non spécifié',
        client.phone || 'Non spécifié',
        client.created_at ? format(new Date(client.created_at), 'dd/MM/yyyy') : 'N/A',
        client.total_visits || 0,
        client.total_spent || 0,
        client.statut_client || 'Actif'
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      doc.save(filename);

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return { exportToCSV, exportToPDF };
};