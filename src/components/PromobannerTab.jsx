import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdminPromoBannerManager } from '@/components/AdminPromoBannerManager';

export const PromobannerTab = () => {
  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
           <CardTitle>Bannières Promo</CardTitle>
           <CardDescription>Gérez les bannières promotionnelles visibles sur la page Menu.</CardDescription>
        </CardHeader>
        <CardContent>
            <AdminPromoBannerManager />
        </CardContent>
      </Card>
    </div>
  );
};