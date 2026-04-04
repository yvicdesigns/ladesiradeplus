import React from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, ORDER_STATUSES } from '../constants';
import { Clock, CheckCircle, ChefHat, Truck, MapPin, XCircle, AlertTriangle } from 'lucide-react';

const ICONS = {
  [ORDER_STATUSES.PENDING]: Clock,
  [ORDER_STATUSES.CONFIRMED]: CheckCircle,
  [ORDER_STATUSES.PREPARING]: ChefHat,
  [ORDER_STATUSES.READY]: CheckCircle,
  [ORDER_STATUSES.SERVED]: CheckCircle,
  [ORDER_STATUSES.IN_TRANSIT]: Truck,
  [ORDER_STATUSES.DELIVERED]: MapPin,
  [ORDER_STATUSES.CANCELLED]: XCircle,
  [ORDER_STATUSES.REJECTED]: AlertTriangle,
};

const LABELS = {
  [ORDER_STATUSES.PENDING]: 'En attente',
  [ORDER_STATUSES.CONFIRMED]: 'Confirmée',
  [ORDER_STATUSES.PREPARING]: 'En préparation',
  [ORDER_STATUSES.READY]: 'Prête',
  [ORDER_STATUSES.SERVED]: 'Servie',
  [ORDER_STATUSES.IN_TRANSIT]: 'En route',
  [ORDER_STATUSES.DELIVERED]: 'Livrée',
  [ORDER_STATUSES.CANCELLED]: 'Annulée',
  [ORDER_STATUSES.REJECTED]: 'Rejetée',
};

export const OrderStatusBadge = ({ status, className = '', size = 'md' }) => {
  const safeStatus = status?.toLowerCase() || ORDER_STATUSES.PENDING;
  const colorClass = STATUS_COLORS[safeStatus] || 'bg-gray-100 text-gray-800';
  const label = LABELS[safeStatus] || safeStatus;
  const Icon = ICONS[safeStatus] || Clock;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0 h-5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1 font-bold'
  };

  return (
    <Badge variant="outline" className={`${colorClass} ${sizeClasses[size]} flex items-center gap-1.5 border whitespace-nowrap ${className}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {label}
    </Badge>
  );
};