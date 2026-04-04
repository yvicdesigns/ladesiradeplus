import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminOrdersPanel } from '../components/AdminOrdersPanel';

const AdminOrdersPage = () => {
  return (
    <AdminLayout>
      <AdminOrdersPanel />
    </AdminLayout>
  );
};

export default AdminOrdersPage;