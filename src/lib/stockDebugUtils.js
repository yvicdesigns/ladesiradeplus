import { supabase } from '@/lib/customSupabaseClient';

export const logStockFetch = (table, queryParams, error = null, resultCount = 0, durationMs = 0) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[STOCK DEBUG] [${timestamp}] FETCH ERROR on table: ${table}`, {
      query: queryParams,
      error: error.message || error,
      code: error.code,
      details: error.details,
      durationMs,
      stack: error.stack
    });
  } else {
    console.log(`[STOCK DEBUG] [${timestamp}] FETCH SUCCESS on table: ${table}`, {
      query: queryParams,
      resultCount,
      durationMs: `${Math.round(durationMs)}ms`
    });
  }
};

export const logStockUpdate = (itemId, changeDetails, result = null, error = null, durationMs = 0) => {
  const timestamp = new Date().toISOString();
  if (error) {
    console.error(`[STOCK DEBUG] [${timestamp}] UPDATE ERROR for item: ${itemId}`, {
      change: changeDetails,
      error: error.message || error,
      code: error.code,
      details: error.details,
      durationMs,
      stack: error.stack
    });
  } else {
    console.log(`[STOCK DEBUG] [${timestamp}] UPDATE SUCCESS for item: ${itemId}`, {
      change: changeDetails,
      result,
      durationMs: `${Math.round(durationMs)}ms`
    });
  }
};

export const getStockDebugInfo = async () => {
  const timestamp = new Date().toISOString();
  console.log(`[STOCK DEBUG] [${timestamp}] Running Stock System Diagnostic...`);
  
  const info = {
    timestamp,
    networkOnline: navigator.onLine,
    authStatus: null,
    menuItemsAccessible: false,
    stockMovementsAccessible: false,
    errors: []
  };

  try {
    const { data: session } = await supabase.auth.getSession();
    info.authStatus = session?.session ? 'Authenticated' : 'Unauthenticated';
    
    // Check menu_items
    const { error: menuError } = await supabase.from('menu_items').select('id').limit(1);
    if (menuError) {
      info.errors.push(`Menu Items Access Error: ${menuError.message}`);
    } else {
      info.menuItemsAccessible = true;
    }

    // Check item_stock_movements
    const { error: movementsError } = await supabase.from('item_stock_movements').select('id').limit(1);
    if (movementsError) {
      info.errors.push(`Stock Movements Access Error: ${movementsError.message}`);
    } else {
      info.stockMovementsAccessible = true;
    }

  } catch (err) {
    info.errors.push(`Diagnostic failed: ${err.message}`);
  }

  console.table(info);
  return info;
};