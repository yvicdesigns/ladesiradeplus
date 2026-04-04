import React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Helmet } from 'react-helmet';
import { MessageSquare } from 'lucide-react';

export const AdminMessagePage = () => {
  return (
    <AdminLayout>
      <Helmet>
        <title>Messages - Admin</title>
        <meta name="description" content="Gestion des messages administrateur" />
      </Helmet>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messagerie</h1>
          <p className="text-muted-foreground">Gérez vos communications avec les clients.</p>
        </div>

        <Card className="border-dashed border-2">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Messages Management</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <p className="text-muted-foreground">
              Message management page coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMessagePage;