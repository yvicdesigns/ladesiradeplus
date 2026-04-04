import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { formatCurrency } from './formatters';

const exportToJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, `${filename}.json`);
};

const exportToCSV = (data, filename) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.csv`);
};

const exportToPDF = (headers, body, title, filename) => {
  const doc = new jsPDF();
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
  
  doc.autoTable({
    head: [headers],
    body: body,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  doc.save(`${filename}.pdf`);
};

export const exportDataService = {
  exportOrders: (orders, formatType) => {
    const filename = `orders_export_${format(new Date(), 'yyyy-MM-dd')}`;
    const cleanData = orders.map(o => ({
      ID: o.id.slice(0, 8),
      Date: format(new Date(o.created_at), 'dd/MM/yyyy HH:mm'),
      Client: o.customer_name || 'Invité',
      Total: o.total,
      Statut: o.status,
      Type: o.type
    }));

    if (formatType === 'json') return exportToJSON(orders, filename);
    if (formatType === 'csv') return exportToCSV(cleanData, filename);
    if (formatType === 'pdf') {
      const headers = ['ID', 'Date', 'Client', 'Total', 'Statut', 'Type'];
      const body = cleanData.map(o => [o.ID, o.Date, o.Client, formatCurrency(o.Total), o.Statut, o.Type]);
      return exportToPDF(headers, body, 'Rapport des Commandes', filename);
    }
  },

  exportRestaurantOrders: (orders, formatType) => {
    const filename = `restaurant_orders_${format(new Date(), 'yyyy-MM-dd')}`;
    const cleanData = orders.map(o => ({
      ID: o.id.slice(0, 8),
      Table: o.table_number || 'N/A',
      Date: format(new Date(o.created_at), 'HH:mm'),
      Statut: o.status,
      Total: o.total
    }));

    if (formatType === 'json') return exportToJSON(orders, filename);
    if (formatType === 'csv') return exportToCSV(cleanData, filename);
    if (formatType === 'pdf') {
      const headers = ['ID', 'Table', 'Heure', 'Statut', 'Total'];
      const body = cleanData.map(o => [o.ID, o.Table, o.Date, o.Statut, formatCurrency(o.Total)]);
      return exportToPDF(headers, body, 'Commandes Restaurant', filename);
    }
  },

  exportReservations: (reservations, formatType) => {
    const filename = `reservations_${format(new Date(), 'yyyy-MM-dd')}`;
    const cleanData = reservations.map(r => ({
      ID: r.id.slice(0, 8),
      Date: r.reservation_date,
      Heure: r.reservation_time,
      Nom: r.customer_name,
      Taille: r.party_size,
      Statut: r.status
    }));

    if (formatType === 'json') return exportToJSON(reservations, filename);
    if (formatType === 'csv') return exportToCSV(cleanData, filename);
    if (formatType === 'pdf') {
      const headers = ['ID', 'Date', 'Heure', 'Nom', 'Taille', 'Statut'];
      const body = cleanData.map(r => [r.ID, r.Date, r.Heure, r.Nom, r.Taille, r.Statut]);
      return exportToPDF(headers, body, 'Liste des Réservations', filename);
    }
  },
  
  exportTrashItems: (items, formatType, type) => {
    const filename = `trash_${type}_${format(new Date(), 'yyyy-MM-dd')}`;
    const cleanData = items.map(i => ({
      ID: i.id.slice(0, 8),
      Supprimé_le: i.deleted_at ? format(new Date(i.deleted_at), 'dd/MM/yyyy') : 'N/A',
      Nom: i.customer_name || 'N/A',
      Info: type === 'orders' ? formatCurrency(i.total) : `${i.party_size} pers.`
    }));

    if (formatType === 'json') return exportToJSON(items, filename);
    if (formatType === 'csv') return exportToCSV(cleanData, filename);
    if (formatType === 'pdf') {
      const headers = ['ID', 'Supprimé le', 'Nom', 'Info'];
      const body = cleanData.map(i => [i.ID, i.Supprimé_le, i.Nom, i.Info]);
      return exportToPDF(headers, body, `Corbeille - ${type}`, filename);
    }
  }
};