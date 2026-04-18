import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Users, Clock, AlignLeft, ArrowRight, Plus, CalendarX2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const ReservationsPage = () => {
  const { user } = useAuth();
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [view, setView] = useState('list'); 
  const [reservations, setReservations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    partySize: '2',
    name: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchReservations = async () => {
      setLoadingList(true);
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('user_id', user.id)
          .order('reservation_date', { ascending: false })
          .order('reservation_time', { ascending: false });
          
        if (error) throw error;
        setReservations(data || []);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger vos réservations.'
        });
      } finally {
        setLoadingList(false);
      }
    };
    
    if (view === 'list') {
      fetchReservations();
    }
  }, [user, view, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Connexion requise',
            description: 'Veuillez vous connecter pour faire une réservation.'
        });
        return;
    }

    if (!restaurantId) {
        toast({
            variant: 'destructive',
            title: 'Erreur de configuration',
            description: 'Impossible de déterminer le restaurant. Veuillez recharger la page.'
        });
        return;
    }

    // Validation
    if (!formData.date || !formData.time || !formData.name?.trim() || !formData.phone?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'Veuillez remplir la date, l\'heure, votre nom et votre téléphone.',
      });
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Numéro invalide',
        description: 'Veuillez entrer un numéro de téléphone valide.',
      });
      return;
    }

    // Compare as date strings to avoid UTC/local timezone shift issues
    const todayStr = new Date().toISOString().slice(0, 10);
    if (formData.date < todayStr) {
      toast({ variant: 'destructive', title: 'Date invalide', description: 'La date doit être aujourd\'hui ou dans le futur.' });
      return;
    }

    setLoadingSubmit(true);

    try {
      const reservationData = {
        user_id: user.id,
        reservation_date: formData.date,
        reservation_time: formData.time,
        party_size: parseInt(formData.partySize, 10),
        status: 'pending',
        notes: `Name: ${formData.name}, Phone: ${formData.phone}, Notes: ${formData.notes}`,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: user.email,
        restaurant_id: restaurantId // Dynamically acquired from context
      };

      const { error } = await supabase
        .from('reservations')
        .insert(reservationData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Réservation envoyée",
        description: "Votre demande de réservation a été enregistrée.",
        className: "bg-amber-100 text-amber-800 border-amber-200"
      });

      setFormData({ date: '', time: '', partySize: '2', name: '', phone: '', notes: '' });
      setView('list');

    } catch (e) {
      console.error('[ReservationsPage] Error:', e);
      toast({ 
        variant: 'destructive', 
        title: 'Erreur',
        description: 'Impossible de traiter votre réservation. Veuillez réessayer.',
        className: "bg-red-100 text-red-800 border-red-200"
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Confirmée</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En attente</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Annulée</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Terminée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCancelReservation = async (id) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setReservations(reservations.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
      toast({ title: "Réservation annulée", description: "La réservation a été annulée avec succès." });
    } catch (err) {
      console.error("Error cancelling:", err);
      toast({ variant: 'destructive', title: "Erreur", description: "Impossible d'annuler la réservation." });
    }
  };

  return (
    <>
      <Helmet>
        <title>Mes Réservations - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-4 px-4 pb-20">
        <header className="sticky top-0 z-40 bg-white px-4 py-4 flex items-center justify-between shadow-sm mb-4 rounded-b-2xl">
          <Button variant="ghost" size="icon" className="text-[#111827] -ml-2" onClick={() => view === 'create' ? setView('list') : navigate(-1)}>
            <ArrowRight className="w-6 h-6 rotate-180" />
          </Button>
          <h1 className="text-xl font-bold text-[#111827]">
            {view === 'create' ? 'Nouvelle Réservation' : 'Mes Réservations'}
          </h1>
          <div className="w-10 h-10"></div>
        </header>

        <div className="container mx-auto max-w-2xl">
          {view === 'list' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600 text-sm">Gérez vos réservations de table</p>
                <Button onClick={() => setView('create')} className="bg-[#D97706] hover:bg-[#d94e0b] text-white gap-2">
                  <Plus className="w-4 h-4" /> Réserver
                </Button>
              </div>

              {loadingList ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarX2 className="w-8 h-8 text-[#D97706]" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune réservation</h2>
                  <p className="text-gray-500 mb-6 max-w-xs mx-auto">Vous n'avez pas encore de réservation de table.</p>
                  <Button onClick={() => setView('create')} className="bg-[#D97706] hover:bg-[#d94e0b] text-white">
                    Faire une réservation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((res) => (
                    <div key={res.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-gray-900 font-bold mb-1">
                            <Calendar className="w-4 h-4 text-[#D97706]" />
                            {format(new Date(res.reservation_date), 'dd MMMM yyyy', { locale: fr })}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {res.reservation_time.substring(0, 5)}</span>
                            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {res.party_size} pers.</span>
                          </div>
                        </div>
                        {getStatusBadge(res.status)}
                      </div>
                      
                      {res.status === 'pending' && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => handleCancelReservation(res.id)}
                          >
                            Annuler la réservation
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-[#D97706] p-6 text-white text-center">
                <h2 className="text-xl font-bold mb-2">Réserver une Table</h2>
                <p className="opacity-90 text-sm">Assurez votre place pour une expérience inoubliable</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {!restaurantId && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Configuration du restaurant introuvable.</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <Users className="absolute left-4 top-3.5 h-5 w-5 text-[#D97706]" />
                    <Input 
                       type="number" min="1" max="20"
                       value={formData.partySize}
                       onChange={e => setFormData({...formData, partySize: e.target.value})}
                       className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-300 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] text-sm text-gray-900"
                       placeholder="Nombre de personnes"
                       required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-[#D97706]" />
                      <Input 
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-300 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] text-sm text-gray-900"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-4 top-3.5 h-5 w-5 text-[#D97706]" />
                      <Input 
                        type="time"
                        value={formData.time}
                        onChange={e => setFormData({...formData, time: e.target.value})}
                        className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-300 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] text-sm text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <Input 
                     placeholder="Votre Nom"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="h-12 rounded-xl bg-gray-50 border-gray-300 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] text-sm text-gray-900"
                     required
                  />
                   <Input
                     type="tel"
                     placeholder="Numéro de Téléphone"
                     value={formData.phone}
                     onChange={e => {
                       const val = e.target.value.replace(/[^\d\s+\-().]/g, '');
                       setFormData({...formData, phone: val});
                     }}
                     className="h-12 rounded-xl bg-gray-50 border-gray-300 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] text-sm text-gray-900"
                     required
                  />

                  <div className="relative">
                     <AlignLeft className="absolute left-4 top-3.5 h-5 w-5 text-[#D97706]" />
                     <textarea
                       className="w-full min-h-[100px] pl-12 pt-3 pr-4 rounded-xl bg-gray-50 border border-gray-300 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] focus:outline-none transition-all resize-none text-sm text-gray-900"
                       placeholder="Demandes spéciales (allergies, chaise haute...)"
                       value={formData.notes}
                       onChange={e => setFormData({...formData, notes: e.target.value})}
                     />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loadingSubmit || !restaurantId}
                  className="w-full bg-[#D97706] hover:bg-[#FCD34D] h-12 rounded-xl text-base font-bold shadow-lg shadow-black/20 mt-4 text-white"
                >
                  {loadingSubmit ? <Loader2 className="animate-spin" /> : "Confirmer la Réservation"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReservationsPage;