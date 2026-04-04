import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/formatters';
import { CheckCircle, XCircle, MessageCircle, Trash2, Star } from 'lucide-react';

export const ReviewsTab = ({ reviews, onApprove, onReject, onDelete }) => {
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Approuvé</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeté</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800 border-gray-200">En attente</Badge>;
    }
  };

  return (
    <Card className="rounded-xl shadow-sm border-0 bg-white/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Client</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-[40%]">Commentaire</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucun avis trouvé</TableCell></TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id} className="group hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium">{review.customer_name || 'Anonyme'}</div>
                    <div className="text-xs text-muted-foreground">{review.customer_email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm truncate">{review.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{review.content}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(review.created_at)}</TableCell>
                  <TableCell>{getStatusBadge(review.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {review.status === 'pending' && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => onApprove(review.id)} className="text-amber-600 hover:bg-amber-50">
                            <CheckCircle className="w-4 h-4"/>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => onReject(review.id)} className="text-red-600 hover:bg-red-50">
                            <XCircle className="w-4 h-4"/>
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost">
                        <MessageCircle className="w-4 h-4 text-blue-600"/>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(review.id)} className="text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};