import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/components/ui/use-toast';

export const exportAuditJSON = (auditData) => {
  try {
    const data = JSON.stringify(auditData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robustness_audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const exportAuditCSV = (auditData) => {
  try {
    const headers = ['Catégorie', 'Sévérité', 'ID', 'Titre', 'Description', 'Recommandation'];
    const rows = [];

    auditData.categoryResults.forEach(cat => {
      cat.issues.forEach(issue => {
        rows.push([
          cat.category,
          issue.severity,
          issue.id,
          `"${issue.title.replace(/"/g, '""')}"`,
          `"${issue.description.replace(/"/g, '""')}"`,
          `"${issue.recommendation.replace(/"/g, '""')}"`
        ]);
      });
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robustness_audit_issues_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const exportAuditPDF = (auditData) => {
  try {
    const doc = new jsPDF();
    const date = new Date(auditData.timestamp).toLocaleString();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Rapport d'Audit de Robustesse", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Généré le : ${date} | Version : 1.0.0 | Env : Production`, 14, 28);
    
    // Global Score & Verdict
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Score Global", 14, 40);
    
    doc.setFontSize(24);
    if (auditData.overallScore >= 85) doc.setTextColor(22, 163, 74);
    else if (auditData.overallScore >= 60) doc.setTextColor(234, 88, 12);
    else doc.setTextColor(220, 38, 38);
    doc.text(`${auditData.overallScore}%`, 14, 50);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(`Prêt pour publication ? : ${auditData.verdict}`, 70, 40);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const splitReason = doc.splitTextToSize(auditData.reason, 120);
    doc.text(splitReason, 70, 46);

    // Category Scores Table
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Scores par Catégorie", 14, 65);

    const catData = auditData.categoryResults.map(c => [c.category, `${c.score}%`, c.issues.length.toString()]);
    
    doc.autoTable({
      startY: 70,
      head: [['Catégorie', 'Score', 'Problèmes détectés']],
      body: catData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    // Issues List
    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Liste des Problèmes", 14, finalY);

    const issueData = [];
    auditData.categoryResults.forEach(cat => {
      cat.issues.forEach(issue => {
        issueData.push([
          issue.severity,
          cat.category,
          issue.title,
          issue.description
        ]);
      });
    });

    doc.autoTable({
      startY: finalY + 5,
      head: [['Sévérité', 'Catégorie', 'Problème', 'Description']],
      body: issueData,
      theme: 'grid',
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' }
      },
      willDrawCell: function(data) {
        if (data.column.index === 0 && data.cell.section === 'body') {
          if (data.cell.raw === 'Critique') data.cell.styles.textColor = [220, 38, 38];
          if (data.cell.raw === 'Majeur') data.cell.styles.textColor = [234, 88, 12];
          if (data.cell.raw === 'Mineur') data.cell.styles.textColor = [202, 138, 4];
        }
      }
    });

    doc.save(`robustness_audit_report_${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};