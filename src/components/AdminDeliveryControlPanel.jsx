import React, { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { DELIVERY_STATUSES, getStatusIndex } from '@/lib/deliveryConstants';
import { ShieldAlert, User, Truck, Monitor, Clock, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDateTime } from '@/lib/formatters';
import { DeliveryActionButtons } from '@/components/DeliveryActionButtons';

export const AdminDeliveryControlPanel = ({ order, onUpdateStatus, trackingHistory, loading }) => {
  
  if (!order) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500 h-64">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-500"/>
            <p>Chargement des détails de la livraison...</p>
        </div>
    );
  }

  const currentStatus = order.status || 'pending';
  const currentStatusIndex = getStatusIndex(currentStatus);

  // Filter only the main 6 statuses for the timeline
  const timelineStatuses = DELIVERY_STATUSES.filter(s => s.key !== 'cancelled' && s.key !== 'rejected');

  const handleUpdateStatus = (status) => {
      onUpdateStatus(status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="font-bold text-lg text-gray-900">Contrôle de Livraison</h3>
         <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border">
            <span className="flex items-center gap-1"><Monitor className="w-3 h-3 text-blue-600"/> Admin</span>
         </div>
      </div>

      <div className="relative z-10">
          <DeliveryActionButtons 
            order={order} 
            onUpdateStatus={handleUpdateStatus} 
            loading={loading}
            className="border-2 border-blue-50/50 shadow-lg ring-1 ring-black/5" 
          />
      </div>

      <Separator className="my-6" />

      <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100 shadow-inner">
        <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Clock className="w-4 h-4 text-primary" /> Historique & Suivi
        </h4>
        <ScrollArea className="h-[280px] pr-4 -mr-3">
            <div className="space-y-0 relative pl-2">
                <div className="absolute left-[5px] top-3 bottom-6 w-0.5 bg-gray-200" />

                {timelineStatuses.map((status, index) => {
                  const isPassed = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  
                  const historyItem = trackingHistory?.find(h => h.status === status.key);
                  const Icon = status.icon;

                  return (
                      <div key={status.key} className={`relative flex gap-4 pb-6 group ${!isPassed ? 'opacity-50 grayscale' : ''}`}>
                          <div className={`relative z-10 flex items-center justify-center w-6 h-6 mt-0.5 rounded-full border-2 transition-all duration-300
                              ${isPassed ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'}
                              ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                          `}>
                             <Icon className="w-3 h-3" />
                          </div>
                          
                          <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium leading-none ${isCurrent ? 'text-primary font-bold' : 'text-gray-700'}`}>
                                  {status.label}
                                </p>
                                {historyItem && (
                                  <span className="text-[10px] text-gray-400 font-mono bg-white px-1 rounded border">
                                    {formatDateTime(historyItem.timestamp).split(' ')[1]}
                                  </span>
                                )}
                              </div>
                              
                              {historyItem ? (
                                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                      <span className="text-gray-400">{formatDateTime(historyItem.timestamp)}</span>
                                  </div>
                              ) : (
                                  <p className="text-[11px] text-gray-400 mt-1 italic">
                                      {isCurrent ? 'En cours...' : 'À venir'}
                                  </p>
                              )}
                          </div>
                      </div>
                  );
                })}
            </div>
        </ScrollArea>
      </div>
    </div>
  );
};