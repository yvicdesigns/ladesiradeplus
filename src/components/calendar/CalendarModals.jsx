import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const FormField = ({ label, children }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

export const EventModal = ({ open, onClose, event, onSave }) => {
  const [formData, setFormData] = useState({ title: '', description: '', event_type: 'meeting', start_date: '', start_time: '09:00', end_date: '', end_time: '10:00', location: '', color: '#3b82f6', is_all_day: false, reminder_enabled: false, reminder_time: 30, status: 'scheduled' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        start_date: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : '',
        end_date: event.end_date ? new Date(event.end_date).toISOString().split('T')[0] : '',
        start_time: event.start_time ? event.start_time.substring(0, 5) : '09:00',
        end_time: event.end_time ? event.end_time.substring(0, 5) : '10:00',
      });
    } else {
        const today = new Date().toISOString().split('T')[0];
        setFormData({ title: '', description: '', event_type: 'meeting', start_date: today, start_time: '09:00', end_date: today, end_time: '10:00', location: '', color: '#3b82f6', is_all_day: false, reminder_enabled: false, reminder_time: 30, status: 'scheduled' });
    }
  }, [event, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <FormField label="Title"><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></FormField>
          
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Type">
                <Select value={formData.event_type} onValueChange={v => setFormData({...formData, event_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="closure">Closure</SelectItem>
                  </SelectContent>
                </Select>
             </FormField>
             <FormField label="Status">
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
             </FormField>
          </div>

          <div className="flex items-center space-x-2">
             <Switch checked={formData.is_all_day} onCheckedChange={v => setFormData({...formData, is_all_day: v})} />
             <Label>All Day Event</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <FormField label="Start Date"><Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required /></FormField>
             {!formData.is_all_day && <FormField label="Start Time"><Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} /></FormField>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <FormField label="End Date"><Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required /></FormField>
             {!formData.is_all_day && <FormField label="End Time"><Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} /></FormField>}
          </div>

          <FormField label="Location"><Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></FormField>
          <FormField label="Description"><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const BusinessHoursModal = ({ open, onClose, hours, onSave }) => {
  const [formData, setFormData] = useState({ 
    opening_time: '09:00', 
    closing_time: '17:00', 
    is_open: true, 
    break_start: '', 
    break_end: '' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hours) {
      setFormData({
        opening_time: hours.opening_time ? hours.opening_time.substring(0, 5) : '09:00',
        closing_time: hours.closing_time ? hours.closing_time.substring(0, 5) : '17:00',
        is_open: hours.is_open ?? true,
        break_start: hours.break_start ? hours.break_start.substring(0, 5) : '',
        break_end: hours.break_end ? hours.break_end.substring(0, 5) : ''
      });
    }
  }, [hours, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Business Hours</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={formData.is_open} 
              onCheckedChange={v => setFormData({...formData, is_open: v})} 
            />
            <Label>Is Open</Label>
          </div>

          {formData.is_open && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Opening Time">
                  <Input 
                    type="time" 
                    value={formData.opening_time} 
                    onChange={e => setFormData({...formData, opening_time: e.target.value})} 
                    required 
                  />
                </FormField>
                <FormField label="Closing Time">
                  <Input 
                    type="time" 
                    value={formData.closing_time} 
                    onChange={e => setFormData({...formData, closing_time: e.target.value})} 
                    required 
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Break Start">
                  <Input 
                    type="time" 
                    value={formData.break_start} 
                    onChange={e => setFormData({...formData, break_start: e.target.value})} 
                  />
                </FormField>
                <FormField label="Break End">
                  <Input 
                    type="time" 
                    value={formData.break_end} 
                    onChange={e => setFormData({...formData, break_end: e.target.value})} 
                  />
                </FormField>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ClosureModal = ({ open, onClose, closure, onSave }) => {
  const [formData, setFormData] = useState({ 
    reason: '', 
    type: 'temporary', 
    start_date: '', 
    end_date: '', 
    status: 'scheduled' 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (closure) {
      setFormData({
        reason: closure.reason || '',
        type: closure.type || 'temporary',
        start_date: closure.start_date ? new Date(closure.start_date).toISOString().split('T')[0] : '',
        end_date: closure.end_date ? new Date(closure.end_date).toISOString().split('T')[0] : '',
        status: closure.status || 'scheduled'
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({ 
        reason: '', 
        type: 'temporary', 
        start_date: today, 
        end_date: today, 
        status: 'scheduled' 
      });
    }
  }, [closure, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{closure ? 'Edit Closure' : 'Add Closure'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <FormField label="Reason">
            <Input 
              value={formData.reason} 
              onChange={e => setFormData({...formData, reason: e.target.value})} 
              placeholder="e.g., Renovation, Holiday, Emergency"
              required 
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type">
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input 
                type="date" 
                value={formData.start_date} 
                onChange={e => setFormData({...formData, start_date: e.target.value})} 
                required 
              />
            </FormField>
            <FormField label="End Date">
              <Input 
                type="date" 
                value={formData.end_date} 
                onChange={e => setFormData({...formData, end_date: e.target.value})} 
                required 
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const EventDetailsModal = ({ open, onClose, event }) => {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Type</Label>
              <p className="font-medium">{event.event_type}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Status</Label>
              <Badge variant="outline">{event.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Start Date</Label>
              <p className="font-medium">{format(new Date(event.start_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">End Date</Label>
              <p className="font-medium">{format(new Date(event.end_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          {!event.is_all_day && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Start Time</Label>
                <p className="font-medium">{event.start_time?.substring(0, 5)}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">End Time</Label>
                <p className="font-medium">{event.end_time?.substring(0, 5)}</p>
              </div>
            </div>
          )}

          {event.location && (
            <div>
              <Label className="text-xs text-gray-500">Location</Label>
              <p className="font-medium">{event.location}</p>
            </div>
          )}

          {event.description && (
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <p className="text-sm">{event.description}</p>
            </div>
          )}

          {event.is_all_day && (
            <div>
              <Badge variant="secondary">All Day Event</Badge>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};