import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeliveries } from '@/hooks/useDeliveries';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

export const DeliveryAssignModal = ({ open, onClose, delivery }) => {
  const { assignDriver, loading } = useDeliveries();
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [vehicleType, setVehicleType] = useState('scooter');
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDrivers();
      if (delivery?.driver_id) {
        setSelectedDriverId(delivery.driver_id);
        setVehicleType(delivery.vehicle_type || 'scooter');
      }
    }
  }, [open, delivery]);

  const fetchDrivers = async () => {
    setFetchLoading(true);
    // In a real app we would query 'admin_users' or similar for drivers
    // Here we simulate fetching from profiles where role is potentially 'driver' or 'staff'
    // For this environment, we'll fetch profiles with appropriate roles
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, phone') // Ensure phone is in profile or join
      .in('role', ['driver', 'staff', 'admin']); // Assuming staff can also deliver for now
    
    // Map to a usable format
    setDrivers(data?.map(d => ({
      id: d.user_id,
      name: d.full_name || 'Unknown Driver',
      phone: d.phone || 'N/A'
    })) || []);
    setFetchLoading(false);
  };

  const handleSubmit = async () => {
    const driver = drivers.find(d => d.id === selectedDriverId);
    if (!driver) return;

    const success = await assignDriver(delivery.id, {
      ...driver,
      vehicle_type: vehicleType
    });

    if (success) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Select Driver</Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId} disabled={fetchLoading}>
              <SelectTrigger>
                <SelectValue placeholder={fetchLoading ? "Loading drivers..." : "Select a driver"} />
              </SelectTrigger>
              <SelectContent>
                {drivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scooter">Scooter</SelectItem>
                <SelectItem value="bike">Bike</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedDriverId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Driver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};