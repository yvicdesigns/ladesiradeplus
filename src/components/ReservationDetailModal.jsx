import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, User, Phone, Mail, FileText, X } from 'lucide-react';
import { formatDateTime, formatReservationStatus } from '@/lib/formatters';

export const ReservationDetailModal = ({ open, onClose, reservation, onEdit, onConfirm, onCancel }) => {
  if (!reservation) return null;

  const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="p-2 bg-primary/10 rounded-md">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-foreground mt-0.5">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card text-foreground border-border overflow-hidden">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              Reservation Details
            </DialogTitle>
             <Badge className={`px-3 py-1 text-sm ${formatReservationStatus(reservation.status)}`}>
              {reservation.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">ID: #{reservation.id.slice(0, 8)}</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <DetailItem icon={User} label="Customer Name" value={reservation.customer_name} />
          <DetailItem icon={Mail} label="Email" value={reservation.customer_email} />
          <DetailItem icon={Phone} label="Phone" value={reservation.customer_phone} />
          <DetailItem icon={Users} label="Party Size" value={`${reservation.party_size} Guests`} />
          <DetailItem icon={Calendar} label="Date" value={reservation.reservation_date} />
          <DetailItem icon={Clock} label="Time" value={reservation.reservation_time} />
          <div className="md:col-span-2">
            <DetailItem icon={FileText} label="Special Requests" value={reservation.notes || 'None'} />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose} className="sm:mr-auto">
            Close
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="secondary" onClick={() => onEdit(reservation)} className="flex-1 sm:flex-none">
              Edit
            </Button>
            {reservation.status === 'pending' && (
              <Button onClick={() => onConfirm(reservation)} className="bg-primary text-white flex-1 sm:flex-none">
                Confirm
              </Button>
            )}
            {reservation.status !== 'cancelled' && (
              <Button variant="destructive" onClick={() => onCancel(reservation)} className="flex-1 sm:flex-none">
                Cancel
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};