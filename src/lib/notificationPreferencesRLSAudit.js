import { supabase } from '@/lib/customSupabaseClient';

/**
 * Diagnostic utility to verify RLS policies for the notification_preferences table.
 * Tests SELECT, INSERT, and UPDATE operations to ensure the authenticated user 
 * has the correct permissions.
 */
export const auditNotificationPreferencesRLS = async (userId) => {
  console.log(`[RLS_AUDIT] Starting notification_preferences audit for user: ${userId}`);
  
  const results = {
    select: { success: false, error: null },
    insert: { success: false, error: null },
    update: { success: false, error: null },
    overall: false,
    sqlFixRequired: false
  };

  if (!userId) {
    return { ...results, error: 'User ID is required to perform RLS audit.' };
  }

  try {
    // 1. Test SELECT Operation
    const { data: selectData, error: selectError } = await supabase
      .from('notification_preferences')
      .select('id, user_id')
      .eq('user_id', userId)
      .limit(1);

    if (selectError) {
      results.select.error = selectError.message;
      console.error('[RLS_AUDIT] SELECT failed:', selectError.message);
    } else {
      results.select.success = true;
      console.log('[RLS_AUDIT] SELECT succeeded.');
    }

    // 2. Test INSERT/UPDATE Operation via UPSERT
    const { error: upsertError } = await supabase
      .from('notification_preferences')
      .upsert({
         user_id: userId,
         email_enabled: true,
         updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
      results.insert.error = upsertError.message;
      results.update.error = upsertError.message;
      console.error('[RLS_AUDIT] UPSERT (Insert/Update) failed:', upsertError.message);
    } else {
      results.insert.success = true;
      results.update.success = true;
      console.log('[RLS_AUDIT] UPSERT (Insert/Update) succeeded.');
    }

    results.overall = results.select.success && results.insert.success && results.update.success;
    results.sqlFixRequired = !results.overall;

    return results;
  } catch (err) {
    console.error('[RLS_AUDIT] Exception during audit:', err);
    return { ...results, error: err.message, overall: false, sqlFixRequired: true };
  }
};

export const generateNotificationPrefsSQLFix = () => {
  return `-- SQL Fix Script for notification_preferences RLS Policies

-- 1. Enable Row Level Security (just in case it's disabled)
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON notification_preferences;

-- 3. Create strict SELECT policy (User can only read their own data)
CREATE POLICY "Users can view their own preferences"
ON notification_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create strict INSERT policy (User can only create their own data)
CREATE POLICY "Users can insert their own preferences"
ON notification_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Create strict UPDATE policy (User can only update their own data)
CREATE POLICY "Users can update their own preferences"
ON notification_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Create strict DELETE policy (User can only delete their own data)
CREATE POLICY "Users can delete their own preferences"
ON notification_preferences FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
`;
};