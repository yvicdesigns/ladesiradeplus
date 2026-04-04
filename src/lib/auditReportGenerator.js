/**
 * Utility to generate and format audit reports.
 */

export const generateAuditReportJSON = (results, metaInfo) => {
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      environment: 'production',
      ...metaInfo
    },
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      warnings: results.filter(r => r.status === 'warning').length,
      failed: results.filter(r => r.status === 'fail').length,
    },
    results: results
  };

  return JSON.stringify(report, null, 2);
};

export const downloadAsJSON = (results, filename = 'audit-report.json') => {
  const json = generateAuditReportJSON(results, { type: 'Full System Audit' });
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadAsCSV = (results, filename = 'audit-report.csv') => {
  const headers = ['ID', 'Title', 'Status', 'Severity', 'Message', 'Details'];
  const rows = results.map(r => [
    r.id,
    `"${r.title}"`,
    r.status,
    r.severity,
    `"${r.message.replace(/"/g, '""')}"`,
    `"${r.details?.replace(/"/g, '""') || ''}"`
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};