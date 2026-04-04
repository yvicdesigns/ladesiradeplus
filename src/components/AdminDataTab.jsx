import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteAccountConfirmationModal } from '@/components/DeleteAccountConfirmationModal';
import { Download, Trash2, FileText, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const AdminDataTab = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your data is being prepared and will download shortly.",
    });
    // Mock export functionality
    setTimeout(() => {
       const element = document.createElement("a");
       const file = new Blob(["name,email,role\nadmin,admin@example.com,owner"], {type: 'text/csv'});
       element.href = URL.createObjectURL(file);
       element.download = "restaurant_data.csv";
       document.body.appendChild(element); // Required for this to work in FireFox
       element.click();
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Download a copy of your restaurant data.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-amber-100 dark:bg-green-900 rounded-full text-amber-600 dark:text-green-300">
                    <Download className="h-5 w-5" />
                 </div>
                 <div>
                    <h4 className="font-medium">Export CSV</h4>
                    <p className="text-sm text-muted-foreground">Includes orders, menu items, and customer list.</p>
                 </div>
              </div>
              <Button variant="outline" onClick={handleExport}>Download</Button>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal & Privacy</CardTitle>
          <CardDescription>Review your agreements and policies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
           <Button variant="link" className="px-0 h-auto text-primary flex items-center gap-2">
              <FileText className="h-4 w-4" /> Privacy Policy <ExternalLink className="h-3 w-3" />
           </Button>
           <Button variant="link" className="px-0 h-auto text-primary flex items-center gap-2">
              <FileText className="h-4 w-4" /> Terms of Service <ExternalLink className="h-3 w-3" />
           </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          <CardDescription>Permanent actions for your account.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between p-4 border border-red-100 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full text-red-600 dark:text-red-300">
                    <Trash2 className="h-5 w-5" />
                 </div>
                 <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">Delete Account</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">Permanently remove your account and all data.</p>
                 </div>
              </div>
              <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>Delete Account</Button>
           </div>
        </CardContent>
      </Card>

      <DeleteAccountConfirmationModal 
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};