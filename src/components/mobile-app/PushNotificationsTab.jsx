import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Send, Copy, Trash2, Edit } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { PushModal } from './MobileAppModals';
import { ConfirmationActionModal } from '@/components/notifications/NotificationModals';

export const PushNotificationsTab = ({ pushes, createPush, updatePush, sendPush, duplicatePush, deletePush }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null);

    const filtered = pushes.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const getStatusBadge = (status) => {
        const colors = { draft: 'bg-gray-200 text-gray-800', scheduled: 'bg-blue-100 text-blue-800', sent: 'bg-amber-100 text-amber-800', cancelled: 'bg-red-100 text-red-800' };
        return <Badge className={colors[status] || ''} variant="outline">{status}</Badge>;
    };

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                 <Input placeholder="Search push..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} />
                 <Button onClick={() => setModal({ type: 'create' })}><Plus className="w-4 h-4 mr-2" /> Create Push</Button>
             </div>
             <Card>
                 <Table>
                     <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Target</TableHead><TableHead>Status</TableHead><TableHead>Sent/Scheduled</TableHead><TableHead>Stats</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                     <TableBody>
                         {filtered.map(p => (
                             <TableRow key={p.id}>
                                 <TableCell>
                                     <div className="font-medium">{p.title}</div>
                                     <div className="text-xs text-muted-foreground truncate max-w-[200px]">{p.message}</div>
                                 </TableCell>
                                 <TableCell className="capitalize">{p.target_audience}</TableCell>
                                 <TableCell>{getStatusBadge(p.status)}</TableCell>
                                 <TableCell className="text-sm text-muted-foreground">{p.sent_date ? formatDate(p.sent_date) : (p.scheduled_date ? formatDate(p.scheduled_date) : '-')}</TableCell>
                                 <TableCell>
                                     {p.status === 'sent' ? (
                                         <div className="text-xs">
                                             <div>Sent: {p.sent_count}</div>
                                             <div className="text-amber-600">Open: {((p.open_count/p.sent_count)*100).toFixed(0)}%</div>
                                         </div>
                                     ) : '-'}
                                 </TableCell>
                                 <TableCell className="text-right space-x-1">
                                     {p.status === 'draft' && <Button size="icon" variant="ghost" onClick={() => sendPush(p.id)} title="Send Now"><Send className="w-4 h-4 text-blue-600"/></Button>}
                                     <Button size="icon" variant="ghost" onClick={() => duplicatePush(p)} title="Duplicate"><Copy className="w-4 h-4"/></Button>
                                     {p.status === 'draft' && <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: p })}><Edit className="w-4 h-4"/></Button>}
                                     <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModal({ type: 'delete', data: p })}><Trash2 className="w-4 h-4"/></Button>
                                 </TableCell>
                             </TableRow>
                         ))}
                     </TableBody>
                 </Table>
             </Card>
             
             <PushModal 
                open={modal?.type === 'create' || modal?.type === 'edit'}
                push={modal?.type === 'edit' ? modal.data : null}
                onClose={() => setModal(null)}
                onSave={(data) => modal?.type === 'edit' ? updatePush(modal.data.id, data) : createPush(data)}
             />
             <ConfirmationActionModal
                open={modal?.type === 'delete'}
                onClose={() => setModal(null)}
                title="Delete Push Notification"
                description="Are you sure?"
                onConfirm={() => deletePush(modal.data.id)}
                variant="destructive"
             />
        </div>
    );
};