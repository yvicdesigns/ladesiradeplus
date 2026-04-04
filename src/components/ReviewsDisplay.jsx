import React, { useMemo } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Star, MessageSquare, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const ReviewsDisplay = ({ menuItemId }) => {
  // Hardcoded expected valid restaurant ID to ensure absolute isolation
  const VALID_RESTAURANT_ID = "7eedf081-0268-4867-af38-61fa5932420a";
  
  // Enforce tenant isolation for reviews by filtering strictly by the valid restaurant_id
  const { data: reviews, loading } = useRealtimeSubscription('reviews', {
    filter: { 
      menu_item_id: menuItemId,
      status: 'approved',
      restaurant_id: VALID_RESTAURANT_ID // Explicit strict filter requirement fulfilled
    },
    orderBy: { column: 'created_at', ascending: false }
  });

  const stats = useMemo(() => {
    if (!reviews || reviews.length === 0) return { average: 0, total: 0, distribution: [0,0,0,0,0] };

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = (sum / total).toFixed(1);
    
    // Calculate star distribution (1 to 5)
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      const index = Math.max(0, Math.min(4, r.rating - 1));
      distribution[index]++;
    });

    return { average, total, distribution: distribution.reverse() }; // Reverse to show 5 stars first
  }, [reviews]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start bg-gray-50 p-6 rounded-2xl">
        <div className="flex flex-col items-center justify-center min-w-[150px]">
          <span className="text-5xl font-bold text-[#111827]">{stats.average}</span>
          <div className="flex text-yellow-400 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`h-5 w-5 ${star <= Math.round(stats.average) ? 'fill-current' : 'text-gray-200'}`} 
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">{stats.total} avis</span>
        </div>

        <div className="flex-1 w-full space-y-2">
          {[5, 4, 3, 2, 1].map((star, i) => {
             const count = reviews?.filter(r => r.rating === star).length || 0;
             const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
             
             return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="font-medium w-3">{star}</span>
                <Star className="h-3 w-3 text-gray-400" />
                <Progress value={percent} className="h-2" />
                <span className="text-gray-500 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="font-bold text-lg text-[#111827]">Derniers Avis</h3>
        
        {reviews?.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed rounded-xl border-gray-200">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Aucun avis pour le moment. Soyez le premier à partager votre expérience !</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                       <AvatarFallback className="bg-amber-100 text-[#D97706]">
                         {review.customer_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                       </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-sm text-[#111827]">{review.customer_name || 'Anonyme'}</h4>
                      <div className="flex text-yellow-400 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(new Date(review.created_at), 'dd MMM yyyy')}
                  </span>
                </div>
                
                {review.title && <h5 className="font-medium text-sm mb-1">{review.title}</h5>}
                <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
                
                {review.response && (
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg border-l-2 border-[#D97706]">
                    <p className="text-xs font-bold text-[#D97706] mb-1">Réponse du Restaurant</p>
                    <p className="text-xs text-gray-600 italic">{review.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};