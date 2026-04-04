import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useMobileApp } from '@/hooks/useMobileApp';
import { useMobileAppAnalytics } from '@/hooks/useMobileAppAnalytics';
import { Users, AlertTriangle, Send } from 'lucide-react';
import { ActiveUsersChart, PlatformDistributionChart } from '@/components/mobile-app/MobileAppCharts';
import { VersionsTab } from '@/components/mobile-app/VersionsTab';
import { PushNotificationsTab } from '@/components/mobile-app/PushNotificationsTab';
import { DevicesTab } from '@/components/mobile-app/DevicesTab';
import { CrashesTab } from '@/components/mobile-app/CrashesTab';
import { FeatureFlagsTab } from '@/components/mobile-app/FeatureFlagsTab';

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

export const AdminMobileAppPage = () => {
    const { 
        versions, createVersion, updateVersion, publishVersion, deprecateVersion, deleteVersion,
        pushes, createPush, updatePush, sendPush, duplicatePush, deletePush,
        devices, updateDeviceStatus, deleteDevice,
        crashes, acknowledgeCrash, markCrashFixed, deleteCrash,
        flags, createFeatureFlag, updateFeatureFlag, deleteFeatureFlag,
        analytics 
    } = useMobileApp();

    const stats = useMobileAppAnalytics();
    const [activeTab, setActiveTab] = useState('versions');

    const activeUsersData = analytics.sort((a,b) => new Date(a.date) - new Date(b.date)).slice(-30);
    const platformData = [
        { name: 'iOS', value: devices.filter(d => d.platform === 'ios').length },
        { name: 'Android', value: devices.filter(d => d.platform === 'android').length }
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestion App Mobile</h1>
                    <p className="text-muted-foreground">Gérez les versions de l'app, les notifications push et surveillez les performances.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPI title="Utilisateurs Actifs (Auj)" value={stats.activeUsersToday} icon={Users} color="text-blue-600" />
                    <KPI title="Nouveaux (Mois)" value={stats.newUsersThisMonth} icon={Users} color="text-amber-600" />
                    <KPI title="Crashes (Mois)" value={stats.crashesThisMonth} icon={AlertTriangle} color="text-red-600" />
                    <KPI title="Taux Ouv. Moyen" value={`${stats.averageOpenRate}%`} icon={Send} color="text-purple-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ActiveUsersChart data={activeUsersData} />
                    <div className="grid grid-cols-1 gap-6">
                         <PlatformDistributionChart data={platformData} />
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="versions">Versions</TabsTrigger>
                        <TabsTrigger value="push">Notifications Push</TabsTrigger>
                        <TabsTrigger value="devices">Appareils</TabsTrigger>
                        <TabsTrigger value="crashes">Crashes</TabsTrigger>
                        <TabsTrigger value="flags">Feature Flags</TabsTrigger>
                    </TabsList>
                    
                    <div className="mt-6">
                        <TabsContent value="versions">
                            <VersionsTab 
                                versions={versions} 
                                createVersion={createVersion} 
                                updateVersion={updateVersion} 
                                publishVersion={publishVersion} 
                                deprecateVersion={deprecateVersion}
                                deleteVersion={deleteVersion}
                            />
                        </TabsContent>
                        <TabsContent value="push">
                            <PushNotificationsTab 
                                pushes={pushes} 
                                createPush={createPush} 
                                updatePush={updatePush} 
                                sendPush={sendPush} 
                                duplicatePush={duplicatePush}
                                deletePush={deletePush}
                            />
                        </TabsContent>
                        <TabsContent value="devices">
                            <DevicesTab 
                                devices={devices} 
                                updateDeviceStatus={updateDeviceStatus} 
                                deleteDevice={deleteDevice} 
                            />
                        </TabsContent>
                        <TabsContent value="crashes">
                            <CrashesTab 
                                crashes={crashes} 
                                acknowledgeCrash={acknowledgeCrash} 
                                markCrashFixed={markCrashFixed} 
                                deleteCrash={deleteCrash} 
                            />
                        </TabsContent>
                        <TabsContent value="flags">
                            <FeatureFlagsTab 
                                flags={flags} 
                                createFlag={createFeatureFlag} 
                                updateFlag={updateFeatureFlag} 
                                deleteFlag={deleteFeatureFlag} 
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </AdminLayout>
    );
};

export default AdminMobileAppPage;