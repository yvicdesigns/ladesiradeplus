import { supabase } from './customSupabaseClient';

export const runOrderStatusDiagnostic = async () => {
  console.log("🔍 [Diagnostics] Démarrage de l'analyse du flux de mise à jour des statuts...");
  const report = {
    timestamp: new Date().toISOString(),
    auth: null,
    permissions: null,
    system: null,
    errors: []
  };

  try {
    // 1. Check Authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    report.auth = {
      authenticated: !!authData?.session,
      user_id: authData?.session?.user?.id,
      error: authError?.message
    };
    if (authError) report.errors.push(`Auth Error: ${authError.message}`);

    // 2. Check Permissions via RPC
    const { data: permData, error: permError } = await supabase.rpc('diagnose_restaurant_order_permissions');
    report.permissions = permData;
    if (permError) report.errors.push(`Permissions RPC Error: ${permError.message}`);

    // 3. Check System / Database Functions via RPC
    const { data: sysData, error: sysError } = await supabase.rpc('diagnose_order_status_updates');
    report.system = sysData;
    if (sysError) report.errors.push(`System RPC Error: ${sysError.message}`);

    console.log("📊 [Diagnostics] Rapport complet :", report);

    return { 
      success: report.errors.length === 0, 
      report 
    };
  } catch (err) {
    console.error("❌ [Diagnostics] Échec inattendu de l'analyse :", err);
    report.errors.push(`Unexpected JS Error: ${err.message}`);
    return { success: false, report, error: err.message };
  }
};