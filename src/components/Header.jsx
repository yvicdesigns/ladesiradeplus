import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Search, Menu as MenuIcon, X, Home, Utensils, User, Settings, Package, LogOut, Bell, Calendar, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useCart } from '@/contexts/CartContext';
import { SoundButtonWrapper } from '@/components/SoundButtonWrapper';
import { SoundLink } from '@/components/SoundLink';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useRestaurant } from '@/contexts/RestaurantContext';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount } = useCart();
  const { user, signOut } = useAuth();
  useLanguage();
  const { toast } = useToast();
  const { settings, activeRestaurantName } = useRestaurant();
  const cartItemCount = getItemCount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    const fetch = async () => {
      const { count } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .or(`client_id.eq.${user.id},client_email.eq.${user.email}`)
        .eq('status', 'unread')
        .or('is_deleted.eq.false,is_deleted.is.null');
      setUnreadCount(count || 0);
    };
    fetch();
    const channel = supabase.channel('header_notifs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications' }, fetch)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isHome = location.pathname === '/';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isActive = (path) => location.pathname === path;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/menu': return 'Menu';
      case '/cart': return 'Panier';
      case '/checkout': return 'Caisse';
      case '/orders': return 'Commandes';
      case '/reservations': return 'Réservations';
      case '/search': return 'Recherche';
      case '/profile': return 'Profil';
      case '/settings': return 'Paramètres';
      default: return activeRestaurantName || "Key's Food";
    }
  };

  const navLinks = [
    { to: '/', label: 'Accueil', icon: Home },
    { to: '/menu', label: 'Menu', icon: Utensils },
    { to: '/reservations', label: 'Réservations', icon: Calendar },
    { to: '/orders', label: 'Commandes', icon: Package },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Déconnexion", description: "À bientôt !" });
      setIsMobileMenuOpen(false);
      setIsUserMenuOpen(false);
      navigate('/login');
    } catch (error) { console.error(error); }
  };

  if (isAdminRoute) return null;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white border-b border-gray-100"
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4 md:gap-8">

        {/* ── BRAND ── */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-9 w-9 rounded-full object-cover border border-gray-100" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-[#D97706] flex items-center justify-center flex-shrink-0">
              <Utensils className="h-4 w-4 text-white" />
            </div>
          )}
          {!isHome && (
            <span className="font-extrabold text-[#111827] text-lg tracking-tight group-hover:text-[#D97706] transition-colors hidden sm:block">
              {activeRestaurantName || "Key's Food"}
            </span>
          )}
        </Link>

        {/* ── DESKTOP NAV ── */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isActive(to)
                  ? 'bg-amber-50 text-[#D97706]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── DESKTOP SEARCH BAR ── */}
        <div className="hidden md:flex flex-1 max-w-md">
          <button
            onClick={() => navigate('/search')}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-400 transition-all"
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            <span>Rechercher un plat...</span>
          </button>
        </div>

        {/* ── MOBILE: back + title ── */}
        <div className="flex md:hidden items-center gap-2 flex-1 min-w-0">
          {!isHome && (
            <SoundButtonWrapper
              variant="ghost" size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-amber-50 text-[#111827] -ml-2 flex-shrink-0"
              soundType="click"
            >
              <ArrowLeft className="h-5 w-5" />
            </SoundButtonWrapper>
          )}
          <span className="text-base font-bold text-[#111827] truncate">{getPageTitle()}</span>
        </div>

        {/* ── RIGHT ACTIONS ── */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto md:ml-0">

          {/* Mobile search */}
          <SoundButtonWrapper
            variant="ghost" size="icon"
            onClick={() => navigate('/search')}
            className="md:hidden text-gray-500 hover:text-[#D97706] hover:bg-amber-50 rounded-xl"
          >
            <Search className="h-5 w-5" />
          </SoundButtonWrapper>

          {/* Language */}
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          {/* Bell */}
          {user && (
            <button
              onClick={() => navigate('/profile')}
              className="relative p-2 text-gray-500 hover:text-[#D97706] hover:bg-amber-50 rounded-xl transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-[#D97706] text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Cart */}
          {location.pathname !== '/cart' && location.pathname !== '/checkout' && (
            <SoundLink to="/cart">
              <button className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                cartItemCount > 0
                  ? 'bg-[#D97706] text-white shadow-md shadow-amber-200 hover:bg-[#B45309]'
                  : 'text-gray-500 hover:text-[#D97706] hover:bg-amber-50'
              }`}>
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && <span className="text-xs font-extrabold">{cartItemCount}</span>}
              </button>
            </SoundLink>
          )}

          {/* User dropdown (desktop) */}
          {user ? (
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all"
              >
                <Avatar className="h-7 w-7 border border-gray-200">
                  <AvatarImage src={user.photo_url} />
                  <AvatarFallback className="bg-amber-100 text-[#D97706] text-xs font-bold">
                    {user.email?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-gray-700 hidden lg:block max-w-[100px] truncate">
                  {user.email?.split('@')[0]}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-xs text-gray-400 font-medium">Connecté en tant que</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-[#D97706] transition-colors font-medium">
                        <User className="h-4 w-4" /> Mon Profil
                      </Link>
                      <Link to="/orders" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-[#D97706] transition-colors font-medium">
                        <Package className="h-4 w-4" /> Mes Commandes
                      </Link>
                      <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-[#D97706] transition-colors font-medium">
                        <Settings className="h-4 w-4" /> Paramètres
                      </Link>
                    </div>
                    <div className="border-t border-gray-50 py-1">
                      <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
                        <LogOut className="h-4 w-4" /> Déconnexion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              <User className="h-4 w-4" /> Connexion
            </Link>
          )}

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors ml-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── MOBILE BACKDROP ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 top-16 bg-black/40 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 w-full bg-white shadow-2xl border-b border-gray-100 z-50 md:hidden"
          >
            <nav className="flex flex-col py-2">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-6 py-4 font-bold text-[15px] border-b border-gray-50 flex items-center gap-4 transition-colors ${
                    isActive(to) ? 'text-[#D97706] bg-amber-50/50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 opacity-70" /> {label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={`px-6 py-4 font-bold text-[15px] border-b border-gray-50 flex items-center gap-4 transition-colors ${isActive('/profile') ? 'text-[#D97706] bg-amber-50/50' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <User className="w-5 h-5 opacity-70" /> Mon Profil
                  </Link>
                  <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className={`px-6 py-4 font-bold text-[15px] border-b border-gray-50 flex items-center gap-4 transition-colors ${isActive('/settings') ? 'text-[#D97706] bg-amber-50/50' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <Settings className="w-5 h-5 opacity-70" /> Paramètres
                  </Link>
                  <button onClick={handleSignOut} className="px-6 py-4 font-bold text-[15px] flex items-center gap-4 text-red-600 hover:bg-red-50 w-full text-left">
                    <LogOut className="w-5 h-5 opacity-70" /> Déconnexion
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="mx-4 my-3 px-4 py-3 bg-[#D97706] text-white font-bold flex items-center gap-3 rounded-xl justify-center hover:bg-[#B45309]">
                  <User className="w-5 h-5" /> Connexion
                </Link>
              )}
            </nav>
            <div className="p-4 border-t border-gray-50 flex justify-center sm:hidden">
              <LanguageSwitcher />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
