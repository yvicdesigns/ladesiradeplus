import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { User, LogOut, Settings, Heart, MapPin, History, Edit2, Mail, Phone, ChevronRight, Calendar, Users, Clock, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { EditProfileModal } from '@/components/EditProfileModal';
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload';
import { formatReservationStatus } from '@/lib/formatters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Data states
  const [profile, setProfile] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  
  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reservationError, setReservationError] = useState(null);

  // Fetch Profile & Customer Data
  const fetchUserData = async () => {
    if (!user) return;
    setLoadingProfile(true);
    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch Customer Data (for address)
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customerError) {
        setCustomer(customerData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        variant: "destructive",
        title: "Erreur Système",
        description: "Impossible de charger les informations de votre profil."
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchReservations = async () => {
    if (!user?.email) return;
    setLoadingReservations(true);
    setReservationError(null);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('customer_email', user.email);

      if (error) throw error;

      const sortedReservations = (data || []).sort((a, b) => {
        const dateA = new Date(`${a.reservation_date}T${a.reservation_time}`);
        const dateB = new Date(`${b.reservation_date}T${b.reservation_time}`);
        const now = new Date();
        const isFutureA = dateA >= now;
        const isFutureB = dateB >= now;

        if (isFutureA && isFutureB) return dateA - dateB;
        if (!isFutureA && !isFutureB) return dateB - dateA;
        if (isFutureA && !isFutureB) return -1;
        return 1;
      });

      setReservations(sortedReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setReservationError('Impossible de récupérer l\'historique des réservations.');
    } finally {
      setLoadingReservations(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .or(`client_id.eq.${user.id},client_email.eq.${user.email}`)
        .order('sent_date', { ascending: false });

      if (error) throw error;

      const sorted = (data || []).sort((a, b) => {
        if (a.status === 'unread' && b.status !== 'unread') return -1;
        if (a.status !== 'unread' && b.status === 'unread') return 1;
        return new Date(b.sent_date) - new Date(a.sent_date);
      });

      setNotifications(sorted);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, status: 'read' } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchReservations();
    fetchNotifications();
  }, [user]);

  const handlePhotoUpdate = (newUrl) => {
    setProfile(prev => ({ ...prev, photo_url: newUrl }));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Déconnexion Réussie", description: "À très bientôt sur Key's Food !" });
      navigate('/login');
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur de Déconnexion", description: "Une erreur technique est survenue." });
    }
  };

  const formatDateDisplay = (dateStr) => {
    try {
      return format(new Date(dateStr), 'EEEE d MMMM yyyy', { locale: fr });
    } catch (e) {
      return dateStr;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Helmet><title>Mon Profil - Key's Food</title></Helmet>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-[#D97706]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Espace Visiteur</h2>
          <Button onClick={() => navigate('/login')} className="w-full bg-[#D97706] text-white shadow-lg font-bold mt-2">Se Connecter</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Helmet><title>Mon Profil - Key's Food</title></Helmet>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        profileData={profile}
        customerData={customer}
        onProfileUpdate={fetchUserData}
      />

      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white pb-8 pt-6 px-6 rounded-b-[2.5rem] shadow-md border-b border-gray-100 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706]" />
        
        <div className="flex flex-col items-center text-center mt-2">
          {loadingProfile ? (
            <Skeleton className="w-32 h-32 rounded-full mb-4" />
          ) : (
            <ProfilePhotoUpload 
              currentPhotoUrl={profile?.photo_url} 
              onPhotoUpdate={handlePhotoUpdate}
            />
          )}
          
          <div className="mt-4 space-y-1">
            {loadingProfile ? (
              <>
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name || "Client Privilégié"}</h1>
                <p className="text-gray-500 text-sm font-medium">{user.email}</p>
              </>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-6 rounded-full border-[#D97706] text-[#D97706] hover:bg-amber-50 hover:text-[#d94e0b] font-bold"
            onClick={() => setIsEditModalOpen(true)}
            disabled={loadingProfile}
          >
            <Edit2 className="w-3 h-3 mr-2" />
            Éditer mon Profil
          </Button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="px-4 mt-8 max-w-2xl mx-auto space-y-6">

        {/* Contact & Address Info */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Mes Coordonnées</h3>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-500 mb-0.5 font-medium">Adresse Email Principale</p>
                {loadingProfile ? <Skeleton className="h-5 w-3/4" /> : <p className="text-gray-900 font-bold text-sm truncate">{user.email}</p>}
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5 font-medium">Numéro de Téléphone</p>
                {loadingProfile ? <Skeleton className="h-5 w-1/2" /> : <p className="text-gray-900 font-bold text-sm">{profile?.phone || 'Aucun numéro enregistré'}</p>}
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5 font-medium">Adresse de Livraison par Défaut</p>
                {loadingProfile ? (
                   <Skeleton className="h-5 w-3/4" />
                ) : (
                   <p className="text-gray-900 font-bold text-sm">
                     {customer?.address ? `${customer.address}${customer.city ? `, ${customer.city}` : ''}` : 'Aucune adresse renseignée'}
                   </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D97706]" /> Centre de Messages
            </h3>
            <Button variant="ghost" size="sm" onClick={fetchNotifications} disabled={loadingNotifications}>
              <RefreshCw className={`w-4 h-4 ${loadingNotifications ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="space-y-3">
            {loadingNotifications ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-sm font-medium">Votre boîte de réception est vide.</p>
              </div>
            ) : (
              <AnimatePresence>
                {notifications.map((notif) => (
                  <motion.div 
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${notif.status === 'unread' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {notif.status === 'unread' && <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0 animate-pulse" />}
                          <h4 className={`font-bold text-sm ${notif.status === 'unread' ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notif.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 leading-relaxed font-medium">{notif.content}</p>
                        <p className="text-xs text-gray-400 font-medium">{format(new Date(notif.sent_date), "d MMM yyyy 'à' HH:mm", { locale: fr })}</p>
                      </div>
                      {notif.status === 'unread' && (
                        <Button variant="ghost" size="sm" onClick={() => markAsRead(notif.id)} className="h-8 w-8 p-0 rounded-full text-[#D97706]">
                          <CheckCircle2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
        
        {/* Reservations Section */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.15 }}
           className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D97706]" /> Réservations de Tables
            </h3>
            <Button variant="ghost" size="sm" onClick={fetchReservations} disabled={loadingReservations}>
              <RefreshCw className={`w-4 h-4 ${loadingReservations ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {reservationError ? (
             <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{reservationError}</p>
             </div>
          ) : loadingReservations ? (
             <Skeleton className="h-24 w-full rounded-2xl" />
          ) : reservations.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-bold">Vous n'avez pas de réservation active.</p>
              <Button variant="outline" className="mt-4 text-[#D97706] font-bold" onClick={() => navigate('/reservations')}>Nouvelle Réservation</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((res) => (
                <div key={res.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${new Date(`${res.reservation_date}T${res.reservation_time}`) >= new Date() ? 'bg-[#D97706]' : 'bg-gray-300'}`} />
                  <div className="flex justify-between items-start pl-3">
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 text-sm capitalize">{formatDateDisplay(res.reservation_date)}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{res.reservation_time.slice(0, 5)}</span>
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{res.party_size} pers.</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${formatReservationStatus(res.status)}`}>
                      {res.status === 'pending' ? 'En attente' : res.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Menu Actions */}
        <motion.div 
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="divide-y divide-gray-50">
            <button onClick={() => navigate('/orders')} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[#D97706] group-hover:bg-[#D97706] group-hover:text-white transition-colors">
                <History className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-gray-900 font-bold block">Historique des Achats</span>
                <span className="text-gray-500 text-xs font-medium">Consultez vos commandes précédentes</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#D97706]" />
            </button>
            <button onClick={() => navigate('/settings')} className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left group">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-gray-600 group-hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-gray-900 font-bold block">Paramètres du Compte</span>
                <span className="text-gray-500 text-xs font-medium">Préférences, alertes et sécurité</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600" />
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Button variant="ghost" className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 h-12 font-bold shadow-sm" onClick={handleSignOut}>
            <LogOut className="w-5 h-5 mr-2" /> Déconnexion Sécurisée
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;