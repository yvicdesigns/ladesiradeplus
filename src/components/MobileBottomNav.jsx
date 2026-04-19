import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Utensils, ShoppingCart, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useSound } from '@/hooks/useSound';
import { useTranslation } from 'react-i18next';

export const MobileBottomNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount } = useCart();
  const { playSound } = useSound();
  const cartItemCount = getItemCount();

  // Hide on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { icon: Home, label: t('nav.home') || 'Accueil', path: '/' },
    { icon: Utensils, label: t('nav.menu') || 'Menu', path: '/menu' },
    { icon: ShoppingCart, label: t('nav.cart') || 'Panier', path: '/cart', showBadge: true },
    { icon: Package, label: t('nav.orders') || 'Commandes', path: '/orders' },
    { icon: User, label: t('nav.profile') || 'Profil', path: '/profile' },
  ];

  const handleNavClick = (path) => {
    if (location.pathname !== path) {
      playSound('click');
      navigate(path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-white border-t border-gray-200 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 px-2 pb-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 relative",
                isActive 
                  ? "text-[#D97706]" 
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div className="relative mt-1">
                <item.icon className={cn("w-6 h-6 transition-transform", isActive && "fill-current/20 scale-110")} />
                {item.showBadge && cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#D97706] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] tracking-wide", isActive ? "font-bold" : "font-medium")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};