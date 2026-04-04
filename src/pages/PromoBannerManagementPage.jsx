import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPromoBannerManager } from '@/components/AdminPromoBannerManager';

/**
 * PromoBannerManagementPage
 * 
 * A standalone admin page for managing promotional banners.
 * Removed all Tabs/TabsList/TabsTrigger components as per Task 1.
 * This page now functions as a dedicated module for banners.
 */
export const PromoBannerManagementPage = () => {
  return (
    <AdminLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Bannières Promotionnelles
          </h1>
          <p className="text-muted-foreground">
            Gérez l'affichage des promotions et des annonces visuelles sur la page d'accueil de l'application client.
          </p>
        </div>

        {/* 
          Direct rendering of the manager component.
          This component handles its own fetching, creating, editing, and deleting logic.
        */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-1 md:p-6 min-h-[500px]">
          <AdminPromoBannerManager />
        </div>
      </div>
    </AdminLayout>
  );
};

export default PromoBannerManagementPage;