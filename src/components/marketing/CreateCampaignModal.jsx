import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export const CreateCampaignModal = ({ open, onClose, onCreate, templates = [] }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    target_audience: 'all',
    scheduled_date: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onCreate('email_campaigns', {
      ...formData,
      status: formData.scheduled_date ? 'scheduled' : 'draft'
    }, "Campaign created successfully");
    setLoading(false);
    onClose();
  };

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({ ...prev, content: template.content }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Email Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Campaign Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Summer Sale Announcement" />
          </div>
          
          <div className="space-y-2">
            <Label>Subject Line</Label>
            <Input value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required placeholder="e.g. 50% Off Everything!" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={formData.target_audience} onValueChange={val => setFormData({...formData, target_audience: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subscribers</SelectItem>
                    <SelectItem value="active">Active Subscribers Only</SelectItem>
                    <SelectItem value="customers">Past Customers</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Schedule (Optional)</Label>
                <Input type="datetime-local" value={formData.scheduled_date} onChange={e => setFormData({...formData, scheduled_date: e.target.value})} />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Use Template (Optional)</Label>
             <Select onValueChange={handleTemplateSelect}>
               <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
               <SelectContent>
                 {templates.map(t => (
                   <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>

          <div className="space-y-2">
            <Label>Email Content</Label>
            <Textarea 
              className="min-h-[200px] font-mono text-sm" 
              value={formData.content} 
              onChange={e => setFormData({...formData, content: e.target.value})} 
              required 
              placeholder="<html><body>...</body></html> or plain text"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} 
              {formData.scheduled_date ? 'Schedule Campaign' : 'Save Draft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};