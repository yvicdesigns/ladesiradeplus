import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatDeliveryStatusFR, getDeliveryStatusColor } from '@/lib/formatters';

export const DeliveryStatusBadge = ({ status }) => {
  return (
    <Badge className={`${getDeliveryStatusColor(status)} shadow-sm text-[10px] px-1.5 py-0.5 h-5`}>
      {formatDeliveryStatusFR(status)}
    </Badge>
  );
};