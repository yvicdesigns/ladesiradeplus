-- RLS Policies for ladesiradeplus
-- Generated: 2026-03-25
-- Roles: admin, manager, staff, kitchen, delivery, customer

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT role FROM public.admin_users WHERE user_id = auth.uid() AND is_deleted = false LIMIT 1),
    (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    'customer'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT get_my_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT get_my_role() IN ('admin', 'manager');
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_above()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT get_my_role() IN ('admin', 'manager', 'staff', 'kitchen', 'delivery');
$$;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC TABLES (readable by anyone, even unauthenticated)
-- ============================================================

-- menu_categories
CREATE POLICY "Public read menu_categories" ON public.menu_categories FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);
CREATE POLICY "Admin manage menu_categories" ON public.menu_categories FOR ALL USING (is_admin_or_manager());

-- menu_items
CREATE POLICY "Public read menu_items" ON public.menu_items FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);
CREATE POLICY "Admin manage menu_items" ON public.menu_items FOR ALL USING (is_admin_or_manager());

-- banners
CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);
CREATE POLICY "Admin manage banners" ON public.banners FOR ALL USING (is_admin_or_manager());

-- promo_banners
CREATE POLICY "Public read promo_banners" ON public.promo_banners FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);
CREATE POLICY "Admin manage promo_banners" ON public.promo_banners FOR ALL USING (is_admin_or_manager());

-- promo_images
CREATE POLICY "Public read promo_images" ON public.promo_images FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);
CREATE POLICY "Admin manage promo_images" ON public.promo_images FOR ALL USING (is_admin_or_manager());

-- promotions
CREATE POLICY "Public read promotions" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Admin manage promotions" ON public.promotions FOR ALL USING (is_admin_or_manager());

-- promo_codes
CREATE POLICY "Authenticated read promo_codes" ON public.promo_codes FOR SELECT USING (auth.uid() IS NOT NULL AND (is_deleted = false OR is_deleted IS NULL));
CREATE POLICY "Admin manage promo_codes" ON public.promo_codes FOR ALL USING (is_admin_or_manager());

-- restaurants
CREATE POLICY "Public read restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Admin manage restaurants" ON public.restaurants FOR ALL USING (is_admin());

-- delivery_zones
CREATE POLICY "Public read delivery_zones" ON public.delivery_zones FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);
CREATE POLICY "Admin manage delivery_zones" ON public.delivery_zones FOR ALL USING (is_admin_or_manager());

-- business_hours
CREATE POLICY "Public read business_hours" ON public.business_hours FOR SELECT USING (true);
CREATE POLICY "Admin manage business_hours" ON public.business_hours FOR ALL USING (is_admin_or_manager());

-- special_hours
CREATE POLICY "Public read special_hours" ON public.special_hours FOR SELECT USING (true);
CREATE POLICY "Admin manage special_hours" ON public.special_hours FOR ALL USING (is_admin_or_manager());

-- closures
CREATE POLICY "Public read closures" ON public.closures FOR SELECT USING (true);
CREATE POLICY "Admin manage closures" ON public.closures FOR ALL USING (is_admin_or_manager());

-- holidays
CREATE POLICY "Public read holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Admin manage holidays" ON public.holidays FOR ALL USING (is_admin_or_manager());

-- payment_methods
CREATE POLICY "Public read payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Admin manage payment_methods" ON public.payment_methods FOR ALL USING (is_admin());

-- special_offers
CREATE POLICY "Public read special_offers" ON public.special_offers FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);
CREATE POLICY "Admin manage special_offers" ON public.special_offers FOR ALL USING (is_admin_or_manager());

-- feedback_categories
CREATE POLICY "Public read feedback_categories" ON public.feedback_categories FOR SELECT USING (true);
CREATE POLICY "Admin manage feedback_categories" ON public.feedback_categories FOR ALL USING (is_admin());

-- tables (restaurant tables/seating)
CREATE POLICY "Public read tables" ON public.tables FOR SELECT USING (is_deleted = false OR is_deleted IS NULL);
CREATE POLICY "Admin manage tables" ON public.tables FOR ALL USING (is_admin_or_manager());

-- mobile_app_versions
CREATE POLICY "Public read app versions" ON public.mobile_app_versions FOR SELECT USING (true);
CREATE POLICY "Admin manage app versions" ON public.mobile_app_versions FOR ALL USING (is_admin());

-- ============================================================
-- PROFILES
-- ============================================================

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin delete profiles" ON public.profiles FOR DELETE USING (is_admin());

-- ============================================================
-- ORDERS & ORDER ITEMS
-- ============================================================

CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT USING (user_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Customers create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE USING (user_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE USING (is_admin_or_manager());

CREATE POLICY "Customers read own order_items" ON public.order_items FOR SELECT USING (
  is_staff_or_above() OR
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Customers create order_items" ON public.order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff update order_items" ON public.order_items FOR UPDATE USING (is_staff_or_above());
CREATE POLICY "Admin delete order_items" ON public.order_items FOR DELETE USING (is_admin_or_manager());

-- ============================================================
-- RESERVATIONS
-- ============================================================

CREATE POLICY "Customers read own reservations" ON public.reservations FOR SELECT USING (user_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Customers create reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff update reservations" ON public.reservations FOR UPDATE USING (user_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Admin delete reservations" ON public.reservations FOR DELETE USING (is_admin_or_manager());

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE POLICY "Customers read own record" ON public.customers FOR SELECT USING (user_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Customers insert own record" ON public.customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Customers update own record" ON public.customers FOR UPDATE USING (user_id = auth.uid() OR is_admin_or_manager());
CREATE POLICY "Admin delete customers" ON public.customers FOR DELETE USING (is_admin_or_manager());

-- ============================================================
-- DELIVERY ORDERS & TRACKING
-- ============================================================

CREATE POLICY "Customers read own delivery_orders" ON public.delivery_orders FOR SELECT USING (customer_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Customers create delivery_orders" ON public.delivery_orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Staff update delivery_orders" ON public.delivery_orders FOR UPDATE USING (customer_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Admin delete delivery_orders" ON public.delivery_orders FOR DELETE USING (is_admin_or_manager());

CREATE POLICY "Customers read own delivery_tracking" ON public.delivery_tracking FOR SELECT USING (
  is_staff_or_above() OR
  EXISTS (SELECT 1 FROM public.delivery_orders WHERE delivery_orders.id = delivery_tracking.delivery_id AND delivery_orders.customer_id = auth.uid())
);
CREATE POLICY "Staff manage delivery_tracking" ON public.delivery_tracking FOR ALL USING (is_staff_or_above());

-- ============================================================
-- PAYMENTS, INVOICES, REFUNDS
-- ============================================================

CREATE POLICY "Customers read own payments" ON public.payments FOR SELECT USING (customer_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Customers create payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage payments" ON public.payments FOR UPDATE USING (is_admin_or_manager());
CREATE POLICY "Admin delete payments" ON public.payments FOR DELETE USING (is_admin());

CREATE POLICY "Customers read own invoices" ON public.invoices FOR SELECT USING (customer_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Staff manage invoices" ON public.invoices FOR ALL USING (is_staff_or_above());

CREATE POLICY "Customers read own refunds" ON public.refunds FOR SELECT USING (customer_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Admin manage refunds" ON public.refunds FOR ALL USING (is_admin_or_manager());

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (status = 'approved' OR is_staff_or_above() OR user_id = auth.uid());
CREATE POLICY "Authenticated create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (user_id = auth.uid() OR is_admin_or_manager());
CREATE POLICY "Admin delete reviews" ON public.reviews FOR DELETE USING (is_admin_or_manager());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Admin create notifications" ON public.notifications FOR INSERT WITH CHECK (is_staff_or_above());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Admin delete notifications" ON public.notifications FOR DELETE USING (is_admin());

CREATE POLICY "Users read own user_notifications" ON public.user_notifications FOR SELECT USING (client_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Staff create user_notifications" ON public.user_notifications FOR INSERT WITH CHECK (is_staff_or_above());
CREATE POLICY "Admin manage user_notifications" ON public.user_notifications FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Users manage own notification_preferences" ON public.notification_preferences FOR ALL USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- FEEDBACK
-- ============================================================

CREATE POLICY "Authenticated create feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users read own feedback" ON public.feedback FOR SELECT USING (user_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Admin manage feedback" ON public.feedback FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Authenticated create customer_feedback" ON public.customer_feedback FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users read own customer_feedback" ON public.customer_feedback FOR SELECT USING (customer_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Admin manage customer_feedback" ON public.customer_feedback FOR ALL USING (is_admin_or_manager());

-- ============================================================
-- ADMIN SETTINGS & CONFIG
-- ============================================================

CREATE POLICY "Staff read admin_settings" ON public.admin_settings FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage admin_settings" ON public.admin_settings FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Admin manage admin_config" ON public.admin_config FOR ALL USING (is_admin());

CREATE POLICY "Staff read admin_users" ON public.admin_users FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage admin_users" ON public.admin_users FOR ALL USING (is_admin());

CREATE POLICY "Staff read sound_settings" ON public.sound_settings FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage sound_settings" ON public.sound_settings FOR ALL USING (is_admin_or_manager());

-- ============================================================
-- STOCK & INVENTORY
-- ============================================================

CREATE POLICY "Staff read ingredients" ON public.ingredients FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage ingredients" ON public.ingredients FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Staff read stock_movements" ON public.stock_movements FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage stock_movements" ON public.stock_movements FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Staff read stock_alerts" ON public.stock_alerts FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage stock_alerts" ON public.stock_alerts FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Staff read item_stock_movements" ON public.item_stock_movements FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage item_stock_movements" ON public.item_stock_movements FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Staff read suppliers" ON public.suppliers FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage suppliers" ON public.suppliers FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Staff read purchase_orders" ON public.purchase_orders FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage purchase_orders" ON public.purchase_orders FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Staff read purchase_order_items" ON public.purchase_order_items FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage purchase_order_items" ON public.purchase_order_items FOR ALL USING (is_admin_or_manager());

-- ============================================================
-- DELIVERIES
-- ============================================================

CREATE POLICY "Staff manage deliveries" ON public.deliveries FOR ALL USING (is_staff_or_above());

CREATE POLICY "Staff manage restaurant_orders" ON public.restaurant_orders FOR ALL USING (is_staff_or_above());

-- ============================================================
-- LOGS & AUDIT
-- ============================================================

CREATE POLICY "Admin read activity_logs" ON public.activity_logs FOR SELECT USING (is_admin_or_manager());
CREATE POLICY "Authenticated insert activity_logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin read audit_logs" ON public.audit_logs FOR SELECT USING (is_admin_or_manager());
CREATE POLICY "System insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin read email_logs" ON public.email_logs FOR SELECT USING (is_admin());
CREATE POLICY "System insert email_logs" ON public.email_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- EMAIL & CAMPAIGNS
-- ============================================================

CREATE POLICY "Admin manage email_campaigns" ON public.email_campaigns FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage email_templates" ON public.email_templates FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage notification_templates" ON public.notification_templates FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage push_campaigns" ON public.push_campaigns FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage campaign_analytics" ON public.campaign_analytics FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Users manage own email_subscribers" ON public.email_subscribers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin read all email_subscribers" ON public.email_subscribers FOR SELECT USING (is_admin_or_manager());

-- ============================================================
-- SURVEYS
-- ============================================================

CREATE POLICY "Authenticated read surveys" ON public.surveys FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage surveys" ON public.surveys FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Authenticated read survey_questions" ON public.survey_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage survey_questions" ON public.survey_questions FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Users manage own survey_responses" ON public.survey_responses FOR ALL USING (customer_id = auth.uid() OR is_admin_or_manager());

CREATE POLICY "Users manage own survey_answers" ON public.survey_answers FOR ALL USING (
  is_admin_or_manager() OR
  EXISTS (SELECT 1 FROM public.survey_responses WHERE survey_responses.id = survey_answers.response_id AND survey_responses.customer_id = auth.uid())
);

-- ============================================================
-- ANALYTICS & REPORTS
-- ============================================================

CREATE POLICY "Admin manage analytics_cache" ON public.analytics_cache FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage mobile_analytics" ON public.mobile_analytics FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage reports" ON public.reports FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage system_alerts" ON public.system_alerts FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage alert_history" ON public.alert_history FOR ALL USING (is_admin_or_manager());

-- ============================================================
-- CALENDAR & EVENTS
-- ============================================================

CREATE POLICY "Staff read calendar_events" ON public.calendar_events FOR SELECT USING (is_staff_or_above());
CREATE POLICY "Admin manage calendar_events" ON public.calendar_events FOR ALL USING (is_admin_or_manager());

CREATE POLICY "Admin manage event_attendees" ON public.event_attendees FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage event_reminders" ON public.event_reminders FOR ALL USING (is_admin_or_manager());

-- ============================================================
-- MOBILE DEVICES
-- ============================================================

CREATE POLICY "Users manage own mobile_devices" ON public.mobile_devices FOR ALL USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- CUSTOMER ORDER/RESERVATION VIEWS
-- ============================================================

CREATE POLICY "Customers read own customer_orders" ON public.customer_orders FOR SELECT USING (customer_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Staff manage customer_orders" ON public.customer_orders FOR ALL USING (is_staff_or_above());

CREATE POLICY "Customers read own customer_reservations" ON public.customer_reservations FOR SELECT USING (customer_id = auth.uid() OR is_staff_or_above());
CREATE POLICY "Staff manage customer_reservations" ON public.customer_reservations FOR ALL USING (is_staff_or_above());

-- ============================================================
-- PROMOTIONS USAGE & RULES
-- ============================================================

CREATE POLICY "Admin manage promotion_rules" ON public.promotion_rules FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Admin manage promotion_usage" ON public.promotion_usage FOR ALL USING (is_admin_or_manager());
CREATE POLICY "Authenticated read promotion_usage own" ON public.promotion_usage FOR SELECT USING (customer_id = auth.uid() OR is_admin_or_manager());

-- ============================================================
-- STAFF ACCOUNTS
-- ============================================================

CREATE POLICY "Admin manage staff_accounts" ON public.staff_accounts FOR ALL USING (is_admin());
CREATE POLICY "Staff read own account" ON public.staff_accounts FOR SELECT USING (user_id = auth.uid() OR is_admin_or_manager());

-- ============================================================
-- FEATURE FLAGS
-- ============================================================

CREATE POLICY "Authenticated read feature_flags" ON public.feature_flags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage feature_flags" ON public.feature_flags FOR ALL USING (is_admin());
