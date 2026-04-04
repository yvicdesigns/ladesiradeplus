import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminDebugTab } from '@/components/AdminDebugTab';
import { useTranslation } from 'react-i18next';
import { Bug } from 'lucide-react';

export const AdminDebugPage = () => {
  const { t } = useTranslation();

  return (
    <AdminLayout
      title={t('admin.sidebar.debug_system', { defaultValue: 'Debug Système' })}
      subtitle={t('admin.debug.subtitle', { defaultValue: 'Outils de diagnostic et surveillance du système en temps réel' })}
      icon={Bug}
    >
      <AdminDebugTab />
    </AdminLayout>
  );
};

export default AdminDebugPage;