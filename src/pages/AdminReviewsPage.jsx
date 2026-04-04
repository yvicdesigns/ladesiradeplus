import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewDetailModal } from '@/components/ReviewDetailModal';
import { ReviewApproveModal } from '@/components/ReviewApproveModal';
import { ReviewRejectModal } from '@/components/ReviewRejectModal';
import { ReviewFlagModal } from '@/components/ReviewFlagModal';
import { ReviewResponseModal } from '@/components/ReviewResponseModal';
import { ReviewCreateModal } from '@/components/ReviewCreateModal';
import { ReviewFilters } from '@/components/ReviewFilters';
import { DeleteWithReasonModal } from '@/components/DeleteWithReasonModal';
import { Plus, Star, MessageSquare, Eye, Trash2, Check, X as XIcon, Flag, Image as ImageIcon, Utensils, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSoftDelete } from '@/hooks/useSoftDelete';

export const AdminReviewsPage = () => {
  const { data: reviews, loading, error, refetch } = useRealtimeSubscription('reviews', {
    select: '*, menu_items(name)'
  });
  const { deleteRecord, loading: deleteLoading } = useSoftDelete('reviews');
  
  const [selectedReview, setSelectedReview] = useState(null);
  const [modals, setModals] = useState({
    create: false,
    detail: false,
    approve: false,
    reject: false,
    flag: false,
    respond: false,
    delete: false
  });

  const toggleModal = (modalName, isOpen, review = null) => {
    if (review) setSelectedReview(review);
    setModals(prev => ({ ...prev, [modalName]: isOpen }));
  };

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    rating: 'all',
    sort: 'date_desc'
  });

  const stats = useMemo(() => {
    if (!reviews) return { total: 0, pending: 0, approved: 0, rejected: 0, flagged: 0, avgRating: 0 };
    
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const rejected = reviews.filter(r => r.status === 'rejected').length;
    const flagged = reviews.filter(r => r.status === 'flagged').length;
    const avgRating = total ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : 0;

    return { total, pending, approved, rejected, flagged, avgRating };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];
    let result = [...reviews];

    if (filters.search) {
      const lower = filters.search.toLowerCase();
      result = result.filter(r => 
        r.customer_name?.toLowerCase().includes(lower) ||
        (r.title && r.title.toLowerCase().includes(lower)) ||
        r.content?.toLowerCase().includes(lower) ||
        r.menu_items?.name?.toLowerCase().includes(lower)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter(r => r.status === filters.status);
    }

    if (filters.rating !== 'all') {
      result = result.filter(r => r.rating === parseInt(filters.rating));
    }

    result.sort((a, b) => {
      switch (filters.sort) {
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'rating_desc':
          return b.rating - a.rating;
        case 'rating_asc':
          return a.rating - b.rating;
        case 'date_desc':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return result;
  }, [reviews, filters]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <Badge className="bg-amber-500 hover:bg-green-600 text-xs">Approuvé</Badge>;
      case 'rejected': return <Badge className="bg-red-500 hover:bg-red-600 text-xs">Rejeté</Badge>;
      case 'flagged': return <Badge className="bg-amber-500 hover:bg-green-600 text-xs">Signalé</Badge>;
      default: return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">En Attente</Badge>;
    }
  };

  const handleDelete = async (reason) => {
    if (!selectedReview) return;
    const { success } = await deleteRecord(selectedReview.id, reason);
    if (success) {
      toggleModal('delete', false);
      refetch();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Avis Clients</h1>
            <p className="text-muted-foreground text-sm">Surveillez et gérez les retours des clients.</p>
          </div>
          <Button 
            onClick={() => toggleModal('create', true)} 
            className="bg-primary text-primary-foreground gap-2 text-sm"
          >
            <Plus className="h-4 w-4" /> Ajouter Avis
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <span className="text-xs font-medium text-muted-foreground">Total</span>
              <span className="text-xl font-bold">{stats.total}</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <span className="text-xs font-medium text-yellow-600">En Attente</span>
              <span className="text-xl font-bold text-yellow-700">{stats.pending}</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-green-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <span className="text-xs font-medium text-amber-600">Approuvés</span>
              <span className="text-xl font-bold text-amber-700">{stats.approved}</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-red-500/20 bg-red-500/5">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <span className="text-xs font-medium text-red-600">Rejetés</span>
              <span className="text-xl font-bold text-red-700">{stats.rejected}</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-green-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <span className="text-xs font-medium text-amber-600">Signalés</span>
              <span className="text-xl font-bold text-amber-700">{stats.flagged}</span>
            </CardContent>
          </Card>
           <Card className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <span className="text-xs font-medium text-muted-foreground">Note Moyenne</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold">{stats.avgRating}</span>
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <ReviewFilters filters={filters} setFilters={setFilters} />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>Impossible de charger les avis: {error.message}</AlertDescription>
          </Alert>
        )}

        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Client</TableHead>
                  <TableHead className="text-sm">Item</TableHead>
                  <TableHead className="text-sm">Note</TableHead>
                  <TableHead className="text-sm">Avis</TableHead>
                  <TableHead className="text-sm">Date</TableHead>
                  <TableHead className="text-sm">Statut</TableHead>
                  <TableHead className="text-right text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground text-sm">
                      Aucun avis trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.map((review) => (
                    <TableRow key={review.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="font-medium text-foreground text-sm">{review.customer_name || 'Anonyme'}</div>
                        <div className="text-xs text-muted-foreground">{review.customer_email}</div>
                      </TableCell>
                      <TableCell>
                        {review.menu_items?.name ? (
                           <div className="flex items-center gap-1 text-sm text-foreground font-medium">
                              <Utensils className="h-3 w-3 text-muted-foreground" />
                              {review.menu_items.name}
                           </div>
                        ) : (
                           <span className="text-xs text-muted-foreground italic">Général</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-yellow-500">
                           {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs md:max-w-md">
                        <div className="font-medium text-sm text-foreground truncate">{review.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{review.content}</div>
                        {review.images_urls?.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-blue-500">
                             <ImageIcon className="h-3 w-3" />
                             <span>{review.images_urls.length} images</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(review.created_at), 'dd MMM yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(review.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleModal('detail', true, review)} 
                            title="Détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {review.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                onClick={() => toggleModal('approve', true, review)} 
                                title="Approuver"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => toggleModal('reject', true, review)} 
                                title="Rejeter"
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={review.response ? "text-primary" : ""}
                            onClick={() => toggleModal('respond', true, review)} 
                            title={review.response ? "Modifier Réponse" : "Répondre"}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => toggleModal('delete', true, review)} 
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <ReviewCreateModal open={modals.create} onClose={() => toggleModal('create', false)} />
        <ReviewDetailModal open={modals.detail} onClose={() => toggleModal('detail', false)} review={selectedReview} onApprove={(r) => { toggleModal('detail', false); toggleModal('approve', true, r); }} onReject={(r) => { toggleModal('detail', false); toggleModal('reject', true, r); }} onFlag={(r) => { toggleModal('detail', false); toggleModal('flag', true, r); }} onRespond={(r) => { toggleModal('detail', false); toggleModal('respond', true, r); }} onDelete={(r) => { toggleModal('detail', false); toggleModal('delete', true, r); }} />
        <ReviewApproveModal open={modals.approve} onClose={() => toggleModal('approve', false)} review={selectedReview} />
        <ReviewRejectModal open={modals.reject} onClose={() => toggleModal('reject', false)} review={selectedReview} />
        <ReviewFlagModal open={modals.flag} onClose={() => toggleModal('flag', false)} review={selectedReview} />
        <ReviewResponseModal open={modals.respond} onClose={() => toggleModal('respond', false)} review={selectedReview} />
        
        <DeleteWithReasonModal 
            open={modals.delete} 
            onClose={() => toggleModal('delete', false)} 
            title="Mettre à la corbeille"
            message="Cet avis sera supprimé et l'action sera consignée."
            requireReason={true}
            onConfirm={handleDelete}
            loading={deleteLoading}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminReviewsPage;