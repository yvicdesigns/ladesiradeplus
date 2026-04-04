import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Smartphone, Trash2, Power, PowerOff } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export const DevicesTab = ({ devices, updateDeviceStatus, deleteDevice }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = devices.filter(d => 
        (d.device_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        d.device_id.includes(searchTerm)
    );

    return (
        <div className="space-y-4">
             <div className="flex items-center"><Input placeholder="Search devices..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} /></div>
             <Card>
                 <Table>
                     <TableHeader><TableRow><TableHead>Device Name</TableHead><TableHead>Platform</TableHead><TableHead>OS</TableHead><TableHead>App Version</TableHead><TableHead>Status</TableHead><TableHead>Last Active</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                     <TableBody>
                         {filtered.map(d => (
                             <TableRow key={d.id}>
                                 <TableCell className="font-medium flex items-center gap-2"><Smartphone className="w-4 h-4 text-muted-foreground"/> {d.device_name || 'Unknown'}</TableCell>
                                 <TableCell className="capitalize">{d.platform}</TableCell>
                                 <TableCell>{d.os_version}</TableCell>
                                 <TableCell>{d.app_version}</TableCell>
                                 <TableCell><Badge variant={d.is_active ? 'success' : 'secondary'}>{d.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                                 <TableCell className="text-sm text-muted-foreground">{formatDate(d.last_active)}</TableCell>
                                 <TableCell className="text-right space-x-1">
                                     <Button size="icon" variant="ghost" onClick={() => updateDeviceStatus(d.id, !d.is_active)}>
                                         {d.is_active ? <PowerOff className="w-4 h-4 text-amber-500" /> : <Power className="w-4 h-4 text-amber-500" />}
                                     </Button>
                                     <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteDevice(d.id)}><Trash2 className="w-4 h-4"/></Button>
                                 </TableCell>
                             </TableRow>
                         ))}
                     </TableBody>
                 </Table>
             </Card>
        </div>
    );
};