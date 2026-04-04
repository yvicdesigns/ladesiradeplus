import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminUsersTab } from '@/components/AdminUsersTab';

const AdminUsersPage = () => {
  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs & Permissions</h1>
          <p className="text-muted-foreground">
            Gérez les comptes administratifs et les accès du personnel.
          </p>
        </div>
        <AdminUsersTab />
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;