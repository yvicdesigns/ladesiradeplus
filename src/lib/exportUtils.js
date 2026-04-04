import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Trigger a browser download for a file
 * @param {Blob} blob 
 * @param {string} filename 
 */
const saveFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Format and download data as CSV
 * @param {Array} data - Array of objects
 * @param {string} filename - Output filename
 * @param {Array} columns - Array of { header, key } objects defining columns
 */
export const downloadCSV = (data, filename, columns) => {
  if (!data || !data.length) return;

  // Header row
  const headers = columns.map(col => `"${col.header}"`).join(',');
  
  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let cell = row[col.key];
      // Handle nested properties if key contains dots (e.g., 'customer.name')
      if (col.key.includes('.')) {
        cell = col.key.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : '', row);
      }
      
      // Escape quotes and wrap in quotes
      const cellContent = cell === null || cell === undefined ? '' : String(cell).replace(/"/g, '""');
      return `"${cellContent}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  
  // Add Byte Order Mark for UTF-8 compatibility in Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  saveFile(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};

/**
 * Format and download data as JSON
 * @param {Array} data 
 * @param {string} filename 
 */
export const downloadJSON = (data, filename) => {
  if (!data || !data.length) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveFile(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
};

/**
 * Format and download data as PDF
 * @param {Array} data 
 * @param {string} filename 
 * @param {string} title 
 * @param {Array} columns - Array of { header, key }
 */
export const downloadPDF = (data, filename, title, columns) => {
  if (!data || !data.length) return;

  const doc = new jsPDF();
  const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

  // Add Header
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Exporté le : ${dateStr}`, 14, 30);
  doc.text(`Nombre de lignes : ${data.length}`, 14, 35);

  // Prepare table data
  const tableHead = [columns.map(c => c.header)];
  const tableBody = data.map(row => {
    return columns.map(col => {
      let cell = row[col.key];
      if (col.key.includes('.')) {
        cell = col.key.split('.').reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : '', row);
      }
      return cell === null || cell === undefined ? '' : String(cell);
    });
  });

  // Add Table
  doc.autoTable({
    head: tableHead,
    body: tableBody,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Add Footer with page numbers
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} sur ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};

export const getExportFileName = (prefix) => {
  const date = format(new Date(), 'yyyy-MM-dd');
  return `${prefix}_${date}`;
};