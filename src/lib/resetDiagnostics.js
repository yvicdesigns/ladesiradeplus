import { supabase } from '@/lib/customSupabaseClient';

export const TABLES_TO_RESET = [
  'activity_logs', 'user_notifications', 'delivery_tracking', 'item_stock_movements',
  'refunds', 'payments', 'order_items', 'delivery_orders', 'restaurant_orders',
  'customer_orders', 'customer_reservations', 'reservations', 'reviews',
  'analytics_cache', 'reports', 'orders', 'customers', 'audit_logs'
];

export const runPreResetDiagnostics = async () => {
  const diagnostics = {
    success: false,
    authStatus: 'pending',
    adminRole: 'pending',
    connection: 'pending',
    tables: {},
    totalRows: 0,
    potentialBlockers: [],
    canProceed: false,
    errors: []
  };

  try {
    // 1. Check Auth & Role
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      diagnostics.authStatus = 'failed';
      diagnostics.errors.push('User not authenticated.');
      return diagnostics;
    }
    diagnostics.authStatus = 'ok';

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      diagnostics.adminRole = 'failed';
      diagnostics.errors.push('Admin privileges required.');
      return diagnostics;
    }
    diagnostics.adminRole = 'ok';

    // 2. Check connection
    const { error: pingError } = await supabase.from('orders').select('id').limit(1);
    if (pingError && pingError.code !== 'PGRST116') {
      diagnostics.connection = 'failed';
      diagnostics.errors.push(`Database connection failed: ${pingError.message}`);
      return diagnostics;
    }
    diagnostics.connection = 'ok';

    // 3. Scan Tables
    for (const table of TABLES_TO_RESET) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.code !== '42P01') { // Ignore missing tables
            diagnostics.potentialBlockers.push({ table, issue: error.message });
          }
          diagnostics.tables[table] = { status: 'error', count: 0, message: error.message };
        } else {
          diagnostics.tables[table] = { status: 'ok', count: count || 0 };
          diagnostics.totalRows += (count || 0);
        }
      } catch (err) {
        diagnostics.tables[table] = { status: 'error', count: 0, message: err.message };
      }
    }

    // 4. Advanced Diagnostics via RPC
    try {
      const { data: advDiag } = await supabase.rpc('diagnose_reset_issues');
      if (advDiag && advDiag.blocking_fks?.length > 0) {
        advDiag.blocking_fks.forEach(fk => {
          diagnostics.potentialBlockers.push({
            table: fk.table_name,
            issue: `Blocking FK: ${fk.constraint_name} (Missing CASCADE)`
          });
        });
      }
    } catch (e) {
      console.warn("Advanced diagnostics RPC failed, skipping.", e);
    }

    diagnostics.canProceed = diagnostics.errors.length === 0;
    diagnostics.success = true;

  } catch (err) {
    diagnostics.errors.push(`Unexpected diagnostic error: ${err.message}`);
  }

  return diagnostics;
};