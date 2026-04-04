import { Clock, CheckCircle, ChefHat, Package, Truck, CheckCircle2, MapPin } from 'lucide-react';

export const STATUS_PENDING = 'pending';
export const STATUS_CONFIRMED = 'confirmed';
export const STATUS_PREPARING = 'preparing';
export const STATUS_READY = 'ready';
export const STATUS_IN_TRANSIT = 'in_transit';
export const STATUS_ARRIVED_AT_CUSTOMER = 'arrived_at_customer';
export const STATUS_DELIVERED = 'delivered';
export const STATUS_SERVED = 'served';
export const STATUS_CANCELLED = 'cancelled';
export const STATUS_REJECTED = 'rejected';

export const DELIVERY_STATUSES = [
  { 
    id: 0, 
    key: STATUS_PENDING, 
    label: 'En attente', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    allowedActors: ['admin'] 
  },
  { 
    id: 1, 
    key: STATUS_CONFIRMED, 
    label: 'Confirmée', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    allowedActors: ['admin'] 
  },
  { 
    id: 2, 
    key: STATUS_PREPARING, 
    label: 'En préparation', 
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: ChefHat,
    allowedActors: ['admin'] 
  },
  { 
    id: 3, 
    key: STATUS_READY, 
    label: 'Prête', 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Package,
    allowedActors: ['admin'] 
  },
  { 
    id: 4, 
    key: STATUS_IN_TRANSIT, 
    label: 'En livraison', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Truck,
    allowedActors: ['admin', 'livreur'] 
  },
  { 
    id: 5, 
    key: STATUS_ARRIVED_AT_CUSTOMER, 
    label: 'Arrivé chez client', 
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: MapPin,
    allowedActors: ['admin', 'livreur'] 
  },
  { 
    id: 6, 
    key: STATUS_DELIVERED, 
    label: 'Livrée', 
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: CheckCircle2,
    allowedActors: ['admin', 'livreur'] 
  },
  { 
    id: 7, 
    key: STATUS_CANCELLED, 
    label: 'Annulée', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: null,
    allowedActors: ['admin'] 
  },
  { 
    id: 8, 
    key: STATUS_REJECTED, 
    label: 'Refusée', 
    color: 'bg-red-50 text-red-900 border-red-100',
    icon: null,
    allowedActors: ['admin'] 
  }
];

// Unified flow for all orders
export const UNIFIED_ORDER_STATUSES = [STATUS_PENDING, STATUS_PREPARING, STATUS_READY, STATUS_SERVED, STATUS_DELIVERED];

export const isCounterOrder = (orderMethod) => orderMethod === 'counter';

export const getValidStatusesForOrder = () => {
  return UNIFIED_ORDER_STATUSES;
};

export const getNextStatusForOrder = (currentStatus) => {
  if (currentStatus === STATUS_CANCELLED) return null;
  
  const flow = [STATUS_PENDING, STATUS_PREPARING, STATUS_READY, STATUS_SERVED];
  const idx = flow.indexOf(currentStatus);
  
  if (idx !== -1 && idx < flow.length - 1) {
    return flow[idx + 1];
  }
  return null;
};

export const isValidTransition = (currentStatus, newStatus) => {
  if (newStatus === STATUS_CANCELLED) return true;
  if (currentStatus === newStatus) return true;
  
  const nextStatus = getNextStatusForOrder(currentStatus);
  return nextStatus === newStatus;
};

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const isValidPaymentStatus = (status) => {
  return Object.values(PAYMENT_STATUSES).includes(status);
};

export const getStatusIndex = (statusKey) => {
  if (statusKey === 'new') statusKey = STATUS_PENDING;
  const index = DELIVERY_STATUSES.findIndex(s => s.key === statusKey);
  return index;
};

export const getNextStatus = (currentStatusKey) => {
  if (currentStatusKey === 'new') currentStatusKey = STATUS_PENDING;
  const flow = [
    STATUS_PENDING,
    STATUS_CONFIRMED,
    STATUS_PREPARING,
    STATUS_READY,
    STATUS_IN_TRANSIT,
    STATUS_ARRIVED_AT_CUSTOMER,
    STATUS_DELIVERED
  ];
  const idx = flow.indexOf(currentStatusKey);
  if (idx !== -1 && idx < flow.length - 1) return flow[idx + 1];
  return null;
};

export const getActionLabel = (nextStatusKey) => {
  switch (nextStatusKey) {
    case STATUS_CONFIRMED: return 'Confirmer';
    case STATUS_PREPARING: return 'Lancer préparation';
    case STATUS_READY: return 'Marquer prête';
    case STATUS_IN_TRANSIT: return 'Démarrer livraison'; 
    case STATUS_ARRIVED_AT_CUSTOMER: return 'Je suis arrivé';
    case STATUS_DELIVERED: return 'Marquer livrée';
    case STATUS_SERVED: return 'Marquer servie';
    default: return 'Étape suivante';
  }
};

export const getDeliveryOrderStatusColor = (status) => {
  const statusConfig = DELIVERY_STATUSES.find(s => s.key === status);
  return statusConfig ? statusConfig.color : 'bg-gray-100 text-gray-800 border-gray-200';
};