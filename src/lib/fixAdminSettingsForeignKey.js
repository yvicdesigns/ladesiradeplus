import { supabase } from '@/lib/customSupabaseClient';

/**
 * Task 4: Fix script for admin_settings foreign key constraint issues.
 * Creates default restaurant if missing and clears/updates orphaned records.
 */
export const fixAdminSettingsForeignKey = async () => {
  const actionsTaken = [];
  
  try {
    console.log("🔧 [FK Fix] Running admin_settings foreign key integrity check...");
    const { data: diag, error: diagErr } = await supabase.rpc('diagnose_admin_settings_fk_issue');
    
    if (diagErr) {
      console.error("🔧 [FK Fix] Failed to run diagnostics:", diagErr);
      return { success: false, error: diagErr.message, actionsTaken };
    }

    if (diag.recommendation === 'All good') {
      console.log("✅ [FK Fix] No issues found. Database integrity is solid.");
      return { success: true, message: 'All good', actionsTaken, diag };
    }

    // 1. Create Default Restaurant if missing
    if (diag.restaurants_count === 0) {
      console.log("⚠️ [FK Fix] Restaurants table is empty. Initializing default restaurant...");
      const { data: initData, error: initErr } = await supabase.rpc('initialize_restaurant_and_settings', {
          p_restaurant_name: "Ladesirade Restaurant",
          p_admin_id: '00000000-0000-0000-0000-000000000000',
          p_settings_data: {}
      });
      
      if (initErr || !initData?.success) {
        throw new Error(`Failed to create default restaurant: ${initErr?.message || initData?.error}`);
      }
      actionsTaken.push("Created default restaurant (7eedf081-0268-4867-af38-61fa5932420a)");
    }

    // 2. Fix Orphaned admin_settings records
    if (diag.orphaned_admin_settings?.length > 0) {
      console.log(`⚠️ [FK Fix] Found ${diag.orphaned_admin_settings.length} orphaned admin_settings records. Deleting them to satisfy constraints...`);
      for (const orphan of diag.orphaned_admin_settings) {
        const { error: delErr } = await supabase
          .from('admin_settings')
          .delete()
          .eq('id', orphan.id);
          
        if (delErr) {
           console.error(`Failed to delete orphaned record ${orphan.id}:`, delErr);
        } else {
           actionsTaken.push(`Deleted orphaned admin_settings record (ID: ${orphan.id})`);
        }
      }
    }

    // Re-verify
    const { data: finalDiag } = await supabase.rpc('diagnose_admin_settings_fk_issue');
    const isFixed = finalDiag?.recommendation === 'All good';

    return { 
      success: isFixed, 
      message: isFixed ? 'Issues successfully resolved' : 'Some issues may still persist', 
      actionsTaken,
      finalDiagnostic: finalDiag
    };
  } catch (err) {
    console.error("🚨 [FK Fix] Critical failure during fix operation:", err);
    return { success: false, error: err.message, actionsTaken };
  }
};