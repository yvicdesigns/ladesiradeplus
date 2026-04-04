import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useCalendar = () => {
  const { toast } = useToast();

  // Subscriptions
  const { data: events, loading: loadingEvents } = useRealtimeSubscription('calendar_events');
  const { data: businessHours, loading: loadingBusinessHours } = useRealtimeSubscription('business_hours');
  const { data: specialHours, loading: loadingSpecialHours } = useRealtimeSubscription('special_hours');
  const { data: closures, loading: loadingClosures } = useRealtimeSubscription('closures');
  const { data: holidays, loading: loadingHolidays } = useRealtimeSubscription('holidays');
  const { data: attendees, loading: loadingAttendees } = useRealtimeSubscription('event_attendees');

  const genericAction = useCallback(async (action, successMessage) => {
    try {
      const result = await action();
      if (result.error) throw result.error;
      if (successMessage) toast({ title: "Success", description: successMessage });
      return result;
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Operation failed", variant: "destructive" });
      return { error };
    }
  }, [toast]);

  // --- Events ---
  const createEvent = (data) => genericAction(() => supabase.from('calendar_events').insert([data]).select().single(), "Event created");
  const updateEvent = (id, data) => genericAction(() => supabase.from('calendar_events').update({ ...data, updated_at: new Date() }).eq('id', id), "Event updated");
  const deleteEvent = (id) => genericAction(() => supabase.from('calendar_events').delete().eq('id', id), "Event deleted");
  const duplicateEvent = async (event) => {
    const { id, created_at, updated_at, ...rest } = event;
    return createEvent({ ...rest, title: `${rest.title} (Copy)` });
  };
  const updateEventStatus = (id, status) => updateEvent(id, { status });

  // --- Business Hours ---
  const updateBusinessHours = (id, data) => genericAction(() => supabase.from('business_hours').update({ ...data, updated_at: new Date() }).eq('id', id), "Business hours updated");
  // Helper to ensure all days exist (idempotent init could be done elsewhere, but useful to have access)
  const ensureBusinessHours = async () => {
      // Logic to insert default rows for 0-6 if not exist could go here if needed
  };

  // --- Special Hours ---
  const createSpecialHours = (data) => genericAction(() => supabase.from('special_hours').insert([data]), "Special hours added");
  const updateSpecialHours = (id, data) => genericAction(() => supabase.from('special_hours').update({ ...data, updated_at: new Date() }).eq('id', id), "Special hours updated");
  const deleteSpecialHours = (id) => genericAction(() => supabase.from('special_hours').delete().eq('id', id), "Special hours removed");

  // --- Closures ---
  const createClosure = (data) => genericAction(() => supabase.from('closures').insert([data]), "Closure added");
  const updateClosure = (id, data) => genericAction(() => supabase.from('closures').update({ ...data, updated_at: new Date() }).eq('id', id), "Closure updated");
  const deleteClosure = (id) => genericAction(() => supabase.from('closures').delete().eq('id', id), "Closure removed");

  // --- Holidays ---
  const createHoliday = (data) => genericAction(() => supabase.from('holidays').insert([data]), "Holiday added");
  const updateHoliday = (id, data) => genericAction(() => supabase.from('holidays').update({ ...data, updated_at: new Date() }).eq('id', id), "Holiday updated");
  const deleteHoliday = (id) => genericAction(() => supabase.from('holidays').delete().eq('id', id), "Holiday removed");

  // --- Attendees ---
  const addAttendee = (data) => genericAction(() => supabase.from('event_attendees').insert([data]), "Attendee added");
  const updateAttendeeStatus = (id, status) => genericAction(() => supabase.from('event_attendees').update({ status }).eq('id', id), "Status updated");
  const deleteAttendee = (id) => genericAction(() => supabase.from('event_attendees').delete().eq('id', id), "Attendee removed");

  return {
    events, loadingEvents, createEvent, updateEvent, deleteEvent, duplicateEvent, updateEventStatus,
    businessHours, loadingBusinessHours, updateBusinessHours, ensureBusinessHours,
    specialHours, loadingSpecialHours, createSpecialHours, updateSpecialHours, deleteSpecialHours,
    closures, loadingClosures, createClosure, updateClosure, deleteClosure,
    holidays, loadingHolidays, createHoliday, updateHoliday, deleteHoliday,
    attendees, loadingAttendees, addAttendee, updateAttendeeStatus, deleteAttendee
  };
};