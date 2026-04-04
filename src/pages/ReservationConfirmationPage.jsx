import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Users, Clock, Home, User, Phone } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ReservationConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reservation } = location.state || {};

  useEffect(() => {
    if (!reservation) {
      // Redirect if accessed directly without state
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reservation, navigate]);

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune réservation trouvée</h2>
        <p className="text-gray-500">Redirection vers l'accueil...</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'EEEE d MMMM yyyy', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <>
      <Helmet>
        <title>Réservation Confirmée - La Desirade Plus</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-[32px] shadow-xl p-6 sm:p-10 max-w-md w-full text-center space-y-8 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-[#D97706] rounded-t-[32px]" />

          <div className="space-y-4">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50/50">
              <CheckCircle className="h-12 w-12 text-amber-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Réservation Confirmée !
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                Votre table a été réservée avec succès. Nous vous attendons avec impatience.
              </p>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-green-100 rounded-2xl p-6 text-left space-y-4">
            <h3 className="font-bold text-xs text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Détails de la réservation
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-green-100 pb-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-[#D97706]" />
                  <span className="text-sm">Date</span>
                </div>
                <span className="font-bold text-gray-900 text-sm capitalize">{formatDate(reservation.date)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-green-100 pb-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-5 h-5 text-[#D97706]" />
                  <span className="text-sm">Heure</span>
                </div>
                <span className="font-bold text-gray-900 text-sm">{reservation.time}</span>
              </div>

              <div className="flex items-center justify-between border-b border-green-100 pb-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Users className="w-5 h-5 text-[#D97706]" />
                  <span className="text-sm">Personnes</span>
                </div>
                <span className="font-bold text-gray-900 text-sm">{reservation.partySize} personnes</span>
              </div>
              
              <div className="pt-2 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase">Contact</p>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{reservation.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{reservation.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <Link 
            to="/" 
            className="w-full bg-[#D97706] hover:bg-[#FCD34D] text-white rounded-2xl h-14 font-bold text-base shadow-lg shadow-green-100 transition-transform active:scale-95 flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </>
  );
};

export default ReservationConfirmationPage;