import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDateTime } from '@/lib/formatters';

export const HistoryExportButtons = ({ orders = [] }) => {
  
  const prepareData = () => {
    return orders.map(o => {
        const date = o.delivery_orders?.[0]?.order_date || o.restaurant_orders?.[0]?.order_date || o.created_at?.split('T')[0];
        const status = o.status || o.delivery_orders?.[0]?.status || o.restaurant_orders?.[0]?.status;
        const type = o.type === 'dine-in' ? 'Sur Place' : (o.type === 'delivery' ? 'Livraison' : 'Emporter');
        
        return {
            id: o.id.slice(0, 8),
            date: date,
            fullDate: formatDateTime(o.created_at),
            type: type,
            status: status,
            customer: o.customer_name || 'Inconnu',
            phone: o.delivery_orders?.[0]?.customer_phone || '-',
            amount: o.total,
            formattedAmount: formatCurrency(o.total)
        };
    });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const data = prepareData();

    doc.setFontSize(18);
    doc.text('Rapport d\'Historique des Commandes', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Commandes: ${data.length}`, 14, 36);

    const tableColumn = ["N° Commande", "Date", "Type", "Statut", "Client", "Montant"];
    const tableRows = [];

    data.forEach(item => {
      const rowData = [
        item.id,
        item.date,
        item.type,
        item.status,
        item.customer,
        item.formattedAmount
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 44,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185] }, // Blue header
    });

    doc.save(`historique_commandes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportExcel = () => {
    const data = prepareData();
    const worksheetData = data.map(item => ({
        "N° Commande": item.id,
        "Date": item.date,
        "Heure Création": item.fullDate,
        "Type": item.type,
        "Statut": item.status,
        "Client": item.customer,
        "Téléphone": item.phone,
        "Montant": Number(item.amount)
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historique");
    
    // Auto-width columns roughly
    const maxWidth = worksheetData.reduce((w, r) => Math.max(w, r["Client"]?.length || 0), 10);
    worksheet["!cols"] = [
        { wch: 12 }, // ID
        { wch: 12 }, // Date
        { wch: 20 }, // Full Date
        { wch: 10 }, // Type
        { wch: 12 }, // Status
        { wch: maxWidth + 5 }, // Client
        { wch: 15 }, // Phone
        { wch: 12 }  // Amount
    ];

    XLSX.writeFile(workbook, `historique_commandes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
        onClick={exportPDF}
        disabled={orders.length === 0}
      >
        <FileDown className="h-4 w-4" /> PDF
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-green-100"
        onClick={exportExcel}
        disabled={orders.length === 0}
      >
        <FileSpreadsheet className="h-4 w-4" /> Excel
      </Button>
    </div>
  );
};