import { describe, it, expect } from 'vitest';
import {
  VALID_ORDER_STATUSES,
  TERMINAL_STATUSES,
  getValidNextStatuses,
  getValidStatusTransitionsForOrderMethod,
  isValidStatusTransition,
} from '@/lib/orderStatusValidation';

describe('orderStatusValidation', () => {
  describe('VALID_ORDER_STATUSES', () => {
    it('contains all expected statuses', () => {
      expect(VALID_ORDER_STATUSES).toContain('pending');
      expect(VALID_ORDER_STATUSES).toContain('confirmed');
      expect(VALID_ORDER_STATUSES).toContain('preparing');
      expect(VALID_ORDER_STATUSES).toContain('ready');
      expect(VALID_ORDER_STATUSES).toContain('delivered');
      expect(VALID_ORDER_STATUSES).toContain('served');
      expect(VALID_ORDER_STATUSES).toContain('cancelled');
    });
  });

  describe('TERMINAL_STATUSES', () => {
    it('contains delivered, served, cancelled, rejected', () => {
      expect(TERMINAL_STATUSES).toEqual(expect.arrayContaining(['delivered', 'served', 'cancelled', 'rejected']));
    });

    it('does NOT contain pending or preparing', () => {
      expect(TERMINAL_STATUSES).not.toContain('pending');
      expect(TERMINAL_STATUSES).not.toContain('preparing');
    });
  });

  describe('isValidStatusTransition', () => {
    it('allows pending → confirmed', () => {
      expect(isValidStatusTransition('pending', 'confirmed')).toBe(true);
    });

    it('allows pending → cancelled from any state', () => {
      expect(isValidStatusTransition('pending', 'cancelled')).toBe(true);
      expect(isValidStatusTransition('preparing', 'cancelled')).toBe(true);
      expect(isValidStatusTransition('ready', 'cancelled')).toBe(true);
    });

    it('blocks transition from terminal status', () => {
      expect(isValidStatusTransition('delivered', 'pending')).toBe(false);
      expect(isValidStatusTransition('served', 'preparing')).toBe(false);
      expect(isValidStatusTransition('cancelled', 'confirmed')).toBe(false);
    });

    it('blocks skipping stages (pending → delivered)', () => {
      expect(isValidStatusTransition('pending', 'delivered')).toBe(false);
    });

    it('allows same status (no-op)', () => {
      expect(isValidStatusTransition('pending', 'pending')).toBe(true);
      expect(isValidStatusTransition('preparing', 'preparing')).toBe(true);
    });

    it('follows complete delivery flow', () => {
      const flow = ['pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'arrived_at_customer', 'delivered'];
      for (let i = 0; i < flow.length - 1; i++) {
        expect(isValidStatusTransition(flow[i], flow[i + 1])).toBe(true);
      }
    });
  });

  describe('counter order flow', () => {
    it('allows pending → served for counter orders', () => {
      expect(isValidStatusTransition('pending', 'served', 'counter')).toBe(true);
    });

    it('blocks pending → delivering for counter orders', () => {
      expect(isValidStatusTransition('pending', 'in_transit', 'counter')).toBe(false);
    });

    it('always allows cancellation for counter orders', () => {
      expect(isValidStatusTransition('pending', 'cancelled', 'counter')).toBe(true);
    });
  });

  describe('getValidNextStatuses', () => {
    it('returns empty array for terminal statuses', () => {
      expect(getValidNextStatuses('delivered')).toEqual([]);
      expect(getValidNextStatuses('cancelled')).toEqual([]);
    });

    it('returns next valid statuses for pending', () => {
      const next = getValidNextStatuses('pending');
      expect(next).toContain('confirmed');
      expect(next).toContain('cancelled');
    });
  });
});
