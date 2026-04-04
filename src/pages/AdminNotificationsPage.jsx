import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Bell, AlertTriangle, Settings, FileText, CheckCircle, Search, Trash2, Eye, Archive, Check } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { 
  NotificationsByTypeChart, AlertsBySeverityChart 
} from '@/components/notifications/NotificationCharts';
import { 
  NotificationDetailModal, AlertDetailModal, TemplateModal, ConfirmationActionModal 
} from '@/components/notifications/NotificationModals';

const KPI = ({ title, value, icon: Icon, color }) => (
  <Card>
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </CardContent>
  </Card>
);

export const AdminNotificationsPage = () => {
  const { user } = useAuth();
  const { 
    notifications, alerts, templates, alertHistory,
    markAsRead, markAsUnread, archiveNotification, deleteNotification, markAllAsRead, archiveAll,
    acknowledgeAlert, resolveAlert, deleteAlert,
    createTemplate, updateTemplate, deleteTemplate, applyTemplate,
    getPreferences, savePreferences
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('center');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [modals, setModals] = useState({
    notifDetail: false,
    alertDetail: false,
    template: false,
    confirm: null
  });

  const [prefs, setPrefs] = useState({
    email_enabled: true, sms_enabled: false, push_enabled: true,
    notification_types: { order: true, system: true },
    quiet_hours_start: '', quiet_hours_end: '', notification_frequency: 'immediate'
  });

  useEffect(() => {
    const loadPreferences = async () => {
      if (user && activeTab === 'preferences') {
        try {
          const data = await getPreferences(user.id);
          if (data) {
            setPrefs(prev => ({
              ...prev,
              ...data,
              notification_types: { ...prev.notification_types, ...(data.notification_types || {}) }
            }));
          }
        } catch (error) {
          console.error("Failed to load preferences:", error);
        }
      }
    };
    loadPreferences();
  }, [user, activeTab, getPreferences]);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
  
  const typeData = Object.entries(notifications.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {}))
    .map(([name, value]) => ({ name, value }));
  
  const severityData = Object.entries(alerts.reduce((acc, a) => { acc[a.severity] = (acc[a.severity] || 0) + 1; return acc; }, {}))
    .map(([name, value]) => ({ name, value }));

  const handleTemplateSave = (data) => {
    if (selectedTemplate) updateTemplate(selectedTemplate.id, data);
    else createTemplate(data);
  };

  const getStatusColor = (status) => {
    if (status === 'unread') return 'bg-blue-100 text-blue-800';
    if (status === 'read') return 'bg-gray-100 text-gray-800';
    return 'bg-black text-white';
  };

  const getTypeColor = (type) => {
    const colors = { order: 'blue', payment: 'green', delivery: 'orange', review: 'yellow', feedback: 'pink', inventory: 'red', system: 'gray', marketing: 'purple', user: 'cyan' };
    const color = colors[type] || 'gray';
    return `bg-${color}-100 text-${color}-800`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
           <h1 className="text-2xl font-bold tracking-tight">Centre de Notifications</h1>
           <p className="text-muted-foreground">Gérez les alertes système, notifications utilisateur et modèles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <KPI title="Notifications Non Lues" value={unreadCount} icon={Bell} color="text-blue-600" />
           <KPI title="Alertes Actives" value={activeAlerts} icon={AlertTriangle} color="text-amber-600" />
           <KPI title="Alertes Critiques" value={criticalAlerts} icon={AlertTriangle} color="text-red-600" />
           <KPI title="Taux de Lecture" value="85%" icon={CheckCircle} color="text-amber-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card>
             <CardContent className="p-4">
               <h3 className="text-sm font-semibold mb-4">Notifications par Type</h3>
               <NotificationsByTypeChart data={typeData} />
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-4">
               <h3 className="text-sm font-semibold mb-4">Sévérité des Alertes</h3>
               <AlertsBySeverityChart data={severityData} />
             </CardContent>
           </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
             <TabsTrigger value="center">Centre de Notifications</TabsTrigger>
             <TabsTrigger value="alerts">Alertes Système</TabsTrigger>
             <TabsTrigger value="preferences">Préférences</TabsTrigger>
             <TabsTrigger value="templates">Modèles</TabsTrigger>
             <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
             {/* NOTIFICATIONS CENTER */}
             <TabsContent value="center" className="space-y-4">
               <div className="flex justify-between items-center">
                 <div className="flex gap-2">
                   <Input placeholder="Rechercher..." className="w-64" icon={Search} />
                   <Select defaultValue="all"><SelectTrigger className="w-32"><SelectValue placeholder="Statut"/></SelectTrigger><SelectContent><SelectItem value="all">Tous</SelectItem><SelectItem value="unread">Non Lu</SelectItem></SelectContent></Select>
                 </div>
                 <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={markAllAsRead}>Tout marquer lu</Button>
                   <Button variant="outline" size="sm" onClick={archiveAll}>Tout archiver</Button>
                 </div>
               </div>
               <Card>
                 <Table>
                   <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Titre</TableHead><TableHead>Priorité</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                   <TableBody>
                     {notifications.map(n => (
                       <TableRow key={n.id} className={n.status === 'unread' ? 'font-bold' : ''}>
                         <TableCell><Badge className={getTypeColor(n.type)} variant="outline">{n.type}</Badge></TableCell>
                         <TableCell>
                           <div>{n.title}</div>
                           <div className="text-xs text-muted-foreground truncate max-w-xs">{n.message}</div>
                         </TableCell>
                         <TableCell><Badge variant="secondary">{n.priority}</Badge></TableCell>
                         <TableCell className="text-sm text-muted-foreground">{formatDate(n.created_at)}</TableCell>
                         <TableCell><Badge className={getStatusColor(n.status)}>{n.status}</Badge></TableCell>
                         <TableCell className="text-right space-x-1">
                           <Button size="icon" variant="ghost" onClick={() => { setSelectedNotification(n); setModals({...modals, notifDetail: true}); }}><Eye className="w-4 h-4"/></Button>
                           <Button size="icon" variant="ghost" onClick={() => n.status === 'unread' ? markAsRead(n.id) : markAsUnread(n.id)}>{n.status === 'unread' ? <Check className="w-4 h-4"/> : <div className="w-2 h-2 rounded-full bg-blue-500"/>}</Button>
                           <Button size="icon" variant="ghost" onClick={() => archiveNotification(n.id)}><Archive className="w-4 h-4"/></Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </Card>
             </TabsContent>

             {/* SYSTEM ALERTS */}
             <TabsContent value="alerts" className="space-y-4">
                <Card>
                  <Table>
                    <TableHeader><TableRow><TableHead>Sévérité</TableHead><TableHead>Titre</TableHead><TableHead>Module</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {alerts.map(a => (
                        <TableRow key={a.id}>
                          <TableCell><Badge className={a.severity === 'critical' ? 'bg-red-500' : a.severity === 'error' ? 'bg-amber-500' : 'bg-blue-500'}>{a.severity}</Badge></TableCell>
                          <TableCell>{a.title}</TableCell>
                          <TableCell>{a.affected_module}</TableCell>
                          <TableCell><Badge variant="outline">{a.status}</Badge></TableCell>
                          <TableCell className="text-sm">{formatDate(a.created_at)}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="icon" variant="ghost" onClick={() => { setSelectedAlert(a); setModals({...modals, alertDetail: true}); }}><Eye className="w-4 h-4"/></Button>
                            {a.status === 'active' && <Button size="icon" variant="ghost" className="text-amber-600" onClick={() => acknowledgeAlert(a.id)}><Check className="w-4 h-4"/></Button>}
                            <Button size="icon" variant="ghost" className="text-red-500" onClick={() => setModals({...modals, confirm: { type: 'deleteAlert', id: a.id }})}><Trash2 className="w-4 h-4"/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
             </TabsContent>

             {/* PREFERENCES */}
             <TabsContent value="preferences">
               <Card>
                 <CardContent className="p-6 space-y-6">
                   <div className="grid grid-cols-3 gap-6">
                     <div className="flex items-center space-x-2"><Switch checked={prefs.email_enabled} onCheckedChange={c => setPrefs({...prefs, email_enabled: c})} /> <Label>Notifs Email</Label></div>
                     <div className="flex items-center space-x-2"><Switch checked={prefs.sms_enabled} onCheckedChange={c => setPrefs({...prefs, sms_enabled: c})} /> <Label>Notifs SMS</Label></div>
                     <div className="flex items-center space-x-2"><Switch checked={prefs.push_enabled} onCheckedChange={c => setPrefs({...prefs, push_enabled: c})} /> <Label>Notifs Push</Label></div>
                   </div>
                   <div className="space-y-2">
                     <Label>Types de Notification</Label>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {['order', 'payment', 'delivery', 'review', 'feedback', 'inventory', 'system', 'marketing', 'user'].map(type => (
                         <div key={type} className="flex items-center space-x-2">
                           <Checkbox checked={prefs.notification_types?.[type] || false} onCheckedChange={c => setPrefs({...prefs, notification_types: {...prefs.notification_types, [type]: c}})} />
                           <Label className="capitalize">{type}</Label>
                         </div>
                       ))}
                     </div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div><Label>Début Heures Silencieuses</Label><Input type="time" value={prefs.quiet_hours_start || ''} onChange={e => setPrefs({...prefs, quiet_hours_start: e.target.value})} /></div>
                      <div><Label>Fin Heures Silencieuses</Label><Input type="time" value={prefs.quiet_hours_end || ''} onChange={e => setPrefs({...prefs, quiet_hours_end: e.target.value})} /></div>
                      <div>
                        <Label>Fréquence</Label>
                        <Select value={prefs.notification_frequency} onValueChange={v => setPrefs({...prefs, notification_frequency: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="immediate">Immédiat</SelectItem><SelectItem value="daily_digest">Digest Quotidien</SelectItem></SelectContent>
                        </Select>
                      </div>
                   </div>
                   <Button onClick={() => savePreferences(user.id, prefs)}>Enregistrer</Button>
                 </CardContent>
               </Card>
             </TabsContent>
             
             {/* TEMPLATES */}
             <TabsContent value="templates">
               <div className="flex justify-end mb-4"><Button onClick={() => { setSelectedTemplate(null); setModals({...modals, template: true}); }}>Créer Modèle</Button></div>
               <Card>
                 <Table>
                   <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Sujet</TableHead><TableHead>Variables</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                   <TableBody>
                     {templates.map(t => (
                       <TableRow key={t.id}>
                         <TableCell className="font-medium">{t.name}</TableCell>
                         <TableCell>{t.subject || '-'}</TableCell>
                         <TableCell className="font-mono text-xs">{JSON.stringify(t.variables)}</TableCell>
                         <TableCell className="text-right space-x-1">
                           <Button size="icon" variant="ghost" onClick={() => applyTemplate(t, user.id)} title="Tester"><FileText className="w-4 h-4"/></Button>
                           <Button size="icon" variant="ghost" onClick={() => { setSelectedTemplate(t); setModals({...modals, template: true}); }}><Settings className="w-4 h-4"/></Button>
                           <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModals({...modals, confirm: { type: 'deleteTemplate', id: t.id }})}><Trash2 className="w-4 h-4"/></Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </Card>
             </TabsContent>

             {/* HISTORY */}
             <TabsContent value="history">
               <Card>
                 <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Alert ID</TableHead><TableHead>Action</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {alertHistory.map(h => (
                        <TableRow key={h.id}>
                          <TableCell>{formatDate(h.created_at)}</TableCell>
                          <TableCell className="font-mono text-xs">{h.alert_id}</TableCell>
                          <TableCell><Badge variant="outline">{h.action}</Badge></TableCell>
                          <TableCell>{h.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                 </Table>
               </Card>
             </TabsContent>
          </div>
        </Tabs>

        {/* Modals */}
        <NotificationDetailModal 
          open={modals.notifDetail} 
          onClose={() => setModals({...modals, notifDetail: false})} 
          notification={selectedNotification}
          onArchive={archiveNotification}
          onDelete={deleteNotification}
        />
        <AlertDetailModal
          open={modals.alertDetail}
          onClose={() => setModals({...modals, alertDetail: false})}
          alert={selectedAlert}
          onAcknowledge={(id) => acknowledgeAlert(id, user.id)}
          onResolve={resolveAlert}
          onDelete={deleteAlert}
        />
        <TemplateModal 
          open={modals.template}
          onClose={() => setModals({...modals, template: false})}
          template={selectedTemplate}
          onSave={handleTemplateSave}
        />
        <ConfirmationActionModal 
          open={!!modals.confirm}
          onClose={() => setModals({...modals, confirm: null})}
          title="Confirmer"
          description="Êtes-vous sûr de vouloir continuer ? Cette action est irréversible."
          variant="destructive"
          onConfirm={() => {
             if (modals.confirm?.type === 'deleteAlert') deleteAlert(modals.confirm.id);
             if (modals.confirm?.type === 'deleteTemplate') deleteTemplate(modals.confirm.id);
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminNotificationsPage;