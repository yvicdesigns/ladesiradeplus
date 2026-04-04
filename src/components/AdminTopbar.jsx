import React from 'react';
import { Search, Bell, User, Menu, Truck, Volume2, VolumeX, Store, Lock } from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useUnreadDeliveryOrders } from '@/hooks/useUnreadDeliveryOrders'; 
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { SoundButtonWrapper as Button } from '@/components/SoundButtonWrapper';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useNewOrderNotificationBadge } from '@/hooks/useNewOrderNotificationBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const AdminTopbar = ({ onMenuClick }) => {
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead } = useAdminNotifications();
  const { deliveryUnread } = useUnreadDeliveryOrders(); 
  const { signOut, user } = useAuth();
  const { activeRestaurantName, restaurantId } = useRestaurant();
  const navigate = useNavigate();
  
  const { badgeCount } = useNewOrderNotificationBadge({ showToast: true });
  
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useLocalStorage('voiceAlertsEnabled', true);

  const toggleVoiceAlerts = () => {
    setVoiceAlertsEnabled(!voiceAlertsEnabled);
  };

  return (
    <header className="h-16 bg-card/90 backdrop-blur-md border-b border-border px-3 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
      
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 min-h-[44px] min-w-[44px] text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors flex items-center justify-center"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div 
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-sm font-bold text-primary cursor-default select-none shadow-sm"
          title={`${t('admin.topbar.isolated_env')} ID: ${restaurantId || '...'}`}
        >
          <Store className="w-4 h-4" />
          <span>{activeRestaurantName || t('admin.topbar.loading')}</span>
          <Lock className="w-3.5 h-3.5 ml-1 opacity-70" />
        </div>

        <div className="relative group w-full max-w-xs md:max-w-md hidden lg:block ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            type="text" 
            placeholder={t('admin.topbar.search_placeholder')}
            className="w-full pl-9 h-11 bg-muted/50 border-transparent focus:bg-background focus:border-primary/30 focus:ring-2 focus:ring-primary/20 rounded-lg text-sm transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 ml-auto">
        
        <LanguageSwitcher className="hidden lg:flex mr-1" />
        
        {badgeCount > 0 && (
            <div className="hidden lg:flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => navigate('/admin/delivery-orders')}>
               <span>{badgeCount} {t('admin.topbar.new_orders')}</span>
            </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={`relative rounded-lg hover:bg-primary/10 transition-colors h-11 w-11 ${voiceAlertsEnabled ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={toggleVoiceAlerts}
          title={voiceAlertsEnabled ? t('admin.topbar.voice_alerts_off') : t('admin.topbar.voice_alerts_on')}
        >
          {voiceAlertsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-lg hover:bg-primary/10 hover:text-primary transition-colors h-11 w-11"
          onClick={() => navigate('/admin/delivery-orders')}
          title={t('admin.topbar.unread_delivery')}
        >
          <Truck className="h-5 w-5" />
          {deliveryUnread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full ring-2 ring-card bg-primary text-primary-foreground shadow-sm">
              {deliveryUnread > 9 ? '9+' : deliveryUnread}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-primary/10 hover:text-primary transition-colors h-11 w-11">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full ring-2 ring-card animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-lg border-border p-2 bg-card">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 mb-2">
              <span className="text-sm font-semibold text-foreground">{t('admin.topbar.notifications_title')}</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-2 font-bold bg-primary/10 text-primary">{unreadCount} {t('admin.topbar.new_orders')}</Badge>
              )}
            </div>
            <div className="max-h-[320px] overflow-y-auto p-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-3 text-muted-foreground">
                  <Bell className="h-8 w-8 opacity-20" />
                  <span className="text-sm">{t('admin.topbar.no_notifications')}</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <DropdownMenuItem 
                    key={notif.id} 
                    className="p-3 mb-1 rounded-lg cursor-pointer flex flex-col items-start gap-1.5 focus:bg-muted group transition-colors min-h-[44px]"
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm ${!notif.read ? 'font-semibold text-primary' : 'text-foreground'}`}>
                        {notif.title}
                      </span>
                      <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notif.message}</p>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-border hidden sm:block mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="px-2 md:pl-2 md:pr-3 h-11 rounded-lg gap-2 hover:bg-primary/5 hover:text-primary transition-all">
              <div className="h-7 w-7 bg-primary/20 rounded-md text-primary flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold hidden md:block">
                {user?.email?.split('@')[0]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border p-2 bg-card">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">{t('admin.topbar.my_account')}</DropdownMenuLabel>
            
            <div className="md:hidden px-3 py-2 mb-1 bg-muted/30 rounded-md mx-1">
               <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground mb-1">
                 <Lock className="w-3 h-3" />
                 <span>{t('admin.topbar.isolated_env')}</span>
               </div>
               <div className="text-sm font-bold text-primary truncate" title={activeRestaurantName}>
                 {activeRestaurantName || t('admin.topbar.loading')}
               </div>
            </div>
            <DropdownMenuSeparator className="bg-border my-2 md:hidden" />

            <DropdownMenuItem className="text-sm rounded-lg cursor-pointer p-3 min-h-[44px] focus:bg-primary/5 focus:text-primary transition-colors" onClick={() => navigate('/admin/settings')}>
              {t('admin.topbar.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm rounded-lg cursor-pointer p-3 min-h-[44px] focus:bg-primary/5 focus:text-primary transition-colors" onClick={() => navigate('/admin/settings')}>
              {t('admin.topbar.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border my-2" />
            <DropdownMenuItem 
              className="text-sm rounded-lg cursor-pointer p-3 min-h-[44px] text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors" 
              onClick={signOut}
            >
              {t('admin.topbar.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};