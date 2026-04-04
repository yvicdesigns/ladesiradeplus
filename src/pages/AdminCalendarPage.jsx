import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCalendar } from '@/hooks/useCalendar';
import { CalendarKPIs } from '@/components/calendar/CalendarKPIs';
import { EventsByTypeChart, EventsByMonthChart, ParticipationTrendChart, EventStatusDistributionChart } from '@/components/calendar/CalendarCharts';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { EventsTab, BusinessHoursTab, ClosuresTab } from '@/components/calendar/CalendarTabs';
import { EventModal, EventDetailsModal } from '@/components/calendar/CalendarModals';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export const AdminCalendarPage = () => {
    const {
        events, createEvent, updateEvent, deleteEvent, duplicateEvent,
        businessHours, updateBusinessHours,
        closures, createClosure, updateClosure, deleteClosure,
        specialHours,
        loadingEvents
    } = useCalendar();

    const [modal, setModal] = useState(null); // { type, data }

    if (loadingEvents && !events.length) {
        return (
            <AdminLayout title="Calendrier" subtitle="Gérez vos plannings et événements.">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    // Metrics Calculation
    const now = new Date();
    const currentMonth = now.getMonth();
    const eventsThisMonth = events.filter(e => new Date(e.start_date).getMonth() === currentMonth).length;
    const completedEvents = events.filter(e => e.status === 'completed' && new Date(e.start_date).getMonth() === currentMonth).length;
    
    const upcomingEvents = events.filter(e => {
        const d = new Date(e.start_date);
        const diffTime = Math.abs(d - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return d >= now && diffDays <= 7;
    }).length;

    const metrics = {
        eventsThisMonth,
        upcomingEvents,
        totalParticipants: 120, // Mocked for now
        completedEvents,
        closedDays: closures.length, 
        specialHoursCount: specialHours.length,
        pendingReminders: 5,
        participationRate: 85
    };

    // Chart Data Preparation
    const eventsByTypeData = [
        { name: 'Réunion', value: events.filter(e => e.event_type === 'meeting').length },
        { name: 'Événement', value: events.filter(e => e.event_type === 'event').length },
        { name: 'Férié', value: events.filter(e => e.event_type === 'holiday').length },
        { name: 'Autre', value: events.filter(e => !['meeting', 'event', 'holiday'].includes(e.event_type)).length },
    ].filter(d => d.value > 0);

    const statusData = [
         { name: 'Prévu', value: events.filter(e => e.status === 'scheduled').length },
         { name: 'En cours', value: events.filter(e => e.status === 'ongoing').length },
         { name: 'Terminé', value: events.filter(e => e.status === 'completed').length },
         { name: 'Annulé', value: events.filter(e => e.status === 'cancelled').length },
    ].filter(d => d.value > 0);

    // Mock trend data
    const monthData = [
        { name: 'Jan', count: 12 }, { name: 'Fév', count: 19 }, { name: 'Mar', count: 3 }, { name: 'Avr', count: 5 }, { name: 'Mai', count: 2 }, 
    ];

    return (
        <AdminLayout
          title="Calendrier & Événements"
          subtitle="Gérez les plannings, événements, horaires d'ouverture et fermetures."
        >
            <div className="space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Calendrier & Événements</h1>
                    <p className="text-muted-foreground mt-2">Gérez les plannings, événements, horaires d'ouverture et fermetures.</p>
                </div>

                <CalendarKPIs metrics={metrics} />

                <Tabs defaultValue="calendar" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                        <TabsTrigger value="calendar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Vue Calendrier</TabsTrigger>
                        <TabsTrigger value="events" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Liste Événements</TabsTrigger>
                        <TabsTrigger value="hours" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Heures Ouverture</TabsTrigger>
                        <TabsTrigger value="closures" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Fermetures</TabsTrigger>
                        <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Analyses</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="calendar">
                            <CalendarGrid 
                                events={events}
                                closures={closures}
                                specialHours={specialHours}
                                onDateClick={(date) => setModal({ type: 'create', data: { start_date: format(date, 'yyyy-MM-dd') } })}
                                onEventClick={(event) => setModal({ type: 'details', data: event })}
                            />
                        </TabsContent>

                        <TabsContent value="events">
                            <EventsTab 
                                events={events}
                                createEvent={createEvent}
                                updateEvent={updateEvent}
                                deleteEvent={deleteEvent}
                                duplicateEvent={duplicateEvent}
                            />
                        </TabsContent>

                        <TabsContent value="hours">
                             <BusinessHoursTab hours={businessHours} updateHours={updateBusinessHours} />
                        </TabsContent>

                         <TabsContent value="closures">
                             <ClosuresTab 
                                closures={closures} 
                                createClosure={createClosure}
                                updateClosure={updateClosure}
                                deleteClosure={deleteClosure}
                             />
                        </TabsContent>

                        <TabsContent value="analytics">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                                <EventsByTypeChart data={eventsByTypeData} />
                                <EventStatusDistributionChart data={statusData} />
                                <EventsByMonthChart data={monthData} />
                                <ParticipationTrendChart data={[{date: '1', participants: 10}, {date: '5', participants: 25}, {date: '10', participants: 15}]} />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Shared Modals mounted at page level for calendar interactions */}
                <EventModal 
                    open={modal?.type === 'create' || modal?.type === 'edit'}
                    event={modal?.type === 'edit' ? modal.data : (modal?.type === 'create' ? { start_date: modal.data?.start_date, end_date: modal.data?.start_date } : null)}
                    onClose={() => setModal(null)}
                    onSave={data => modal?.type === 'edit' ? updateEvent(modal.data.id, data) : createEvent(data)}
                />
                <EventDetailsModal
                    open={modal?.type === 'details'}
                    event={modal?.data}
                    onClose={() => setModal(null)}
                />

            </div>
        </AdminLayout>
    );
};

export default AdminCalendarPage;