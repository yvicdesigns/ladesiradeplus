import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { PromoModal } from '@/components/PromoModal';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

export const PromoPopupPage = () => {
  const { bannerId } = useParams();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setLoading(true);
        if (!bannerId) throw new Error("ID de bannière manquant");

        const { data, error } = await supabase
          .from('promo_banners')
          .select('*, product:product_id(id, name, price, image_url)')
          .eq('id', bannerId)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("Bannière introuvable");
        if (!data.is_active) throw new Error("Cette promotion n'est plus active");

        setBanner(data);
      } catch (err) {
        console.error("Error fetching promo:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [bannerId]);

  const handleClose = () => {
    // Navigate back or home
    navigate('/menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Helmet><title>Chargement de l'offre...</title></Helmet>
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !banner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Helmet><title>Offre introuvable</title></Helmet>
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Offre Indisponible</h2>
          <p className="text-gray-500 mb-6">{error || "Cette promotion n'existe pas ou a expiré."}</p>
          <button 
            onClick={() => navigate('/menu')}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Découvrir notre menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center overflow-hidden">
      <Helmet>
        <title>{banner.title || 'Promotion Spéciale'}</title>
        <meta name="description" content="Découvrez notre promotion exclusive !" />
      </Helmet>
      
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-200 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-yellow-200 via-transparent to-transparent"></div>
      </div>

      <PromoModal 
        banner={banner} 
        isOpen={true} 
        onClose={handleClose} 
      />
    </div>
  );
};

export default PromoPopupPage;