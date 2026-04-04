import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export const UserExportService = {
  exportToCSV: (filteredUsers, filename = `utilisateurs_${format(new Date(), 'yyyy-MM-dd')}.csv`) => {
    try {
      if (!filteredUsers || filteredUsers.length === 0) {
        return { success: false, error: 'Aucune donnée à exporter' };
      }

      const exportData = filteredUsers.map(user => ({
        'ID': user.id,
        'Nom': user.name || 'Sans nom',
        'Email': user.email || 'Non spécifié',
        'Téléphone': user.phone || 'Non spécifié',
        'Rôle': user.role || 'Non spécifié',
        'Statut': user.status || 'Non spécifié',
        'Date Création': user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy HH:mm') : 'N/A',
        'Dernière Connexion': user.last_login ? format(new Date(user.last_login), 'dd/MM/yyyy HH:mm') : 'Jamais'
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
  },

  exportToPDF: (filteredUsers, filename = `utilisateurs_${format(new Date(), 'yyyy-MM-dd')}.pdf`) => {
    try {
      if (!filteredUsers || filteredUsers.length === 0) {
        return { success: false, error: 'Aucune donnée à exporter' };
      }

      const doc = new jsPDF('landscape');
      
      doc.setFontSize(16);
      doc.text('Liste des Utilisateurs / Équipe', 14, 15);
      doc.setFontSize(10);
      doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);
      doc.text(`Nombre d'utilisateurs : ${filteredUsers.length}`, 14, 28);

      const tableColumn = [
        'Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Date Création', 'Dernière Connexion'
      ];

      const tableRows = filteredUsers.map(user => [
        user.name || 'Sans nom',
        user.email || 'Non spécifié',
        user.phone || 'Non spécifié',
        user.role || 'Non spécifié',
        user.status || 'Non spécifié',
        user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : 'N/A',
        user.last_login ? format(new Date(user.last_login), 'dd/MM/yyyy HH:mm') : 'Jamais'
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
  }
};