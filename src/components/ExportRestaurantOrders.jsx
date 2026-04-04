import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { 
  formatCurrency, 
  formatPaymentMethod, 
  formatRestaurantOrderStatus, 
  getOrderMethodLabel 
} from '@/lib/formatters';

/**
 * Format data for export to ensure consistency between CSV and PDF
 */
const prepareDataForExport = (orders) => {
  return orders.map(order => {
    const method = order.order_method || order.orders?.order_method || 'unknown';
    const total = Number(order.total) || Number(order.orders?.total) || 0;
    
    return {
      id: order.id.slice(0, 8),
      date: format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'),
      customer_name: order.customer_name || order.orders?.customer_name || 'Anonyme',
      email: order.orders?.customer_email || 'N/A',
      type: getOrderMethodLabel(method),
      amount: total,
      amount_formatted: formatCurrency(total),
      payment_method: formatPaymentMethod(order.payment_method) || 'N/A',
      status: formatRestaurantOrderStatus(order.status)
    };
  });
};

/**
 * Export orders to CSV format
 */
export const exportRestaurantOrdersToCSV = (orders) => {
  try {
    const data = prepareDataForExport(orders);
    
    // Define headers
    const headers = [
      'ID Commande', 
      'Date & Heure', 
      'Client', 
      'Email', 
      'Type', 
      'Montant', 
      'Méthode Paiement', 
      'Statut'
    ];
    
    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => [
        `"${row.id}"`,
        `"${row.date}"`,
        `"${row.customer_name.replace(/"/g, '""')}"`,
        `"${row.email.replace(/"/g, '""')}"`,
        `"${row.type}"`,
        `"${row.amount}"`, // Use unformatted amount for CSV calculations
        `"${row.payment_method}"`,
        `"${row.status}"`
      ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' }); // \uFEFF is BOM for Excel UTF-8 compatibility
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `commandes_restaurant_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating CSV:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export orders to PDF format
 */
export const exportRestaurantOrdersToPDF = (orders) => {
  try {
    const data = prepareDataForExport(orders);
    const doc = new jsPDF('landscape'); // Use landscape for wider tables
    
    // Add Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('Commandes Restaurant', 14, 22);
    
    // Add Metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, 14, 30);
    doc.text(`Nombre total de commandes: ${data.length}`, 14, 36);
    
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    doc.text(`Montant total: ${formatCurrency(totalAmount)}`, 14, 42);
    
    // Define Table
    const tableColumn = [
      'ID', 
      'Date & Heure', 
      'Client', 
      'Email', 
      'Type', 
      'Montant', 
      'Paiement', 
      'Statut'
    ];
    
    const tableRows = data.map(row => [
      row.id,
      row.date,
      row.customer_name,
      row.email,
      row.type,
      row.amount_formatted,
      row.payment_method,
      row.status
    ]);
    
    // Generate Table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 20 },
        5: { halign: 'right' }
      }
    });
    
    // Save PDF
    doc.save(`commandes_restaurant_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};