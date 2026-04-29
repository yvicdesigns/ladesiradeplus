import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateIngredientStock } from '@/hooks/useMenuItemIngredients';

// Mock supabase — we test the aggregation logic, not the DB layer
vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/customSupabaseClient';

function makeSupabaseMock(links) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: links, error: null }),
  };
  supabase.from.mockReturnValue(chain);
  return chain;
}

describe('validateIngredientStock', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns valid for empty cart', async () => {
    const result = await validateIngredientStock([]);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('returns valid when no ingredient links exist', async () => {
    makeSupabaseMock([]);
    const result = await validateIngredientStock([{ id: 'item-1', quantity: 2 }]);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('returns valid when stock is sufficient', async () => {
    makeSupabaseMock([
      {
        menu_item_id: 'item-1',
        ingredient_id: 'ing-1',
        quantity_per_serving: 100,
        ingredients: { id: 'ing-1', name: 'Farine', current_stock: 500, unit: 'g' },
      },
    ]);
    const result = await validateIngredientStock([{ id: 'item-1', quantity: 2 }]);
    // needs 200g, has 500g
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error when stock is insufficient', async () => {
    makeSupabaseMock([
      {
        menu_item_id: 'item-1',
        ingredient_id: 'ing-1',
        quantity_per_serving: 200,
        ingredients: { id: 'ing-1', name: 'Farine', current_stock: 300, unit: 'g' },
      },
    ]);
    const result = await validateIngredientStock([{ id: 'item-1', quantity: 2 }]);
    // needs 400g, has 300g
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      name: 'Farine',
      available: 300,
      needed: 400,
      unit: 'g',
    });
  });

  it('treats null stock as unlimited (no error)', async () => {
    makeSupabaseMock([
      {
        menu_item_id: 'item-1',
        ingredient_id: 'ing-1',
        quantity_per_serving: 500,
        ingredients: { id: 'ing-1', name: 'Eau', current_stock: null, unit: 'ml' },
      },
    ]);
    const result = await validateIngredientStock([{ id: 'item-1', quantity: 10 }]);
    expect(result.valid).toBe(true);
  });

  it('aggregates the same ingredient across multiple cart items', async () => {
    // item-1 and item-2 both use ing-1 — total must be summed before comparing
    makeSupabaseMock([
      {
        menu_item_id: 'item-1',
        ingredient_id: 'ing-1',
        quantity_per_serving: 100,
        ingredients: { id: 'ing-1', name: 'Sucre', current_stock: 250, unit: 'g' },
      },
      {
        menu_item_id: 'item-2',
        ingredient_id: 'ing-1',
        quantity_per_serving: 150,
        ingredients: { id: 'ing-1', name: 'Sucre', current_stock: 250, unit: 'g' },
      },
    ]);
    const result = await validateIngredientStock([
      { id: 'item-1', quantity: 1 }, // needs 100g
      { id: 'item-2', quantity: 1 }, // needs 150g — total 250g exactly
    ]);
    // 250 needed == 250 available — should be valid (not strictly less than)
    expect(result.valid).toBe(true);
  });

  it('fails when aggregated total exceeds stock', async () => {
    makeSupabaseMock([
      {
        menu_item_id: 'item-1',
        ingredient_id: 'ing-1',
        quantity_per_serving: 100,
        ingredients: { id: 'ing-1', name: 'Sucre', current_stock: 200, unit: 'g' },
      },
      {
        menu_item_id: 'item-2',
        ingredient_id: 'ing-1',
        quantity_per_serving: 150,
        ingredients: { id: 'ing-1', name: 'Sucre', current_stock: 200, unit: 'g' },
      },
    ]);
    const result = await validateIngredientStock([
      { id: 'item-1', quantity: 1 }, // 100g
      { id: 'item-2', quantity: 1 }, // 150g — total 250g > 200g available
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].needed).toBe(250);
    expect(result.errors[0].available).toBe(200);
  });

  it('supports menu_item_id key as well as id', async () => {
    makeSupabaseMock([
      {
        menu_item_id: 'item-1',
        ingredient_id: 'ing-1',
        quantity_per_serving: 50,
        ingredients: { id: 'ing-1', name: 'Lait', current_stock: 10, unit: 'cl' },
      },
    ]);
    // cartItem uses menu_item_id instead of id
    const result = await validateIngredientStock([{ menu_item_id: 'item-1', quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].name).toBe('Lait');
  });
});
