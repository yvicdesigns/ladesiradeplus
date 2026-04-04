import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ReviewDebugPanel = () => {
  const [stats, setStats] = useState({
    total: 0,
    withValidId: 0,
    withMissingOrInvalidId: 0,
    samples: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const VALID_RESTAURANT_ID = "7eedf081-0268-4867-af38-61fa5932420a";

  const fetchDebugData = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const total = data.length;
      const valid = data.filter(r => r.restaurant_id === VALID_RESTAURANT_ID);
      const invalid = data.filter(r => r.restaurant_id !== VALID_RESTAURANT_ID);

      setStats({
        total,
        withValidId: valid.length,
        withMissingOrInvalidId: invalid.length,
        samples: data.slice(0, 5) // Last 5 reviews
      });
    } catch (err) {
      console.error("Failed to fetch debug stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  if (loading) {
    return <Card className="w-full mt-4"><CardContent className="p-6 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-gray-400" /></CardContent></Card>;
  }

  if (error) {
    return (
      <Card className="w-full mt-4 border-red-200 bg-red-50">
        <CardContent className="p-4 flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading debug data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-4 border-blue-200 shadow-sm">
      <CardHeader className="bg-blue-50/50 pb-4 border-b border-blue-100">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
          <CheckCircle2 className="h-5 w-5 text-blue-500" />
          Reviews Database Diagnostic Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
            <p className="text-sm font-medium text-gray-500 uppercase">Total Reviews</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 shadow-sm text-center">
            <p className="text-sm font-medium text-amber-700 uppercase">Valid Restaurant ID</p>
            <p className="text-3xl font-bold text-amber-700 mt-1">{stats.withValidId}</p>
          </div>
          <div className={`p-4 rounded-lg border shadow-sm text-center ${stats.withMissingOrInvalidId > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-sm font-medium uppercase ${stats.withMissingOrInvalidId > 0 ? 'text-red-700' : 'text-gray-500'}`}>Invalid/Missing ID</p>
            <p className={`text-3xl font-bold mt-1 ${stats.withMissingOrInvalidId > 0 ? 'text-red-700' : 'text-gray-700'}`}>{stats.withMissingOrInvalidId}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Recent Validation Status (Last 5 Insertions)</h4>
          <ScrollArea className="h-48 rounded-md border bg-gray-50 p-4">
            {stats.samples.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center mt-8">No reviews found in database.</p>
            ) : (
              <div className="space-y-3">
                {stats.samples.map(review => (
                  <div key={review.id} className="bg-white p-3 rounded border text-xs font-mono">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-700">ID: {review.id.substring(0,8)}...</span>
                      {review.restaurant_id === VALID_RESTAURANT_ID ? (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Valid ID</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Invalid ID</Badge>
                      )}
                    </div>
                    <pre className="text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify({
                        restaurant_id: review.restaurant_id,
                        customer_name: review.customer_name,
                        rating: review.rating,
                        created_at: review.created_at
                      }, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

      </CardContent>
    </Card>
  );
};