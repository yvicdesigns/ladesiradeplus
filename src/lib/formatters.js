import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  STATUS_PENDING, 
  STATUS_CONFIRMED, 
  STATUS_PREPARING, 
  STATUS_READY, 
  STATUS_IN_TRANSIT, 
  STATUS_ARRIVED_AT_CUSTOMER,
  STATUS_DELIVERED,
  STATUS_SERVED,
  STATUS_CANCELLED,
  STATUS_REJECTED,
  DELIVERY_STATUSES
} from './deliveryConstants';

export const ORDER_STATUSES = {
  PENDING: STATUS_PENDING,
  CONFIRMED: STATUS_CONFIRMED,
  PREPARING: STATUS_PREPARING,
  READY: STATUS_READY,
  IN_TRANSIT: STATUS_IN_TRANSIT,
  ARRIVED_AT_CUSTOMER: STATUS_ARRIVED_AT_CUSTOMER,
  DELIVERED: STATUS_DELIVERED,
  SERVED: STATUS_SERVED,
  CANCELLED: STATUS_CANCELLED,
  REJECTED: STATUS_REJECTED
};

export const isValidOrderStatus = (status) => {
  return Object.values(ORDER_STATUSES).includes(status);
};

export const formatCurrency = (amount) => {
  const value = amount || 0;
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0
  }).format(value) + ' XAF';
};

// Alias for formatCurrency to ensure consistency across the codebase
export const formatPrice = formatCurrency;

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'PPp', { locale: fr });
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'PP', { locale: fr });
};

export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  if (timeString.includes('T') || timeString.includes('-')) {
     return format(new Date(timeString), 'p', { locale: fr });
  }
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return format(date, 'p', { locale: fr });
};

export const formatDeliveryStatusFR = (status) => {
  if (status === STATUS_DELIVERED) return 'Commande Complétée';
  if (status === STATUS_PENDING) return 'En Attente';
  if (status === STATUS_CONFIRMED) return 'Confirmée';
  if (status === STATUS_PREPARING) return 'En Préparation';
  if (status === STATUS_READY) return 'Prête pour Expédition';
  if (status === STATUS_IN_TRANSIT) return 'En Route';
  if (status === STATUS_ARRIVED_AT_CUSTOMER) return 'Livreur Arrivé';
  if (status === STATUS_CANCELLED) return 'Annulée';
  if (status === STATUS_REJECTED) return 'Rejetée';
  
  const statusObj = DELIVERY_STATUSES.find(s => s.key === status);
  return statusObj ? statusObj.label : status || 'Inconnu';
};

