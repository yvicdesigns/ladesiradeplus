import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getDeliveryStatusColor, formatDateTime, formatDeliveryStatus } from '@/lib/formatters';
import { MapPin, Phone, User, Calendar, Truck, Clock, StickyNote, Trash2, Edit, AlertCircle } from 'lucide-react';
import { useDeliveries } from '@/hooks/useDeliveries';
import { DeliveryNoteModal } from './DeliveryNoteModal';
import { DeliveryAssignModal } from './DeliveryAssignModal';
import { DeliveryStatusModal } from './DeliveryStatusModal';
import { ConfirmationDeleteModal } from './ConfirmationDeleteModal';

export const DeliveryDetailModal = ({ delivery, open, onClose, onEdit }) => {
  const { getDeliveryById, loading } = useDeliveries();
  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [error, setError] = useState(null);
  
  // Sub-modals
  const [showAssign, setShowAssign] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (open && delivery?.id) {
      loadDetails();
    }
  }, [open, delivery]);

  const loadDetails = async () => {
    setError(null);
    const data = await getDeliveryById(delivery.id);
    if (data) {
        setDetails(data);
    } else {
        // Fallback: if we can't find the delivery record, we might be looking at a delivery_order
        // that hasn't been synced to deliveries table yet.
        setDetails(delivery); // Show what we have
        setError("Delivery record not fully initialized. Some tracking features may be unavailable.");
    }
  };

  if (!delivery) return null;

  // Use details if available, otherwise fallback to prop
  const displayData = details || delivery;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="p-6 pb-2">
            <DialogHeader className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    Delivery #{displayData.tracking_number || 'PENDING'}
                    <Badge className={getDeliveryStatusColor(displayData.status)}>
                      {formatDeliveryStatus(displayData.status)}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Order ID: {displayData.order_id ? `#${displayData.order_id.slice(0,8)}` : 'Manual Entry'}
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => onEdit(displayData)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {error && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm flex items-center gap-2 mb-4">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Information</TabsTrigger>
                <TabsTrigger value="history">Tracking History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1 p-6 pt-2">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Customer Section */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
                    <User className="h-4 w-4" /> Customer Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Name</p>
                      <p className="font-medium">{displayData.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {displayData.customer_phone}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs">Address</p>
                      <p className="font-medium flex items-start gap-1">
                        <MapPin className="h-3 w-3 mt-1 shrink-0" /> 
                        {displayData.customer_address}, {displayData.customer_city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Driver Section */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
                    <Truck className="h-4 w-4" /> Driver Information
                  </h3>
                  {displayData.driver_id ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Driver Name</p>
                        <p className="font-medium">{displayData.driver_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Vehicle</p>
                        <p className="font-medium capitalize">{displayData.vehicle_type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Contact</p>
                        <p className="font-medium">{displayData.driver_phone}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm mb-2">No driver assigned yet</p>
                      <Button size="sm" onClick={() => setShowAssign(true)} disabled={!!error}>Assign Driver</Button>
                    </div>
                  )}
                </div>

                {/* Schedule & Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
                      <Calendar className="h-4 w-4" /> Schedule
                    </h3>
                    <div className="text-sm">
                       <p className="text-muted-foreground text-xs">Delivery Date</p>
                       <p className="font-medium">{displayData.delivery_date}</p>
                       <p className="text-muted-foreground text-xs mt-2">Time Window</p>
                       <p className="font-medium">{displayData.delivery_time}</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
                      <StickyNote className="h-4 w-4" /> Notes
                    </h3>
                    <p className="text-sm text-muted-foreground italic">
                      {displayData.notes || "No special instructions."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                 <div className="flex justify-end mb-2">
                    <Button size="sm" variant="outline" onClick={() => setShowNote(true)} disabled={!!error}>
                       + Add Note
                    </Button>
                 </div>
                 <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-4">
                   {details?.delivery_tracking?.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map((track, i) => (
                     <div key={track.id} className="relative pl-6">
                       <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-background ${i === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                       <div className="flex flex-col gap-1">
                         <span className="text-xs text-muted-foreground font-mono">
                           {formatDateTime(track.created_at)}
                         </span>
                         <span className="font-semibold text-sm capitalize flex items-center gap-2">
                           {formatDeliveryStatus(track.status)}
                           {track.location && <Badge variant="outline" className="text-[10px] h-5">{track.location}</Badge>}
                         </span>
                         {track.notes && (
                           <p className="text-sm bg-muted/30 p-2 rounded mt-1 border border-border/50">
                             {track.notes}
                           </p>
                         )}
                       </div>
                     </div>
                   ))}
                   {(!details?.delivery_tracking || details.delivery_tracking.length === 0) && (
                     <div className="pl-6 text-sm text-muted-foreground">No tracking history available.</div>
                   )}
                 </div>
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t bg-background flex justify-between gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowAssign(true)} disabled={!!error}>
              {displayData.driver_id ? 'Reassign Driver' : 'Assign Driver'}
            </Button>
            <Button className="flex-1" onClick={() => setShowStatus(true)} disabled={!!error}>
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {details && (
          <>
            <DeliveryAssignModal 
                open={showAssign} 
                onClose={() => { setShowAssign(false); loadDetails(); }} 
                delivery={details}
            />
            <DeliveryStatusModal 
                open={showStatus} 
                onClose={() => { setShowStatus(false); loadDetails(); }} 
                delivery={details}
            />
            <DeliveryNoteModal 
                open={showNote} 
                onClose={() => { setShowNote(false); loadDetails(); }} 
                delivery={details}
            />
            <ConfirmationDeleteModal 
                open={showDelete}
                onClose={() => setShowDelete(false)}
                item={details}
                type="delivery"
                onConfirm={onClose} 
            />
          </>
      )}
    </>
  );
};