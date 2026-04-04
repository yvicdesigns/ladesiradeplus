import { supabase } from './customSupabaseClient';

export const runSupabaseDiagnostics = async () => {
  console.log("Starting Supabase System Diagnostics...");
  const report = {
    timestamp: new Date().toISOString(),
    network: { online: navigator.onLine },
    auth: { status: 'unknown' },
    tables: {},
    performance: {}
  };

  try {
    // 1. Check Auth
    const t0 = performance.now();
    const { data: session, error: authError } = await supabase.auth.getSession();
    report.performance.authCheckMs = Math.round(performance.now() - t0);
    
    if (authError) {
      report.auth.status = 'error';
      report.auth.error = authError.message;
    } else {
      report.auth.status = session?.session ? 'authenticated' : 'unauthenticated';
      report.auth.user = session?.session?.user?.id;
    }

    // 2. Check Tables
    const tablesToTest = ['menu_items', 'item_stock_movements', 'profiles'];
    
    for (const table of tablesToTest) {
      const tStart = performance.now();
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        report.performance[`${table}Ms`] = Math.round(performance.now() - tStart);
        
        if (error) {
          report.tables[table] = {
            accessible: false,
            error: error.message,
            code: error.code,
            isRls: error.code === '42501'
          };
        } else {
          report.tables[table] = { accessible: true };
        }
      } catch (err) {
        report.tables[table] = { accessible: false, exception: err.message };
      }
    }

    console.log("Diagnostics Complete", report);
    return report;
  } catch (error) {
    console.error("Fatal error during diagnostics", error);
    report.fatalError = error.message;
    return report;
  }
};