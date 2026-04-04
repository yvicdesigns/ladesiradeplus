import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

// Helper for forms
const FormField = ({ label, children }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

export const VersionModal = ({ open, onClose, version, onSave }) => {
  const [formData, setFormData] = useState({ version_number: '', platform: 'ios', changelog: '', min_os_version: '', download_url: '', build_number: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (version) setFormData({ ...version });
    else setFormData({ version_number: '', platform: 'ios', changelog: '', min_os_version: '', download_url: '', build_number: '' });
  }, [version, open]);

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
        <DialogHeader><DialogTitle>{version ? 'Edit Version' : 'Create New Version'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Version Number"><Input value={formData.version_number} onChange={e => setFormData({...formData, version_number: e.target.value})} required placeholder="1.0.0" /></FormField>
             <FormField label="Build Number"><Input value={formData.build_number} onChange={e => setFormData({...formData, build_number: e.target.value})} placeholder="1024" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Platform">
               <Select value={formData.platform} onValueChange={v => setFormData({...formData, platform: v})}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent><SelectItem value="ios">iOS</SelectItem><SelectItem value="android">Android</SelectItem></SelectContent>
               </Select>
             </FormField>
             <FormField label="Min OS Version"><Input value={formData.min_os_version} onChange={e => setFormData({...formData, min_os_version: e.target.value})} placeholder="15.0" /></FormField>
          </div>
          <FormField label="Download URL"><Input value={formData.download_url} onChange={e => setFormData({...formData, download_url: e.target.value})} /></FormField>
          <FormField label="Changelog"><Textarea value={formData.changelog} onChange={e => setFormData({...formData, changelog: e.target.value})} className="h-24" /></FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const PushModal = ({ open, onClose, push, onSave }) => {
  const [formData, setFormData] = useState({ title: '', message: '', target_audience: 'all', action_url: '', image_url: '', scheduled_date: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (push) setFormData({ 
      title: push.title, 
      message: push.message, 
      target_audience: push.target_audience || 'all', 
      action_url: push.action_url || '', 
      image_url: push.image_url || '',
      scheduled_date: push.scheduled_date ? new Date(push.scheduled_date).toISOString().slice(0, 16) : ''
    });
    else setFormData({ title: '', message: '', target_audience: 'all', action_url: '', image_url: '', scheduled_date: '' });
  }, [push, open]);

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
        <DialogHeader><DialogTitle>{push ? 'Edit Push Notification' : 'Create Push Notification'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <FormField label="Title"><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></FormField>
          <FormField label="Message"><Textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required /></FormField>
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Target Audience">
               <Select value={formData.target_audience} onValueChange={v => setFormData({...formData, target_audience: v})}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="ios">iOS Users</SelectItem>
                    <SelectItem value="android">Android Users</SelectItem>
                    <SelectItem value="inactive">Inactive Users</SelectItem>
                 </SelectContent>
               </Select>
             </FormField>
             <FormField label="Schedule (Optional)"><Input type="datetime-local" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} /></FormField>
          </div>
          <FormField label="Action URL"><Input value={formData.action_url} onChange={e => setFormData({...formData, action_url: e.target.value})} placeholder="myapp://screen" /></FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const FeatureFlagModal = ({ open, onClose, flag, onSave }) => {
  const [formData, setFormData] = useState({ name: '', description: '', enabled: false, platforms: ['ios', 'android'], rollout_percentage: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (flag) {
        setFormData({ ...flag, platforms: Array.isArray(flag.platforms) ? flag.platforms : JSON.parse(flag.platforms || '[]') });
    } else {
        setFormData({ name: '', description: '', enabled: false, platforms: ['ios', 'android'], rollout_percentage: 0 });
    }
  }, [flag, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  const togglePlatform = (p) => {
      const newPlatforms = formData.platforms.includes(p) 
        ? formData.platforms.filter(plat => plat !== p)
        : [...formData.platforms, p];
      setFormData({ ...formData, platforms: newPlatforms });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>{flag ? 'Edit Feature Flag' : 'Create Feature Flag'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <FormField label="Name"><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="new_checkout_flow" /></FormField>
          <FormField label="Description"><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></FormField>
          <div className="flex items-center space-x-2 py-2">
              <Switch checked={formData.enabled} onCheckedChange={c => setFormData({...formData, enabled: c})} />
              <Label>Enabled Globally</Label>
          </div>
          <FormField label="Target Platforms">
             <div className="flex gap-4">
                 <div className="flex items-center space-x-2"><Switch checked={formData.platforms.includes('ios')} onCheckedChange={() => togglePlatform('ios')} /> <Label>iOS</Label></div>
                 <div className="flex items-center space-x-2"><Switch checked={formData.platforms.includes('android')} onCheckedChange={() => togglePlatform('android')} /> <Label>Android</Label></div>
             </div>
          </FormField>
          <FormField label={`Rollout Percentage (${formData.rollout_percentage}%)`}>
             <Input type="number" min="0" max="100" value={formData.rollout_percentage} onChange={e => setFormData({...formData, rollout_percentage: parseInt(e.target.value)})} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CrashDetailModal = ({ open, onClose, crash, onResolve, onDelete }) => {
    if (!crash) return null;
    // Map system_alerts fields to crash fields
    const displayCrash = {
        ...crash,
        error_message: crash.title,
        stack_trace: crash.message,
        app_version: crash.affected_module,
        device_id: 'N/A' // system_alerts doesn't have device_id
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Crash Details <Badge variant={displayCrash.status === 'resolved' ? 'default' : 'destructive'}>{displayCrash.status}</Badge>
                    </DialogTitle>
                    <DialogDescription>{formatDate(displayCrash.created_at)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>App Version:</strong> {displayCrash.app_version}</div>
                        <div><strong>Device ID:</strong> {displayCrash.device_id}</div>
                    </div>
                    <div className="bg-muted p-4 rounded-md">
                        <Label>Error Message</Label>
                        <p className="font-mono text-sm text-red-600 break-all">{displayCrash.error_message}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-md">
                         <Label>Stack Trace</Label>
                         <pre className="text-xs font-mono overflow-x-auto p-2 whitespace-pre-wrap">{displayCrash.stack_trace}</pre>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button variant="destructive" onClick={() => { onDelete(displayCrash.id); onClose(); }}>Delete</Button>
                    {displayCrash.status !== 'resolved' && (
                        <Button onClick={() => { onResolve(displayCrash.id); onClose(); }}>Mark as Fixed</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};