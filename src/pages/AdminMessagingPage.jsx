import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare, Send, Users, User, RefreshCw,
  ChevronDown, CheckCircle2, Clock, Trash2, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MESSAGE_TYPES = [
  { value: 'info', label: 'Information', color: 'bg-blue-100 text-blue-700' },
  { value: 'promo', label: 'Promotion', color: 'bg-amber-100 text-amber-700' },
  { value: 'alert', label: 'Alerte', color: 'bg-red-100 text-red-700' },
  { value: 'reminder', label: 'Rappel', color: 'bg-purple-100 text-purple-700' },
];

const TypeBadge = ({ type }) => {
  const t = MESSAGE_TYPES.find(m => m.value === type) || MESSAGE_TYPES[0];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.color}`}>{t.label}</span>;
};

export const AdminMessagingPage = () => {
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info');
  const [sendTo, setSendTo] = useState('all');
  const [sending, setSending] = useState(false);

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientSearch, setClientSearch] = useState('');

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!restaurantId) return;
    setLoadingClients(true);
    try {
      // Fetch from customers table
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email, phone, user_id')
        .eq('restaurant_id', restaurantId)
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('name', { ascending: true });
      if (customersError) throw customersError;

      // Also fetch from profiles to include registered users who haven't ordered yet
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, role')
        .not('role', 'in', '("admin","manager","staff","driver")');

      // Merge: profiles not already in customers
      const customerEmails = new Set((customersData || []).map(c => c.email?.toLowerCase()).filter(Boolean));
      const extraProfiles = (profilesData || []).filter(p => p.email && !customerEmails.has(p.email.toLowerCase()));
      const extraClients = extraProfiles.map(p => ({
        id: p.id,
        name: p.full_name || p.email,
        email: p.email,
        phone: null,
        user_id: p.user_id,
      }));

      setClients([...(customersData || []), ...extraClients]);
    } catch (e) {
      console.error('Error fetching clients:', e);
    } finally {
      setLoadingClients(false);
    }
  }, [restaurantId]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .order('sent_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory(data || []);
    } catch (e) {
      console.error('Error fetching history:', e);
      toast({ variant: 'destructive', title: 'Erreur historique', description: e.message || JSON.stringify(e) });
    } finally {
      setLoadingHistory(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
    fetchHistory();
  }, [fetchClients, fetchHistory]);

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ variant: 'destructive', title: 'Champs requis', description: 'Le titre et le message sont obligatoires.' });
      return;
    }
    setSending(true);
    try {
      const now = new Date().toISOString();
      if (sendTo === 'all') {
        if (clients.length === 0) {
          toast({ variant: 'destructive', title: 'Aucun client', description: 'Aucun client trouvé pour ce restaurant.' });
          setSending(false);
          return;
        }
        const rows = clients.map(c => ({
          client_id: c.user_id || null,
          client_email: c.email || null,
          title: title.trim(),
          content: content.trim(),
          type,
          status: 'unread',
          sent_date: now,
          created_at: now,
          is_deleted: false,
        }));
        const { error } = await supabase.from('user_notifications').insert(rows);
        if (error) throw error;
        toast({ title: 'Message envoyé', description: `Envoyé à ${clients.length} client(s).`, className: 'bg-green-600 text-white' });
      } else {
        const client = clients.find(c => c.id === sendTo);
        if (!client) throw new Error('Client introuvable.');
        const { error } = await supabase.from('user_notifications').insert({
          client_id: client.user_id || null,
          client_email: client.email || null,
          title: title.trim(),
          content: content.trim(),
          type,
          status: 'unread',
          sent_date: now,
          created_at: now,
          is_deleted: false,
        });
        if (error) throw error;
        toast({ title: 'Message envoyé', description: `Envoyé à ${client.name || client.email}.`, className: 'bg-green-600 text-white' });
      }
      setTitle('');
      setContent('');
      setType('info');
      setSendTo('all');
      fetchHistory();
    } catch (e) {
      toast({ variant: 'destructive', title: "Erreur d'envoi", description: e.message });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('user_notifications').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
      setHistory(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur', description: e.message });
    }
  };

  const filteredClients = clients.filter(c =>
    !clientSearch ||
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const readCount = history.filter(n => n.status === 'read').length;

  return (
    <AdminLayout>
      <Helmet><title>Messagerie - Admin La Desirade Plus</title></Helmet>

      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" /> Messagerie Clients
            </h1>
            <p className="text-gray-500 text-sm mt-1">Envoyez des messages personnalisés à vos clients.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchClients(); fetchHistory(); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Compose */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" /> Nouveau Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipient */}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Destinataire</label>
                  {loadingClients ? (
                    <Skeleton className="h-10 w-full rounded-lg" />
                  ) : (
                    <div className="relative">
                      <select
                        value={sendTo}
                        onChange={e => setSendTo(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="all">Tous les clients ({clients.length})</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.email || 'Client sans nom'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                  {clients.length > 8 && (
                    <div className="relative mt-2">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filtrer les clients..."
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {MESSAGE_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setType(t.value)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${type === t.value ? t.color + ' border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Titre</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Offre spéciale weekend..."
                    maxLength={100}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{title.length}/100</p>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Message</label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Rédigez votre message ici..."
                    rows={4}
                    maxLength={500}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{content.length}/500</p>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !content.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {sendTo === 'all' ? `Envoyer à tous (${clients.length})` : 'Envoyer'}
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{clients.length}</p>
                    <p className="text-xs text-gray-500 font-medium">Clients</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{readCount}</p>
                    <p className="text-xs text-gray-500 font-medium">Lus</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* History */}
          <div className="lg:col-span-3">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" /> Historique des messages
                  <Badge variant="secondary" className="ml-auto font-bold">{history.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingHistory ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">Aucun message envoyé.</p>
                    <p className="text-gray-400 text-sm">Composez votre premier message.</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[580px] overflow-y-auto">
                    {history.map(msg => (
                      <div key={msg.id} className="p-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                              {msg.client_id ? <User className="w-4 h-4 text-gray-500" /> : <Users className="w-4 h-4 text-gray-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-bold text-sm text-gray-900 truncate">{msg.title}</span>
                                <TypeBadge type={msg.type} />
                                {msg.status === 'read' ? (
                                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                                    <CheckCircle2 className="w-3 h-3" /> Lu
                                  </span>
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Non lu" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{msg.content}</p>
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="text-xs text-gray-400 truncate max-w-[160px]">
                                  {msg.client_email || (msg.client_id ? 'Client spécifique' : 'Tous les clients')}
                                </span>
                                {msg.sent_date && (
                                  <span className="text-xs text-gray-400">
                                    {format(new Date(msg.sent_date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 shrink-0 mt-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMessagingPage;
