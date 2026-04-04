import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, ChevronRight, ShoppingBag, AlertCircle, RefreshCw, Zap, Truck, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrderHistory } from '@/hooks/useOrderHistory';

export const HistoryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orders, loading, error, hasMore, isFromCache, fetchOrders, refreshHistory } = useOrderHistory();
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchOrders(page, limit, page > 1);
  }, [page, fetchOrders]);

  const handleRefresh = () => {
    setPage(1);
    refreshHistory();
  };

  const loadMore = () => {
      if (!loading && hasMore) {
          setPage(prev => prev + 1);
      }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered':
      case 'completed': return 'bg-amber-100 text-amber-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'processing': 
      case 'preparing':
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatStatus = (status) => {
      const statusMap = {
          'pending': 'En attente',
          'preparing': 'En préparation',
          'ready': 'Prêt',
          'in_transit': 'En route',
          'delivered': 'Livré',
          'completed': 'Terminé',
          'cancelled': 'Annulé',
          'rejected': 'Rejeté'
      };
      return statusMap[status?.toLowerCase()] || status || 'En attente';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Helmet>
        <title>Historique des commandes - La Desirade Plus</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Historique des commandes</h1>
              {isFromCache && (
                <span className="flex items-center text-xs text-amber-600 mt-1 font-medium bg-amber-100 px-2 py-0.5 rounded-full w-fit">
                  <Zap className="w-3 h-3 mr-1" /> Données en cache (Mise à jour en arrière-plan)
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="gap-2 shadow-sm bg-white">
                <RefreshCw className={`w-4 h-4 text-gray-600 ${loading && !isFromCache ? 'animate-spin' : ''}`} /> Rafraîchir
            </Button>
        </div>

        {error && (
            <Alert variant="destructive" className="mb-6 bg-white shadow-sm border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800 font-bold">Erreur de récupération</AlertTitle>
                <AlertDescription className="flex flex-col gap-3 mt-2">
                    <p className="text-red-700 text-sm">{error}</p>
                    <Button onClick={handleRefresh} variant="outline" className="w-fit bg-red-50 text-red-700 hover:bg-red-100 border-red-200" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
                    </Button>
                </AlertDescription>
            </Alert>
        )}

        {loading && orders.length === 0 ? (
          <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex justify-between mb-4">
                          <div className="flex gap-3">
                              <Skeleton className="h-10 w-10 rounded-lg" />
                              <div className="space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                              </div>
                          </div>
                          <Skeleton className="h-6 w-24 rounded-full" />
                      </div>
                      <div className="flex justify-between border-t pt-3 mt-2">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-8 w-24 rounded-md" />
                      </div>
                  </div>
              ))}
          </div>
        ) : !error && orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-[#D97706]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune commande</h2>
            <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm">Vous n'avez pas encore passé de commande. Découvrez notre menu !</p>
            <Button 
              onClick={() => navigate('/menu')}
              className="bg-[#D97706] hover:bg-[#d94e0b] text-white rounded-xl"
            >
              Voir le menu
            </Button>
          </motion.div>
        ) : (
          <>
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
            >
                <AnimatePresence>
                {orders.map((order) => {
                  const itemsCount = order.order_items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
                  const isDelivery = order.type === 'delivery';

                  return (
                    <motion.div
                        key={order.id}
                        variants={itemVariants}
                        layout
                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => {
                            toast({ description: `Détails de la commande #${order.id.slice(0, 8)} à venir!` });
                        }}
                    >
                        <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg">
                              {isDelivery ? <Truck className="w-5 h-5 text-[#D97706]" /> : <Store className="w-5 h-5 text-[#D97706]" />}
                            </div>
                            <div>
                            <p className="font-bold text-gray-900 text-sm">
                              Commande #{order.id.slice(0, 8)}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(order.created_at).toLocaleDateString('fr-FR')} à {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getStatusColor(order.status)}`}>
                            {formatStatus(order.status)}
                        </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 mb-0.5">{itemsCount} article{itemsCount > 1 ? 's' : ''}</span>
                            <span className="font-bold text-gray-900 text-sm">{Number(order.total).toLocaleString()} FCFA</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 text-[#D97706] group-hover:bg-amber-50 px-3 text-xs rounded-lg transition-colors">
                              Voir détails <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                    </motion.div>
                  )
                })}
                </AnimatePresence>
            </motion.div>
            
            {hasMore && (
                <div className="mt-8 flex justify-center">
                    <Button 
                        variant="outline" 
                        onClick={loadMore} 
                        disabled={loading}
                        className="w-full sm:w-auto shadow-sm rounded-xl"
                    >
                        {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                        {loading ? 'Chargement en cours...' : 'Charger les commandes précédentes'}
                    </Button>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;