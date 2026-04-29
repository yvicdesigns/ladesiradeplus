import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateOrder } from '@/modules/orders/hooks/useCreateOrder';

// vi.hoisted ensures these exist before vi.mock factories run (vi.mock is hoisted)
const { mockCreateOrderAtomic, mockToast } = vi.hoisted(() => ({
  mockCreateOrderAtomic: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock('@/modules/orders/services/ordersService', () => ({
  ordersService: { createOrderAtomic: mockCreateOrderAtomic },
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

vi.mock('@/lib/adminSettingsUtils', () => ({
  RESTAURANT_ID: 'restaurant-default',
}));

const wrapper = ({ children }) => children;

describe('useCreateOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with idle state', () => {
    const { result } = renderHook(() => useCreateOrder(), { wrapper });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.orderId).toBeNull();
  });

  it('rejects an order with no items', async () => {
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    let returnValue;
    await act(async () => {
      returnValue = await result.current.createOrder({ items: [] });
    });

    expect(returnValue).toBeNull();
    expect(result.current.error).toBe('La commande doit contenir au moins un article.');
    expect(mockCreateOrderAtomic).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('uses RESTAURANT_ID as fallback when restaurant_id is not provided', async () => {
    mockCreateOrderAtomic.mockResolvedValue('order-abc');
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    await act(async () => {
      await result.current.createOrder({ items: [{ id: 'item-1' }] });
    });

    expect(mockCreateOrderAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ restaurant_id: 'restaurant-default' })
    );
  });

  it('keeps provided restaurant_id when given', async () => {
    mockCreateOrderAtomic.mockResolvedValue('order-abc');
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    await act(async () => {
      await result.current.createOrder({ items: [{ id: 'item-1' }], restaurant_id: 'restaurant-custom' });
    });

    expect(mockCreateOrderAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ restaurant_id: 'restaurant-custom' })
    );
  });

  it('attaches user_id from auth context', async () => {
    mockCreateOrderAtomic.mockResolvedValue('order-abc');
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    await act(async () => {
      await result.current.createOrder({ items: [{ id: 'item-1' }] });
    });

    expect(mockCreateOrderAtomic).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-123' })
    );
  });

  it('returns orderId and shows success toast on success', async () => {
    mockCreateOrderAtomic.mockResolvedValue('order-xyz');
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    let returnValue;
    await act(async () => {
      returnValue = await result.current.createOrder({ items: [{ id: 'item-1' }] });
    });

    expect(returnValue).toBe('order-xyz');
    expect(result.current.orderId).toBe('order-xyz');
    expect(result.current.error).toBeNull();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Commande validée !' }));
  });

  it('returns null and stores error message on service failure', async () => {
    mockCreateOrderAtomic.mockRejectedValue(new Error('Stock insuffisant'));
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    let returnValue;
    await act(async () => {
      returnValue = await result.current.createOrder({ items: [{ id: 'item-1' }] });
    });

    expect(returnValue).toBeNull();
    expect(result.current.error).toBe('Stock insuffisant');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('loading is true during the call and false after', async () => {
    let resolveOrder;
    mockCreateOrderAtomic.mockReturnValue(new Promise(r => { resolveOrder = r; }));
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    act(() => {
      result.current.createOrder({ items: [{ id: 'item-1' }] });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolveOrder('order-done'); });

    expect(result.current.loading).toBe(false);
  });
});
