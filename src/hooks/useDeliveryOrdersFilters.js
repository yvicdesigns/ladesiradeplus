import { useState, useMemo, useCallback } from 'react';

export const useDeliveryOrdersFilters = (initialOrders = []) => {
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });

  const filteredOrders = useMemo(() => {
    if (!initialOrders || !Array.isArray(initialOrders)) return [];

    return initialOrders.filter(order => {
      // Date Filter
      if (advancedFilters.dateFrom) {
        const orderDate = new Date(order.created_at);
        const fromDate = new Date(advancedFilters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (orderDate < fromDate) return false;
      }

      if (advancedFilters.dateTo) {
        const orderDate = new Date(order.created_at);
        const toDate = new Date(advancedFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) return false;
      }

      // Amount Filter
      const total = Number(order.total) || 0;
      if (advancedFilters.amountMin !== '' && total < Number(advancedFilters.amountMin)) return false;
      if (advancedFilters.amountMax !== '' && total > Number(advancedFilters.amountMax)) return false;

      return true;
    });
  }, [initialOrders, advancedFilters]);

  const resetFilters = useCallback(() => {
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: ''
    });
  }, []);

  return {
    advancedFilters,
    setAdvancedFilters,
    filteredOrders,
    resetFilters
  };
};