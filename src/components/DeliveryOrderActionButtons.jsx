import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  getNextStatus, 
  getActionLabel, 
  STATUS_DELIVERED,
  STATUS_CANCELLED 
} from '@/lib/deliveryConstants';
import { Play, Loader2 } from 'lucide-react';

export const DeliveryOrderActionButtons = ({ status, orderId, onUpdateStatus }) => {
  const nextStatus = getNextStatus(status);
  const [loading, setLoading] = React.useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (!nextStatus) return;
    
    console.log(`[CONFIRM_ORDER] Button clicked for Order ${orderId}. Current: ${status}, Next: ${nextStatus}`);
    
    setLoading(true);
    try {
      await onUpdateStatus(orderId, nextStatus);
    } catch (err) {
      console.error(`[CONFIRM_ORDER] Error in DeliveryOrderActionButtons click handler:`, err);
    } finally {
      setLoading(false);
    }
  };

  if (status === STATUS_DELIVERED || status === STATUS_CANCELLED || !nextStatus) {
    return null;
  }

  // Simplified small button for the table view
  return (
    <Button 
      size="sm" 
      onClick={handleClick} 
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-8 px-3 text-xs"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
      {getActionLabel(nextStatus)}
    </Button>
  );
};