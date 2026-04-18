import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Utensils, Truck, CalendarDays, BarChart3, FileText, Database, Trash2, UtensilsCrossed, Grid3x3, Map, Calculator, Users, Star, Package, Send, Calendar, Bell, Settings, ChevronDown, ChevronRight, ChevronLeft, X, LogOut, ShieldCheck, Wrench, ShoppingBag, Store, Briefcase, Activity, FileImage as ImageIcon, FlaskConical, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useUnreadDeliveryOrders } from '@/hooks/useUnreadDeliveryOrders';
import { useRestaurantOrdersCount } from '@/hooks/useRestaurantOrdersCount';
import { useReservationsCount } from '@/hooks/useReservationsCount';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { usePendingReviewsCount } from '@/hooks/usePendingReviewsCount';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { SoundNavLink } from '@/components/SoundNavLink';
import { SoundLink } from '@/components/SoundLink';
import { useLanguage } from '@/contexts/LanguageContext';

const SidebarItem = ({ to, icon: Icon, label, badgeCount = 0, collapsed, onClick, isActiveOverride, badgeClassName, className }) => (
  <SoundNavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg transition-all duration-200 group relative overflow-hidden mb-1 min-h-[44px] md:min-h-[auto]",
        (isActiveOverride !== undefined ? isActiveOverride : isActive)
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-primary/5 hover:text-primary font-medium",
        className
      )
    }
    title={collapsed ? label : undefined}
  >
    <Icon className={cn("h-5 w-5 md:h-4 md:w-4 flex-shrink-0 transition-transform duration-200", collapsed && "mx-auto h-6 w-6 md:h-5 md:w-5")} strokeWidth={2} />
    {!collapsed && <span className="flex-1 text-[14px] md:text-[13px] tracking-tight truncate">{label || 'Lien'}</span>}
    {!collapsed && badgeCount > 0 && (
      <span className={cn(
        "ml-auto flex items-center justify-center animate-in zoom-in h-5 min-w-[1.25rem] px-1.5 rounded-md text-[10px] bg-primary text-primary-foreground font-bold",
        badgeClassName
      )}>
        {badgeCount > 99 ? '99+' : badgeCount}
      </span>
    )}
    {collapsed && badgeCount > 0 && (
      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card animate-pulse" />
    )}
  </SoundNavLink>
);

const SidebarGroup = ({ icon: Icon, label, collapsed, expanded, onToggle, children }) => {
  if (collapsed) {
    return (
      <div className="py-2 border-t border-border/40">
        {children}
      </div>
    );
  }

  return (
    <div className="mb-2">
      <button 
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between w-full px-2 py-3 md:py-2 rounded-lg transition-colors group mb-1 min-h-[44px] md:min-h-[auto]", 
          "text-muted-foreground hover:text-primary hover:bg-primary/5"
        )} 
        title={label}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0 opacity-70 group-hover:opacity-100" strokeWidth={2} />}
          <span className="flex-1 text-[12px] md:text-[11px] font-bold tracking-wider text-left opacity-80 group-hover:opacity-100">{label}</span>
        </div>
        {expanded ? (
          <ChevronDown className="h-5 w-5 md:h-4 md:w-4 opacity-50 transition-transform duration-200" />
        ) : (
          <ChevronRight className="h-5 w-5 md:h-4 md:w-4 opacity-50 transition-transform duration-200" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.2, ease: "easeInOut" }} 
            className="overflow-hidden space-y-0.5 ml-2 border-l border-border/50 pl-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AdminSidebar = ({ className, mobile, onClose }) => {
  const { t } = useLanguage();
  const { signOut, user, role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const canManageStock = isAdmin || isManager; 
  
  const { deliveryUnread } = useUnreadDeliveryOrders();
  const { count: restaurantOrderCount } = useRestaurantOrdersCount();
  const { count: reservationsCount } = useReservationsCount();
  const { unreadCount: notificationsCount } = useAdminNotifications();
  const { count: reviewsCount } = usePendingReviewsCount();
  const { count: messagesCount } = useUnreadMessagesCount();

  const badgePrimaryStyle = ""; 
  const trashBadgeStyle = "bg-destructive/10 text-destructive";
  const isDeliveryActive = location?.pathname?.startsWith('/admin/delivery-orders');
  const deliveryBadgeStyle = cn(isDeliveryActive ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground");
  const isRestaurantActive = location?.pathname?.startsWith('/admin/restaurant-orders');
  const restaurantBadgeStyle = cn(isRestaurantActive ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground");

  const isSettingsRoute = location?.pathname === '/admin/settings';
  
  const [sections, setSections] = useState({
    orders: true,
    analytics: false,
    maintenance: false,
    restaurant: false,
    business: false,
    engagement: false
  });

  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const path = location?.pathname || '';
    
    if (path.includes('/orders') || path.includes('/reservations') || path.includes('/history')) setSections(s => ({ ...s, orders: true }));
    if (path.includes('/analytics') || path.includes('/reports')) setSections(s => ({ ...s, analytics: true }));
    if (['/admin/trash', '/admin/robustness-audit', '/admin/test/order-status'].some(p => path.startsWith(p))) {
      setSections(s => ({ ...s, maintenance: true }));
    }
    if (['/admin/menu', '/admin/tables', '/admin/delivery', '/admin/calculateur-frais', '/admin/settings', '/admin/clients', '/admin/inventory', '/admin/stock-management', '/admin/promo-banner'].some(p => path.startsWith(p)) && !path.includes('delivery-orders')) {
      setSections(s => ({ ...s, restaurant: true }));
    }
    if (['/admin/customers', '/admin/reviews', '/admin/messagerie'].some(p => path.startsWith(p))) {
      setSections(s => ({ ...s, business: true }));
    }
    if (['/admin/calendar', '/admin/notifications'].some(p => path.startsWith(p))) {
      setSections(s => ({ ...s, engagement: true }));
    }
  }, [location?.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleItemClick = () => {
    if (mobile && onClose) onClose();
  };

  const isCollapsed = mobile ? false : collapsed;

  return (
    <div className={cn("flex flex-col h-full bg-card backdrop-blur-xl border-r border-border transition-all duration-300 ease-in-out relative z-50", isCollapsed && !mobile ? "w-20" : "w-full lg:w-64", mobile ? "w-full h-full" : "", className)}>
      
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/50 shrink-0">
        {!isCollapsed && (
          <SoundLink to="/" className="flex items-center gap-3 group">
            <div className="bg-primary/10 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground leading-none">{t('nav.admin', 'Admin')}</span>
            </div>
          </SoundLink>
        )}
        {mobile ? (
          <button onClick={onClose} className="p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-auto flex items-center justify-center"><X size={20} /></button>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)} className={cn("p-2 min-h-[44px] min-w-[44px] rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors flex items-center justify-center hidden lg:flex", isCollapsed ? "mx-auto" : "")}>
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2 custom-scrollbar">

        <SidebarItem to="/admin" icon={LayoutDashboard} label={t('admin.sidebar.overview', 'Vue d\'ensemble')} collapsed={isCollapsed} onClick={handleItemClick} isActiveOverride={location?.pathname === '/admin'} />

        <SidebarGroup icon={ShoppingBag} label={t('admin.sidebar.orders_group', 'Commandes')} collapsed={isCollapsed} expanded={sections.orders} onToggle={() => toggleSection('orders')}>
          <SidebarItem to="/admin/history" icon={History} label={t('admin.sidebar.history', 'Historique')} collapsed={isCollapsed} onClick={handleItemClick} />
          <SidebarItem to="/admin/restaurant-orders" icon={Utensils} label={t('admin.sidebar.restaurant_orders', 'Commandes Salle')} badgeCount={restaurantOrderCount || 0} badgeClassName={restaurantBadgeStyle} collapsed={isCollapsed} onClick={handleItemClick} />
          <SidebarItem to="/admin/delivery-orders" icon={Truck} label={t('admin.sidebar.delivery_orders', 'Commandes Livraison')} badgeCount={deliveryUnread || 0} badgeClassName={deliveryBadgeStyle} collapsed={isCollapsed} onClick={handleItemClick} />
          <SidebarItem to="/admin/reservations" icon={CalendarDays} label={t('admin.sidebar.reservations', 'Réservations')} badgeCount={reservationsCount || 0} badgeClassName={badgePrimaryStyle} collapsed={isCollapsed} onClick={handleItemClick} />
        </SidebarGroup>

        <SidebarGroup icon={Store} label={t('admin.sidebar.restaurant_mgmt', 'Gestion Restaurant')} collapsed={isCollapsed} expanded={sections.restaurant} onToggle={() => toggleSection('restaurant')}>
          <SidebarItem to="/admin/clients" icon={Users} label={t('admin.sidebar.customers', 'Clients CRM')} collapsed={isCollapsed} onClick={handleItemClick} />
          {canManageStock && <SidebarItem to="/admin/inventory" icon={Package} label={t('admin.sidebar.inventory', 'Inventaire')} collapsed={isCollapsed} onClick={handleItemClick} />}
          <SidebarItem to="/admin/menu" icon={UtensilsCrossed} label={t('admin.sidebar.menu', 'Menu')} collapsed={isCollapsed} onClick={handleItemClick} />
          <SidebarItem to="/admin/promo-banner" icon={ImageIcon} label={t('admin.sidebar.promotions', 'Bannières Promo')} collapsed={isCollapsed} onClick={handleItemClick} />
          <SidebarItem to="/admin/tables" icon={Grid3x3} label={t('admin.sidebar.tables', 'Tables')} collapsed={isCollapsed} onClick={handleItemClick} />
          <SidebarItem to="/admin/delivery" icon={Map} label={t('admin.sidebar.delivery_zones', 'Zones Livraison')} collapsed={isCollapsed} onClick={handleItemClick} />
          <SidebarItem to="/admin/calculateur-frais" icon={Calculator} label={t('admin.sidebar.calculator', 'Calculateur')} collapsed={isCollapsed} onClick={handleItemClick} />
        </SidebarGroup>

        <SidebarGroup icon={Briefcase} label={t('admin.sidebar.business', 'Affaires')} collapsed={isCollapsed} expanded={sections.business} onToggle={() => toggleSection('business')}>
          <SidebarItem to="/admin/reviews" icon={Star} label={t('admin.sidebar.reviews', 'Avis')} badgeCount={reviewsCount || 0} badgeClassName={badgePrimaryStyle} collapsed={isCollapsed} onClick={handleItemClick} />
          {isAdmin && <SidebarItem to="/admin/messagerie" icon={MessageSquare} label={t('admin.sidebar.messaging', 'Messagerie')} badgeCount={messagesCount || 0} badgeClassName={badgePrimaryStyle} collapsed={isCollapsed} onClick={handleItemClick} />}
        </SidebarGroup>

        <SidebarGroup icon={BarChart3} label={t('admin.sidebar.analytics_group', 'Analytiques')} collapsed={isCollapsed} expanded={sections.analytics} onToggle={() => toggleSection('analytics')}>
          <SidebarItem to="/admin/analytics" icon={BarChart3} label={t('admin.sidebar.analytics', 'Analytiques')} collapsed={isCollapsed} onClick={handleItemClick} />
          <SidebarItem to="/admin/reports" icon={FileText} label={t('admin.sidebar.reports', 'Rapports')} collapsed={isCollapsed} onClick={handleItemClick} />
        </SidebarGroup>

        <SidebarGroup icon={Calendar} label={t('admin.sidebar.engagement', 'Engagement')} collapsed={isCollapsed} expanded={sections.engagement} onToggle={() => toggleSection('engagement')}>
          <SidebarItem to="/admin/calendar" icon={Calendar} label={t('admin.sidebar.calendar', 'Calendrier')} collapsed={isCollapsed} onClick={handleItemClick} />
          <SidebarItem to="/admin/notifications" icon={Bell} label={t('admin.sidebar.notifications', 'Notifications')} badgeCount={notificationsCount || 0} badgeClassName={badgePrimaryStyle} collapsed={isCollapsed} onClick={handleItemClick} />
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup icon={Wrench} label={t('admin.sidebar.maintenance', 'Maintenance')} collapsed={isCollapsed} expanded={sections.maintenance} onToggle={() => toggleSection('maintenance')}>
            <SidebarItem to="/admin/robustness-audit" icon={Activity} label={t('admin.sidebar.robustness_audit', 'Audit de Robustesse')} collapsed={isCollapsed} onClick={handleItemClick} className="font-bold text-primary" />
            <SidebarItem to="/admin/test/order-status" icon={FlaskConical} label="Testeur Statuts" collapsed={isCollapsed} onClick={handleItemClick} className="text-indigo-600" />
            <SidebarItem to="/admin/trash" icon={Trash2} label={t('admin.sidebar.trash', 'Corbeille')} badgeCount={0} badgeClassName={trashBadgeStyle} collapsed={isCollapsed} onClick={handleItemClick} />
          </SidebarGroup>
        )}

      </nav>

      <div className="p-3 border-t border-border bg-muted/20 shrink-0 space-y-2">
        {isAdmin && (
           <SidebarItem 
             to="/admin/settings" 
             icon={Settings} 
             label={t('admin.sidebar.settings', 'Paramètres')} 
             collapsed={isCollapsed} 
             onClick={handleItemClick} 
             className="w-full bg-card border border-border hover:border-primary/50"
             isActiveOverride={isSettingsRoute}
           />
        )}
        
        <div className={cn("flex items-center gap-3 p-2 min-h-[44px] rounded-lg hover:bg-card hover:shadow-sm transition-all duration-200 cursor-pointer group border border-transparent hover:border-border", isCollapsed ? "justify-center" : "")}>
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{t('admin.sidebar.profile', 'Profil')}</p>
            </div>
          )}
          {!isCollapsed && (
            <button onClick={signOut} className="p-2 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all flex items-center justify-center" title={t('admin.topbar.logout', 'Déconnexion')}>
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;