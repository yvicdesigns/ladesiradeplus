import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Eye, CheckCircle, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { CrashDetailModal } from './MobileAppModals';

export const CrashesTab = ({ crashes, acknowledgeCrash, markCrashFixed, deleteCrash }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCrash, setSelectedCrash] = useState(null);

    // Map system_alerts fields to crash fields for display
    // title -> error_message
    // affected_module -> app_version
    const filtered = crashes.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="flex items-center"><Input placeholder="Search error message..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} /></div>
            <Card>
                <Table>
                    <TableHeader><TableRow><TableHead>Error</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filtered.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="max-w-[300px] truncate font-mono text-xs">{c.title}</TableCell>
                                <TableCell>{c.affected_module || 'Unknown'}</TableCell>
                                <TableCell><Badge variant={c.status === 'new' ? 'destructive' : c.status === 'resolved' ? 'success' : 'outline'}>{c.status}</Badge></TableCell>
                                <TableCell className="text-sm">{formatDate(c.created_at)}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button size="icon" variant="ghost" onClick={() => setSelectedCrash(c)}><Eye className="w-4 h-4"/></Button>
                                    {c.status === 'new' && <Button size="icon" variant="ghost" onClick={() => acknowledgeCrash(c.id)} title="Acknowledge"><CheckCircle className="w-4 h-4 text-blue-500"/></Button>}
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCrash(c.id)}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
            <CrashDetailModal 
                open={!!selectedCrash} 
                onClose={() => setSelectedCrash(null)} 
                crash={selectedCrash}
                onResolve={markCrashFixed}
                onDelete={deleteCrash}
            />
        </div>
    );
};