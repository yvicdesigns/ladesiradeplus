import { formatCurrency, formatDate } from './formatters';

export const getStockStatus = (current, min, max, reorder) => {
  if (current <= 0) return { status: 'critical', color: 'bg-red-100 text-red-800' };
  if (current <= min) return { status: 'low', color: 'bg-amber-100 text-amber-800' };
  if (current <= reorder) return { status: 'reorder', color: 'bg-yellow-100 text-yellow-800' };
  if (current > max) return { status: 'overstock', color: 'bg-blue-100 text-blue-800' };
  return { status: 'optimal', color: 'bg-amber-100 text-amber-800' };
};

export const getOrderStatusColor = (status) => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'pending': return 'bg-blue-100 text-blue-800';
    case 'received': return 'bg-amber-100 text-amber-800';
    case 'partial': return 'bg-amber-100 text-amber-800';
    case 'cancelled': return 'bg-gray-800 text-white';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getMovementTypeColor = (type) => {
  switch (type) {
    case 'purchase': return 'bg-amber-100 text-amber-800';
    case 'usage': return 'bg-blue-100 text-blue-800';
    case 'adjustment': return 'bg-gray-100 text-gray-800';
    case 'waste': return 'bg-red-100 text-red-800';
    case 'return': return 'bg-amber-100 text-amber-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const calculateInventoryKPIs = (ingredients, orders, alerts) => {
  const totalValue = ingredients.reduce((sum, item) => sum + (Number(item.current_stock) * Number(item.unit_cost)), 0);
  const criticalCount = ingredients.filter(i => i.current_stock <= i.min_stock).length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const unresolvedAlerts = alerts.filter(a => !a.is_resolved).length;
  
  return {
    totalValue,
    criticalCount,
    pendingOrders,
    unresolvedAlerts
  };
};

export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      let value = row[fieldName];
      if (value === null || value === undefined) value = '';
      if (typeof value === 'object') value = JSON.stringify(value).replace(/"/g, '""'); 
      if (typeof value === 'string' && value.includes(',')) value = `"${value}"`;
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};