export const formatDeliveryStatus = (status) => {
  if (!status) return 'Unknown';
  return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const formatReservationStatus = (status) => {
  if (!status) return '';
  switch(status.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmed': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getDeliveryStatusColor = (status) => {
  const statusObj = DELIVERY_STATUSES.find(s => s.key === status);
  return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800';
};

export const getDeliveryStatusBadgeVariant = (status) => {
  switch(status) {
    case STATUS_PENDING:
    case STATUS_REJECTED: return 'destructive';
    case STATUS_CONFIRMED: 
    case STATUS_PREPARING: return 'secondary';
    case STATUS_READY: 
    case STATUS_IN_TRANSIT: return 'default';
    case STATUS_ARRIVED_AT_CUSTOMER: return 'default';
    case STATUS_DELIVERED: return 'success';
    case STATUS_CANCELLED: return 'outline';
    default: return 'outline';
  }
};

export const formatOrderStatus = getDeliveryStatusColor;

export const formatPaymentMethod = (method) => {
  if (!method) return 'Non Spécifié';
  switch (method.toLowerCase()) {
    case 'cash':
    case 'table_payment':
      return 'Paiement à la Table';
    case 'cash_on_delivery':
      return 'Paiement à la Livraison';
    case 'cash_register':
      return 'Paiement en Caisse';
    case 'mobile_money':
      return 'Mobile Money';
    case 'card':
      return 'Carte Bancaire';
    default:
      return method.charAt(0).toUpperCase() + method.slice(1);
  }
};

export const getPaymentMethodColor = (method) => {
   if (!method) return 'bg-gray-100 text-gray-800 border-gray-200';
   switch (method.toLowerCase()) {
     case 'cash':
     case 'cash_on_delivery':
     case 'table_payment':
     case 'cash_register':
       return 'bg-amber-100 text-amber-800 border-amber-200';
     case 'mobile_money':
     case 'card':
       return 'bg-blue-100 text-blue-800 border-blue-200';
     default:
       return 'bg-gray-100 text-gray-800 border-gray-200';
   }
};

export const getPaymentStatusColor = (status) => {
  if (!status) return 'text-gray-600';
  switch (status.toLowerCase()) {
    case 'paid':
    case 'confirmed':
      return 'text-amber-600';
    case 'pending':
    case 'unpaid':
      return 'text-yellow-600';
    case 'failed':
    case 'rejected':
      return 'text-red-600';
    case 'refunded':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

export const formatRestaurantOrderStatus = (status) => {
  if (!status) return 'Inconnu';
  switch(status.toLowerCase()) {
    case 'pending': return 'En Attente';
    case 'preparing': return 'En Préparation'; 
    case 'ready': return 'Prêt à Servir';
    case 'served': return 'Servie'; 
    case 'delivered': return 'Livrée';
    case 'completed': return 'Terminé';
    case 'cancelled': return 'Annulée';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const getRestaurantOrderStatusColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  switch(status.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'served':
    case 'delivered':
    case 'completed': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const formatTableInfo = (tableNumber) => {
  return tableNumber ? `Table ${tableNumber}` : 'Commande À Emporter';
};

export const getOrderMethodLabel = (method) => {
  if (!method) return 'Non Spécifié';
  switch(method.toLowerCase()) {
    case 'counter': return 'Au Comptoir';
    case 'online': return 'En Ligne';
    case 'dine_in': return 'Sur Place';
    case 'takeaway': return 'À Emporter';
    case 'qr_code': return 'QR Code';
    default: return method.charAt(0).toUpperCase() + method.slice(1);
  }
};

export const getValidActionsForOrderMethod = (orderMethod, currentStatus) => {
  const safeOrderMethod = orderMethod || 'unknown';
  const isCounter = safeOrderMethod.toLowerCase() === 'counter';
  const actions = [];
  
  if (currentStatus === 'pending') {
    if (isCounter) {
      // Counter orders: accept directly to served, or reject
      actions.push({ action: 'confirmed', label: 'Accepter', className: 'bg-green-600 hover:bg-green-700 text-white', isAccept: true });
    } else {
      // All other orders: must be accepted (confirmed) before work begins
      actions.push({ action: 'confirmed', label: 'Accepter', className: 'bg-green-600 hover:bg-green-700 text-white', isAccept: true });
    }
    actions.push({ action: 'rejected', label: 'Refuser', className: 'bg-red-600 hover:bg-red-700 text-white', isReject: true });
    return actions; // Only Accept/Reject for pending — no cancel button shown
  } else if (currentStatus === 'confirmed') {
    if (isCounter) {
      actions.push({ action: 'served', label: 'Marquer comme Servie', className: 'bg-green-600 hover:bg-green-700 text-white' });
    } else {
      actions.push({ action: 'preparing', label: 'Lancer Préparation', className: 'bg-blue-600 hover:bg-blue-700 text-white' });
    }
  } else if (currentStatus === 'preparing') {
    actions.push({ action: 'ready', label: 'Marquer Prête', className: 'bg-purple-600 hover:bg-purple-700 text-white' });
  } else if (currentStatus === 'ready') {
    actions.push({ action: 'served', label: 'Marquer comme Servie', className: 'bg-green-600 hover:bg-green-700 text-white' });
  }

  if (!['cancelled', 'served', 'delivered'].includes(currentStatus)) {
    actions.push({ action: 'cancelled', label: 'Annuler', className: 'text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent border-none shadow-none', isCancel: true });
  }

  return actions;
};