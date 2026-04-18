import React from 'react';
import { Button } from '@/components/ui/button';
import {
  getNextStatus,
  getActionLabel,
  STATUS_DELIVERED,
  STATUS_CANCELLED,
  STATUS_REJECTED,
  STATUS_PENDING
} from '@/lib/deliveryConstants';
import { Play, Check, X, Loader2 } from 'lucide-react';

export const DeliveryOrderActionButtons = ({ status, orderId, onUpdateStatus }) => {
  const nextStatus = getNextStatus(status);
  const [loading, setLoading] = React.useState(null); // 'accept' | 'reject' | 'next'

  const handleClick = async (e, targetStatus, action) => {
    e.stopPropagation();
    setLoading(action);
    try {
      await onUpdateStatus(orderId, targetStatus);
    } catch (err) {
      console.error(`[DeliveryOrderActionButtons] Error updating to ${targetStatus}:`, err);
    } finally {
      setLoading(null);
    }
  };

  if (status === STATUS_DELIVERED || status === STATUS_CANCELLED || status === STATUS_REJECTED) {
    return null;
  }

  // Pending orders: show Accept / Reject buttons — staff must decide before anything starts
  if (status === STATUS_PENDING) {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          onClick={(e) => handleClick(e, 'confirmed', 'accept')}
          disabled={!!loading}
          className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8 px-3 text-xs font-bold"
        >
          {loading === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Accepter
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={(e) => handleClick(e, STATUS_REJECTED, 'reject')}
          disabled={!!loading}
          className="gap-1 h-8 px-3 text-xs font-bold"
        >
          {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Refuser
        </Button>
      </div>
    );
  }

  if (!nextStatus) return null;

  // All other statuses: single "next step" button
  return (
    <Button
      size="sm"
      onClick={(e) => handleClick(e, nextStatus, 'next')}
      disabled={!!loading}
      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-8 px-3 text-xs"
    >
      {loading === 'next' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
      {getActionLabel(nextStatus)}
    </Button>
  );
};
