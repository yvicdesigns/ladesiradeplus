import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/formatters';
import { Loader2 } from 'lucide-react';

export const NotificationDetailModal = ({ open, onClose, notification, onDelete, onArchive }) => {
  if (!notification) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Notification Details 
            <Badge variant="outline">{notification.type}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <h3 className="text-lg font-semibold">{notification.title}</h3>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Message</Label>
            <p className="text-sm bg-muted p-3 rounded-md">{notification.message}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <div className="font-medium capitalize">{notification.priority}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date</Label>
              <div className="font-medium">{formatDate(notification.created_at)}</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="secondary" onClick={() => { onArchive(notification.id); onClose(); }}>Archive</Button>
          <Button variant="destructive" onClick={() => { onDelete(notification.id); onClose(); }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const AlertDetailModal = ({ open, onClose, alert, onAcknowledge, onResolve, onDelete }) => {
  const [notes, setNotes] = useState('');
  if (!alert) return null;

  const handleResolve = () => {
    onResolve(alert.id, notes);
    onClose();
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             System Alert
             <Badge className={alert.severity === 'critical' ? 'bg-red-500' : 'bg-blue-500'}>{alert.severity}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
           <div>
             <h3 className="text-xl font-bold">{alert.title}</h3>
             <p className="text-sm text-muted-foreground">Module: {alert.affected_module} | Status: {alert.status}</p>
           </div>
           <div className="bg-red-50 p-4 rounded-md border border-red-100 text-red-900">
             {alert.message}
           </div>
           
           {alert.status !== 'resolved' && (
             <div className="space-y-2">
               <Label>Resolution Notes</Label>
               <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes before resolving..." />
             </div>
           )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="destructive" onClick={() => { onDelete(alert.id); onClose(); }}>Delete</Button>
          {alert.status === 'active' && (
             <Button variant="outline" onClick={() => { onAcknowledge(alert.id); onClose(); }}>Acknowledge</Button>
          )}
          {alert.status !== 'resolved' && (
             <Button onClick={handleResolve}>Resolve</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const TemplateModal = ({ open, onClose, template, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: '', content: '', variables: '[]' });

  useEffect(() => {
    if (template) {
      setFormData({ 
        name: template.name, 
        subject: template.subject || '', 
        content: template.content, 
        variables: JSON.stringify(template.variables || [], null, 2) 
      });
    } else {
      setFormData({ name: '', subject: '', content: '', variables: '[]' });
    }
  }, [template, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let parsedVars = [];
    try {
      parsedVars = JSON.parse(formData.variables);
    } catch (e) {
      // Ignore or show error
    }
    await onSave({ ...formData, variables: parsedVars });
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Subject (Optional)</Label>
            <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="min-h-[150px]" required />
          </div>
          <div className="space-y-2">
            <Label>Variables (JSON Array)</Label>
            <Textarea value={formData.variables} onChange={e => setFormData({...formData, variables: e.target.value})} className="font-mono text-xs" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AlertHistoryModal = ({ open, onClose, history }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader><DialogTitle>Alert History</DialogTitle></DialogHeader>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead>Date</TableHead>
                 <TableHead>Action</TableHead>
                 <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history && history.length > 0 ? history.map(h => (
                <TableRow key={h.id}>
                  <TableCell className="text-xs">{formatDate(h.created_at)}</TableCell>
                  <TableCell className="capitalize font-medium">{h.action}</TableCell>
                  <TableCell className="text-sm">{h.notes}</TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={3} className="text-center">No history found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter>
           <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ConfirmationActionModal = ({ open, onClose, onConfirm, title, description, confirmText = "Confirm", variant = "default" }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};