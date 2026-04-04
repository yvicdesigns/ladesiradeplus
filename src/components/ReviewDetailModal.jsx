import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, ThumbsUp, ThumbsDown, Flag, MessageSquare, Trash2, X, Image as ImageIcon, Utensils } from 'lucide-react';
import { format } from 'date-fns';

export const ReviewDetailModal = ({ 
  open, 
  onClose, 
  review, 
  onApprove, 
  onReject, 
  onFlag, 
  onRespond, 
  onDelete 
}) => {
  if (!review) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <Badge className="bg-amber-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case 'flagged': return <Badge className="bg-amber-500 hover:bg-green-600">Flagged</Badge>;
      default: return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              Review Details
              {getStatusBadge(review.status)}
            </DialogTitle>
          </div>
          <DialogDescription>
            Submitted on {review.created_at ? format(new Date(review.created_at), 'PPP') : 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Linked Item Badge */}
          {review.menu_items?.name && (
            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium w-fit">
              <Utensils className="h-4 w-4" />
              Product: {review.menu_items.name}
            </div>
          )}

          {/* Customer Info */}
          <div className="flex items-start justify-between bg-muted/30 p-4 rounded-lg">
            <div>
              <h4 className="font-semibold text-lg">{review.customer_name || 'Anonymous'}</h4>
              <p className="text-sm text-muted-foreground">{review.customer_email}</p>
            </div>
            <div className="flex text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg">{review.title}</h3>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {review.content}
            </p>
          </div>

          {/* Images */}
          {review.images_urls && review.images_urls.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" /> Attached Images
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {review.images_urls.map((url, index) => (
                  <div key={index} className="aspect-square bg-muted rounded-md overflow-hidden relative group">
                    <img 
                      src={url} 
                      alt={`Review attachment ${index + 1}`} 
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Response Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground">Restaurant Response</h4>
              {review.response && (
                <span className="text-xs text-muted-foreground">
                  Responded on {review.response_date ? format(new Date(review.response_date), 'PPP') : 'N/A'}
                </span>
              )}
            </div>
            
            {review.response ? (
              <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg text-sm italic relative">
                <div className="absolute -left-1 top-4 w-1 h-8 bg-primary rounded-r"></div>
                {review.response}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic flex items-center gap-2 p-4 bg-muted/20 rounded-lg border border-dashed border-border justify-center">
                <MessageSquare className="h-4 w-4" />
                No response yet.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex flex-wrap gap-2 w-full justify-between sm:justify-start">
            <Button 
              variant="outline" 
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
              onClick={() => onApprove(review)}
              disabled={review.status === 'approved'}
            >
              <ThumbsUp className="h-4 w-4 mr-2" /> Approve
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => onReject(review)}
              disabled={review.status === 'rejected'}
            >
              <ThumbsDown className="h-4 w-4 mr-2" /> Reject
            </Button>
            <Button 
              variant="outline" 
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
              onClick={() => onFlag(review)}
              disabled={review.status === 'flagged'}
            >
              <Flag className="h-4 w-4 mr-2" /> Flag
            </Button>
             <Button 
              variant="default"
              onClick={() => onRespond(review)}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> {review.response ? 'Edit Response' : 'Respond'}
            </Button>
          </div>
          
          <Button 
            variant="destructive" 
            size="icon"
            onClick={() => onDelete(review)}
            className="ml-auto"
            title="Delete Review"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};