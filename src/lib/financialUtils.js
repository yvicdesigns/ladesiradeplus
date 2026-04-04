import { isWithinInterval, parseISO, startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

export const getPeriodDateRange = (period, customRange = {}) => {
  const now = new Date();
  let start = startOfDay(now);
  let end = endOfDay(now);

  switch (period) {
    case 'today':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'quarter':
      start = subMonths(now, 3);
      end = endOfDay(now);
      break;
    case 'year':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    case 'custom':
      if (customRange.from && customRange.to) {
        start = startOfDay(customRange.from);
        end = endOfDay(customRange.to);
      }
      break;
    default:
      start = startOfMonth(now);
      end = endOfMonth(now);
  }
  return { start, end };
};

export const filterByDateRange = (data, dateField, start, end) => {
  if (!data) return [];
  return data.filter(item => {
    if (!item[dateField]) return false;
    const date = new Date(item[dateField]);
    return isWithinInterval(date, { start, end });
  });
};

export const calculateTotalRevenue = (payments) => {
  return payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);
};

export const calculatePendingPayments = (payments) => {
  return payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);
};

export const calculateFailedPayments = (payments) => {
  return payments
    .filter(p => p.status === 'failed')
    .reduce((sum, p) => sum + Number(p.amount), 0);
};

export const calculateRefundedAmount = (refunds) => {
  return refunds
    .filter(r => r.status === 'processed' || r.status === 'approved')
    .reduce((sum, r) => sum + Number(r.amount), 0);
};

export const calculateUnpaidInvoices = (invoices) => {
  return invoices
    .filter(i => i.status === 'issued' || i.status === 'overdue')
    .reduce((sum, i) => sum + Number(i.total_ttc), 0);
};

export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  
  // Flatten data if needed, basic implementation assumes flat objects
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      let value = row[fieldName];
      // Handle null/undefined
      if (value === null || value === undefined) value = '';
      // Handle strings with commas
      if (typeof value === 'string' && value.includes(',')) value = `"${value}"`;
      // Handle dates
      if (value instanceof Date) value = value.toISOString();
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};