import { useState, useCallback, useRef } from 'react';
import { deliveryOrderDiagnostics } from '@/lib/deliveryOrderDiagnostics';

export const useDeliveryOrderDiagnostics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache to avoid repeated schema queries
  const cache = useRef({
    schemas: {},
    fks: {},
    comparison: null
  });

  const getTableSchema = useCallback(async (tableName) => {
    if (cache.current.schemas[tableName]) return cache.current.schemas[tableName];
    
    setLoading(true);
    try {
      const schema = await deliveryOrderDiagnostics.getTableStructure(tableName);
      cache.current.schemas[tableName] = schema;
      return schema;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTableFks = useCallback(async (tableName) => {
    if (cache.current.fks[tableName]) return cache.current.fks[tableName];
    
    setLoading(true);
    try {
      const fks = await deliveryOrderDiagnostics.getTableForeignKeys(tableName);
      cache.current.fks[tableName] = fks;
      return fks;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getComparison = useCallback(async () => {
    if (cache.current.comparison) return cache.current.comparison;

    setLoading(true);
    try {
      const comp = await deliveryOrderDiagnostics.compareTableStructures('delivery_orders', 'restaurant_orders');
      cache.current.comparison = comp;
      return comp;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeDeletion = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const records = await deliveryOrderDiagnostics.getRelatedRecords(orderId);
      const query = deliveryOrderDiagnostics.generateDeletionQuery(orderId, records);
      const plan = deliveryOrderDiagnostics.getDeletionPlan(orderId, records);
      
      return { records, query, plan };
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getTableSchema,
    getTableFks,
    getComparison,
    analyzeDeletion
  };
};