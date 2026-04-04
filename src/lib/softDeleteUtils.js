import { supabase } from '@/lib/customSupabaseClient';
import { AUDIT_ACTIONS } from '@/constants/AUDIT_ACTIONS';

export const TABLES_WITH_IS_DELETED = [
  'tables', 'menu_items', 'menu_categories', 'delivery_zones', 'customers', 
  'feedback', 'delivery_tracking', 'orders', 'restaurant_orders', 'delivery_orders', 
  'order_items', 'deliveries', 'refunds', 'email_campaigns', 'payments', 
  'email_templates', 'payment_methods', 'reviews', 'admin_settings', 'admin_users', 
  'reservations', 'ingredients', 'surveys', 'survey_questions', 'survey_responses', 
  'survey_answers', 'feedback_categories', 'customer_feedback', 'notification_preferences', 
  'notifications', 'system_alerts', 'alert_history', 'mobile_app_versions', 
  'mobile_devices', 'feature_flags', 'item_stock_movements', 'special_offers', 
  'promotion_rules', 'reports', 'banners', 'promotion_usage', 'email_subscribers', 
  'campaign_analytics', 'suppliers', 'purchase_orders', 'purchase_order_items', 
  'stock_movements', 'stock_alerts', 'calendar_events', 'business_hours', 
  'sound_settings', 'activity_logs', 'notification_templates', 'push_campaigns', 
  'mobile_analytics', 'promo_codes', 'special_hours', 'closures', 'holidays', 
  'event_attendees', 'event_reminders', 'promo_banners', 'user_notifications', 
  'promo_images', 'admin_config'
];

export const applyIsDeletedFilter = (query, includeDeleted = false, tableName = null) => {
  if (tableName && !TABLES_WITH_IS_DELETED.includes(tableName)) {
    return query; 
  }
  
  if (includeDeleted) {
    return query.eq('is_deleted', true);
  }
  return query.not('is_deleted', 'eq', true);
};

export const getActive = (query, tableName = null) => {
  if (tableName && !TABLES_WITH_IS_DELETED.includes(tableName)) {
    return query; 
  }
  return query.not('is_deleted', 'eq', true);
};

export const withSoftDeleteFilter = (tableName) => {
  const query = supabase.from(tableName).select('*');
  return getActive(query, tableName);
};

export const getActiveRecords = (tableName, filters = {}) => {
  let query = withSoftDeleteFilter(tableName);
  
  if (filters && typeof filters === 'object') {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });
  }
  return query;
};

export const getDeletedRecords = (tableName, filters = {}) => {
  let query = supabase.from(tableName).select('*');
  
  if (TABLES_WITH_IS_DELETED.includes(tableName)) {
    query = query.eq('is_deleted', true);
  } else {
    query = query.limit(0); 
  }
  
  if (filters && typeof filters === 'object') {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });
  }
  return query;
};

export const softDeleteWithAudit = async (tableName, recordId, reason = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.rpc('delete_record_with_audit', {
      table_name: tableName,
      record_id: recordId,
      user_id: user?.id,
      reason: reason
    });
    
    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || 'Failed to soft delete');
    
    return { success: true, data };
  } catch (error) {
    console.error(`[SoftDelete] Failed for ${tableName}:${recordId}`, error);
    return { success: false, error: error.message };
  }
};

export const restoreWithAudit = async (tableName, recordId, reason = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.rpc('restore_record_with_audit', {
      table_name: tableName,
      record_id: recordId,
      user_id: user?.id,
      reason: reason
    });
    
    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || 'Failed to restore');
    
    return { success: true, data };
  } catch (error) {
    console.error(`[Restore] Failed for ${tableName}:${recordId}`, error);
    return { success: false, error: error.message };
  }
};