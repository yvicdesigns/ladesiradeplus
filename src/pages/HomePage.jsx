import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { HomeDesktopView } from '@/components/HomeDesktopView';
import { motion } from 'framer-motion';
import { ShoppingBag, QrCode, Calendar, Utensils, ShieldCheck, Loader2, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/hooks/useSound';
import SoundButtonWrapper from '@/components/SoundButtonWrapper';
import { logger } from '@/lib/logger';
import { Skeleton } from '@/components/ui/skeleton';
import { useRestaurant } from '@/contexts/RestaurantContext';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { settings, loading: logoLoading, activeRestaurantName } = useRestaurant();

  const [isAdminOrManager, setIsAdminOrManager] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [openDaysLabel, setOpenDaysLabel] = useState('...');

  useSound();

  useEffect(() => {
    supabase
      .from('business_hours')
      .select('day_of_week, is_open')
      .order('day_of_week')
      .then(({ data }) => {
        if (!data || data.length === 0) { setOpenDaysLabel('7j/7'); return; }
        const openCount = data.filter(d => d.is_open).length;
        setOpenDaysLabel(openCount === 7 ? '7j/7' : `${openCount}j/7`);
      });
  }, []);

  const restaurantLogo = settings?.logo_url;
  const restaurantBanner = settings?.banner_url;
  const restaurantBannerVideo = settings?.banner_video_url;

  useEffect(() => {
    logger.info('[HomePage] Mounted. Current User:', user?.email || 'Guest');
  }, [user]);

  const checkRole = useCallback(async () => {
    if (!user?.id) {
      setIsAdminOrManager(false);
      setRoleLoading(false);
      return;
    }
    try {
      setRoleLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsAdminOrManager(data && ['admin', 'manager', 'staff'].includes(data.role));
    } catch (err) {
      logger.error('[HomePage] Failed to check user role:', err.message || err);
      setIsAdminOrManager(false);
    } finally {
      setRoleLoading(false);
    }
  }, [user]);

  useEffect(() => { checkRole(); }, [checkRole]);

  const handleAdminClick = async () => {
    if (!user) { navigate('/admin/login'); return; }
    if (roleLoading) return;
    if (isAdminOrManager) {
      navigate('/admin');
      toast({ title: t('home.admin_access'), description: t('home.admin_welcome'), className: "bg-amber-600 text-white font-bold" });
    } else {
      toast({ variant: "destructive", title: t('home.admin_denied'), description: t('home.insufficient_privileges') });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
  };

  return (
    <>
      <Helmet>
        <title>{activeRestaurantName || t('home.hero_title')} - {t('home.hero_subtitle')}</title>
        <meta name="description" content="Découvrez la cuisine authentique." />
      </Helmet>

      {/* Desktop: full menu view */}
      <div className="hidden md:block">
        <HomeDesktopView />
      </div>

      {/* Mobile/Tablet: hero + action cards */}
      <div className="md:hidden min-h-[100dvh] w-full bg-[#F7F7F7] flex flex-col" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>

        {/* ── DARK HERO SECTION ── */}
        <div className="relative w-full bg-[#1A1A1A] overflow-hidden" style={{ minHeight: '52vh', maxHeight: '65vh' }}>

          {/* Background video or image */}
          {restaurantBannerVideo ? (
            <video
              src={restaurantBannerVideo}
              autoPlay muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.55 }}
            />
          ) : restaurantBanner ? (
            <img
              src={restaurantBanner}
              alt="Restaurant"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.55 }}
            />
          ) : null}

          {/* Dark gradient overlay — always present */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-10" />

          {/* Logo center middle */}
          <div className="absolute inset-0 flex items-start justify-center pt-12 z-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-xl overflow-hidden border-4 border-white/30"
            >
              {logoLoading ? (
                <Skeleton className="w-full h-full rounded-full" />
              ) : restaurantLogo ? (
                <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <Utensils className="h-14 w-14 text-[#D97706]" />
              )}
            </motion.div>
          </div>

          {/* Admin button top-right */}
          {(!user || isAdminOrManager) && (
            <div className="absolute top-5 right-4 z-20">
              <SoundButtonWrapper
                onClick={handleAdminClick}
                disabled={roleLoading && !!user}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 h-auto transition-all"
              >
                {roleLoading && user
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ShieldCheck className="h-4 w-4" />
                }
                <span className="text-xs font-semibold hidden sm:inline">{t('home.admin_access')}</span>
              </SoundButtonWrapper>
            </div>
          )}

          {/* Hero text — bottom of dark section */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-8 pt-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
              <div className="flex items-center gap-1.5 mb-2">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 fill-[#D97706] text-[#D97706]" />)}
                <span className="text-white/60 text-xs ml-1 font-medium">{t('home.authentic_cuisine')}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-1">
                {activeRestaurantName || t('home.hero_title')}
              </h1>
              <p className="text-white/60 text-sm font-medium">
                {t('home.hero_subtitle')}
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── ACTION CARDS ── */}
        <div className="px-4 pt-5 pb-4 md:max-w-7xl md:mx-auto md:px-8 md:w-full">
          <motion.div className="space-y-3 md:grid md:grid-cols-3 md:gap-4 md:space-y-0" variants={containerVariants} initial="hidden" animate="visible">

            {/* Primary CTA */}
            <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <SoundButtonWrapper
                onClick={() => navigate('/menu')}
                className="w-full bg-[#D97706] hover:bg-[#B45309] text-white rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-amber-700/20 transition-all duration-200 h-auto border-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-base leading-tight">{t('home.order_button')}</p>
                    <p className="text-white/75 text-xs font-medium mt-0.5">{t('home.order_desc')}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white/60 flex-shrink-0" />
              </SoundButtonWrapper>
            </motion.div>

            {/* Secondary cards */}
            <div className="grid grid-cols-2 gap-3 md:contents">
              <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <SoundButtonWrapper
                  onClick={() => navigate('/qr-menu')}
                  className="w-full bg-white hover:bg-gray-50 rounded-2xl p-5 flex flex-col items-start gap-3 shadow-sm border border-gray-100 transition-all duration-200 h-auto"
                >
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-[#D97706]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 leading-tight">{t('home.scan_button')}</p>
                    <p className="text-gray-400 text-xs mt-0.5 font-medium normal-case">{t('home.scan_desc')}</p>
                  </div>
                </SoundButtonWrapper>
              </motion.div>

              <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/reservations"
                  className="w-full bg-white hover:bg-gray-50 rounded-2xl p-5 flex flex-col items-start gap-3 shadow-sm border border-gray-100 transition-all duration-200 h-auto"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[#D97706]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 leading-tight">{t('home.book_button')}</p>
                    <p className="text-gray-400 text-xs mt-0.5 font-medium normal-case">{t('home.book_desc')}</p>
                  </div>
                </Link>
              </motion.div>
            </div>

          </motion.div>
        </div>

        {/* ── QUICK INFO STRIP ── */}
        <div className="px-4 mt-2 md:max-w-7xl md:mx-auto md:px-8 md:w-full">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-around">
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-900">30–45</p>
              <p className="text-xs text-gray-400 font-medium">{t('home.delivery_time')}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-center">
              <p className="text-lg font-extrabold text-[#D97706]">4.8</p>
              <p className="text-xs text-gray-400 font-medium">{t('home.customer_rating')}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-900">{openDaysLabel}</p>
              <p className="text-xs text-gray-400 font-medium">{t('home.open_status')}</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default HomePage;
