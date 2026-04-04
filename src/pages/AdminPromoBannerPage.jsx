import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPromoBannerManager } from '@/components/AdminPromoBannerManager';

export const AdminPromoBannerPage = () => {
  return (
    <AdminLayout>
      <div className="pb-12">
        <AdminPromoBannerManager />
      </div>
    </AdminLayout>
  );
};

export default AdminPromoBannerPage;