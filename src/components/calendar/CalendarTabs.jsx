import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Copy, Filter, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ConfirmationActionModal } from '@/components/notifications/NotificationModals';
import { EventModal, BusinessHoursModal, ClosureModal, EventDetailsModal } from './CalendarModals';

// --- Shared ---
const StatusBadge = ({ status }) => {
    const colors = { scheduled: 'bg-blue-100 text-blue-800', ongoing: 'bg-amber-100 text-amber-800', completed: 'bg-gray-100 text-gray-800', cancelled: 'bg-red-100 text-red-800', active: 'bg-amber-100 text-amber-800', upcoming: 'bg-amber-100 text-amber-800' };
    return <Badge className={colors[status] || ''} variant="outline">{status}</Badge>;
};

// --- Events Tab ---
export const EventsTab = ({ events, createEvent, updateEvent, deleteEvent, duplicateEvent }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null);

    const filtered = events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                 <Input placeholder="Search events..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} />
                 <Button onClick={() => setModal({ type: 'create' })}><Plus className="w-4 h-4 mr-2" /> New Event</Button>
            </div>
            <Card>
                <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filtered.map(e => (
                            <TableRow key={e.id}>
                                <TableCell className="font-medium">{e.title}</TableCell>
                                <TableCell><Badge variant="outline">{e.event_type}</Badge></TableCell>
                                <TableCell>{format(parseISO(e.start_date), 'MMM d, yyyy')} {e.is_all_day ? '' : e.start_time?.substring(0,5)}</TableCell>
                                <TableCell>{format(parseISO(e.end_date), 'MMM d, yyyy')} {e.is_all_day ? '' : e.end_time?.substring(0,5)}</TableCell>
                                <TableCell><StatusBadge status={e.status} /></TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'details', data: e })}><CalendarDays className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" onClick={() => duplicateEvent(e)}><Copy className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: e })}><Edit className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModal({ type: 'delete', data: e })}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <EventModal
                open={modal?.type === 'create' || modal?.type === 'edit'}
                event={modal?.type === 'edit' ? modal.data : null}
                onClose={() => setModal(null)}
                onSave={data => modal?.type === 'edit' ? updateEvent(modal.data.id, data) : createEvent(data)}
            />
            <EventDetailsModal
                open={modal?.type === 'details'}
                onClose={() => setModal(null)}
                event={modal?.data}
            />
            <ConfirmationActionModal
                open={modal?.type === 'delete'}
                onClose={() => setModal(null)}
                title="Delete Event"
                onConfirm={() => deleteEvent(modal.data.id)}
                variant="destructive"
            />
        </div>
    );
};

// --- Business Hours Tab ---
export const BusinessHoursTab = ({ hours, updateHours }) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const [modal, setModal] = useState(null);

    // Sort by day index 0-6
    const sortedHours = [...hours].sort((a,b) => a.day_of_week - b.day_of_week);

    return (
        <div className="space-y-4">
             <Card>
                <Table>
                    <TableHeader><TableRow><TableHead>Jour</TableHead><TableHead>Statut</TableHead><TableHead>Horaires</TableHead><TableHead>Pause</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {sortedHours.map(h => (
                            <TableRow key={h.id} className={!h.is_open ? 'opacity-50' : ''}>
                                <TableCell className="font-semibold">{days[h.day_of_week]}</TableCell>
                                <TableCell>
                                    <Badge variant={h.is_open ? 'default' : 'secondary'}>{h.is_open ? 'Ouvert' : 'Fermé'}</Badge>
                                </TableCell>
                                <TableCell>{h.is_open ? `${h.opening_time?.substring(0,5)} – ${h.closing_time?.substring(0,5)}` : '—'}</TableCell>
                                <TableCell>{h.break_start ? `${h.break_start?.substring(0,5)} – ${h.break_end?.substring(0,5)}` : '—'}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: h })}><Edit className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
            <BusinessHoursModal
                open={modal?.type === 'edit'}
                hours={modal?.data}
                onClose={() => setModal(null)}
                onSave={data => updateHours(modal.data.id, data)}
            />
        </div>
    );
};

// --- Closures Tab ---
export const ClosuresTab = ({ closures, createClosure, updateClosure, deleteClosure }) => {
    const [modal, setModal] = useState(null);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                 <Button onClick={() => setModal({ type: 'create' })}><Plus className="w-4 h-4 mr-2" /> Ajouter une fermeture</Button>
            </div>
            <Card>
                <Table>
                    <TableHeader><TableRow><TableHead>Motif</TableHead><TableHead>Type</TableHead><TableHead>Date début</TableHead><TableHead>Date fin</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {closures.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.reason}</TableCell>
                                <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                                <TableCell>{format(parseISO(c.start_date), 'MMM d, yyyy')}</TableCell>
                                <TableCell>{format(parseISO(c.end_date), 'MMM d, yyyy')}</TableCell>
                                <TableCell><StatusBadge status={c.status} /></TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: c })}><Edit className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModal({ type: 'delete', data: c })}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
            <ClosureModal
                open={modal?.type === 'create' || modal?.type === 'edit'}
                closure={modal?.type === 'edit' ? modal.data : null}
                onClose={() => setModal(null)}
                onSave={data => modal?.type === 'edit' ? updateClosure(modal.data.id, data) : createClosure(data)}
            />
            <ConfirmationActionModal
                open={modal?.type === 'delete'}
                onClose={() => setModal(null)}
                title="Delete Closure"
                onConfirm={() => deleteClosure(modal.data.id)}
                variant="destructive"
            />
        </div>
    );
};