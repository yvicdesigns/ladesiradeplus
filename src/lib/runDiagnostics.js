import { supabase } from '@/lib/customSupabaseClient';

export const runDataIntegrityDiagnostics = async () => {
  console.log("=========================================");
  console.log("🚀 STARTING SUPABASE DIAGNOSTIC QUERIES");
  console.log("=========================================");

  try {
    const { data, error } = await supabase.rpc('run_data_integrity_diagnostics');
    
    if (error) throw error;

    console.log("\n--- Query 1: Orders Table Row Counts ---");
    console.log(JSON.stringify(data.q1, null, 2));

    console.log("\n--- Query 2: Last 30 Orders ---");
    if (data.q2 && data.q2.length > 0) {
      console.table(data.q2);
    } else {
      console.log("No records found.");
    }

    console.log("\n--- Query 3: useUnreadDeliveryOrders Query (exact replica) ---");
    console.log(JSON.stringify(data.q3, null, 2));

    console.log("\n--- Query 4: useNewOrderNotificationBadge Query (exact replica) ---");
    console.log(JSON.stringify(data.q4, null, 2));

    console.log("\n--- Query 5: Data Integrity Check (conflicting data) ---");
    if (data.q5 && data.q5.length > 0) {
      console.table(data.q5);
    } else {
      console.log("✅ No conflicting data found.");
    }

    console.log("\n--- Query 6: Orphaned Records Check ---");
    if (data.q6 && data.q6.length > 0) {
      console.table(data.q6);
    } else {
      console.log("✅ No orphaned records found.");
    }

    console.log("\n--- Query 7: Foreign Key Constraints on orders table ---");
    if (data.q7 && data.q7.length > 0) {
      console.table(data.q7);
    } else {
      console.log("No FKs found.");
    }

    console.log("\n--- Query 8: RLS Policies on orders table ---");
    if (data.q8 && data.q8.length > 0) {
      console.table(data.q8);
    } else {
      console.log("No RLS policies found.");
    }

  } catch (err) {
    console.error("\n❌ Diagnostic Execution Failed:", err.message || err);
  }

  console.log("\n=========================================");
  console.log("🏁 DIAGNOSTICS COMPLETE");
  console.log("=========================================");
};