import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, ArrowUpCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { VersionModal } from './MobileAppModals';
import { ConfirmationActionModal } from '@/components/notifications/NotificationModals';

export const VersionsTab = ({ versions, createVersion, updateVersion, publishVersion, deprecateVersion, deleteVersion }) => {
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null); // { type: 'create'|'edit'|'delete', data: null }

  const filtered = versions.filter(v => 
    (filterPlatform === 'all' || v.platform === filterPlatform) &&
    v.version_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
      switch(status) {
          case 'released': return 'bg-amber-100 text-amber-800';
          case 'beta': return 'bg-blue-100 text-blue-800';
          case 'deprecated': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <div className="flex gap-2">
            <Input placeholder="Search version..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} />
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Platforms</SelectItem><SelectItem value="ios">iOS</SelectItem><SelectItem value="android">Android</SelectItem></SelectContent>
            </Select>
         </div>
         <Button onClick={() => setModal({ type: 'create' })}><Plus className="w-4 h-4 mr-2" /> Create Version</Button>
      </div>

      <Card>
        <Table>
            <TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Platform</TableHead><TableHead>Status</TableHead><TableHead>Release Date</TableHead><TableHead>Min OS</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
                {filtered.map(v => (
                    <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.version_number} <span className="text-xs text-muted-foreground">({v.build_number})</span></TableCell>
                        <TableCell><Badge variant="outline">{v.platform}</Badge></TableCell>
                        <TableCell><Badge className={getStatusColor(v.status)} variant="secondary">{v.status}</Badge></TableCell>
                        <TableCell>{v.release_date ? formatDate(v.release_date) : '-'}</TableCell>
                        <TableCell>{v.min_os_version}</TableCell>
                        <TableCell className="text-right space-x-1">
                            {v.status === 'draft' && <Button size="icon" variant="ghost" onClick={() => publishVersion(v.id)} title="Publish"><ArrowUpCircle className="w-4 h-4 text-amber-600"/></Button>}
                            {v.status === 'released' && <Button size="icon" variant="ghost" onClick={() => deprecateVersion(v.id)} title="Deprecate"><XCircle className="w-4 h-4 text-red-600"/></Button>}
                            <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: v })}><Edit className="w-4 h-4"/></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModal({ type: 'delete', data: v })}><Trash2 className="w-4 h-4"/></Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
      </Card>

      <VersionModal 
        open={modal?.type === 'create' || modal?.type === 'edit'} 
        version={modal?.type === 'edit' ? modal.data : null}
        onClose={() => setModal(null)}
        onSave={(data) => modal?.type === 'edit' ? updateVersion(modal.data.id, data) : createVersion(data)}
      />

      <ConfirmationActionModal
         open={modal?.type === 'delete'}
         onClose={() => setModal(null)}
         title="Delete Version"
         description="Are you sure? This cannot be undone."
         onConfirm={() => deleteVersion(modal.data.id)}
         variant="destructive"
      />
    </div>
  );
};