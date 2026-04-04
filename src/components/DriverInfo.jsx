import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Star } from 'lucide-react';

export const DriverInfo = ({ driverName, driverPhone, vehicleType, status }) => {
  // Only show if driver is assigned
  const showDriver = ['driver_assigned', 'in_transit', 'driver_arrived', 'delivered'].includes(status);

  if (!showDriver) return null;

  const handleWhatsApp = () => {
    if (driverPhone) {
      window.open(`https://wa.me/${driverPhone.replace(/\D/g, '')}`, '_blank');
    }
  };

  const handleCall = () => {
    if (driverPhone) {
      window.location.href = `tel:${driverPhone}`;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${driverName || 'driver'}`} />
          <AvatarFallback>DR</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-bold text-sm text-gray-900">{driverName || 'Livreur'}</h4>
          <p className="text-xs text-gray-500 capitalize">{vehicleType || 'Scooter'}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-medium">4.8</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="icon" variant="outline" className="rounded-full h-10 w-10 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-green-100" onClick={handleWhatsApp}>
          <MessageCircle className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="outline" className="rounded-full h-10 w-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100" onClick={handleCall}>
          <Phone className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};