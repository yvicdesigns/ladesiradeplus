import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { FeatureFlagModal } from './MobileAppModals';
import { ConfirmationActionModal } from '@/components/notifications/NotificationModals';

export const FeatureFlagsTab = ({ flags, createFlag, updateFlag, deleteFlag }) => {
    const [modal, setModal] = useState(null);

    return (
        <div className="space-y-4">
             <div className="flex justify-end"><Button onClick={() => setModal({ type: 'create' })}><Plus className="w-4 h-4 mr-2" /> Create Flag</Button></div>
             <Card>
                 <Table>
                     <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Platforms</TableHead><TableHead>Rollout</TableHead><TableHead>Enabled</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                     <TableBody>
                         {flags.map(f => (
                             <TableRow key={f.id}>
                                 <TableCell className="font-medium font-mono text-sm">{f.name}</TableCell>
                                 <TableCell className="text-muted-foreground">{f.description}</TableCell>
                                 <TableCell className="capitalize">{(Array.isArray(f.platforms) ? f.platforms : JSON.parse(f.platforms || '[]')).join(', ')}</TableCell>
                                 <TableCell>{f.rollout_percentage}%</TableCell>
                                 <TableCell>
                                     <Switch checked={f.enabled} onCheckedChange={(c) => updateFlag(f.id, { enabled: c })} />
                                 </TableCell>
                                 <TableCell className="text-right space-x-1">
                                     <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: f })}><Edit className="w-4 h-4"/></Button>
                                     <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModal({ type: 'delete', data: f })}><Trash2 className="w-4 h-4"/></Button>
                                 </TableCell>
                             </TableRow>
                         ))}
                     </TableBody>
                 </Table>
             </Card>
             <FeatureFlagModal 
                 open={modal?.type === 'create' || modal?.type === 'edit'}
                 flag={modal?.type === 'edit' ? modal.data : null}
                 onClose={() => setModal(null)}
                 onSave={(data) => modal?.type === 'edit' ? updateFlag(modal.data.id, data) : createFlag(data)}
             />
             <ConfirmationActionModal
                open={modal?.type === 'delete'}
                onClose={() => setModal(null)}
                title="Delete Flag"
                description="This will permanently delete the feature flag."
                onConfirm={() => deleteFlag(modal.data.id)}
                variant="destructive"
             />
        </div>
    );
};