import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminClientsContent } from '@/components/AdminClientsContent';

export const AdminClientsPage = () => {
  return (
    <AdminLayout>
      <div className="pb-12">
        <AdminClientsContent />
      </div>
    </AdminLayout>
  );
};

export default AdminClientsPage;