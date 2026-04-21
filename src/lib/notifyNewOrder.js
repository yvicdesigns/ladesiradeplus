import { supabase } from '@/lib/customSupabaseClient';

export const notifyAdminsNewOrder = async ({ orderType, customerName, total }) => {
  try {
    const { data: adminTokens } = await supabase
      .from('push_tokens')
      .select('user_id')
      .in('user_id', supabase.from('profiles').select('user_id').in('role', ['admin', 'manager']));

    // Get admin/manager user_ids
    const { data: staffProfiles } = await supabase
      .from('profiles')
      .select('user_id')
      .in('role', ['admin', 'manager']);

    if (!staffProfiles || staffProfiles.length === 0) return;

    const userIds = staffProfiles.map(p => p.user_id);
    const typeLabel = orderType === 'delivery' ? 'Livraison' : orderType === 'dine_in' ? 'Sur place' : 'À emporter';

    await supabase.functions.invoke('send-push-notification', {
      body: {
        title: `Nouvelle commande — ${typeLabel}`,
        body: `${customerName} • ${Number(total).toLocaleString('fr-FR')} FCFA`,
        data: { type: 'new_order' },
        user_ids: userIds,
      },
    });
  } catch (err) {
    console.warn('[Push] Failed to notify admins:', err.message);
  }
};
