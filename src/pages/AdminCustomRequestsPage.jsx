import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { Sparkles, CheckCircle, XCircle, PlusCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

const STATUS_CONFIG = {
  new:           { label: 'Nouveau',        color: 'bg-amber-100 text-amber-800 border-amber-200' },
  seen:          { label: 'Vu',             color: 'bg-blue-100 text-blue-800 border-blue-200' },
  added_to_menu: { label: 'Ajouté au menu', color: 'bg-green-100 text-green-800 border-green-200' },
  rejected:      { label: 'Rejeté',         color: 'bg-red-100 text-red-800 border-red-200' },
};

export const AdminCustomRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('customer_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id, status) => {
    await supabase.from('customer_requests').update({ status }).eq('id', id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    const labels = { seen: 'marquée comme vue', added_to_menu: 'ajoutée au menu', rejected: 'rejetée' };
    toast({ title: `Demande ${labels[status] || 'mise à jour'}` });
  };

  const newCount = requests.filter(r => r.status === 'new').length;

  return (
    <>
      <Helmet><title>Demandes Clients IA — Admin</title></Helmet>
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Demandes Clients IA</h1>
              <p className="text-sm text-gray-500">Plats suggérés par les clients via l'assistant</p>
            </div>
            {newCount > 0 && (
              <span className="bg-[#D97706] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {newCount} nouveau{newCount > 1 ? 'x' : ''}
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune demande pour le moment</p>
            <p className="text-sm mt-1">Les suggestions des clients apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
              return (
                <div key={req.id} className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${req.status === 'new' ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 italic mb-1">
                        💬 "{req.request_text}"
                      </p>
                      <p className="text-base font-bold text-gray-900">
                        🍽️ {req.suggested_dish}
                      </p>
                    </div>
                  </div>

                  {req.status === 'new' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => updateStatus(req.id, 'seen')}>
                        <CheckCircle className="w-4 h-4" /> Vu
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50" onClick={() => updateStatus(req.id, 'added_to_menu')}>
                        <PlusCircle className="w-4 h-4" /> Ajouter au menu
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50" onClick={() => updateStatus(req.id, 'rejected')}>
                        <XCircle className="w-4 h-4" /> Rejeter
                      </Button>
                    </div>
                  )}
                  {req.status === 'seen' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Button size="sm" variant="outline" className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50" onClick={() => updateStatus(req.id, 'added_to_menu')}>
                        <PlusCircle className="w-4 h-4" /> Ajouter au menu
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50" onClick={() => updateStatus(req.id, 'rejected')}>
                        <XCircle className="w-4 h-4" /> Rejeter
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminCustomRequestsPage;
