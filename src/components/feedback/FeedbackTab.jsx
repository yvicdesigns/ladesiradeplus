import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/formatters';
import { MessageSquare, CheckCircle2, Trash2, Archive } from 'lucide-react';

export const FeedbackTab = ({ feedbacks, onResolve, onClose, onDelete }) => {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'new': return <Badge className="bg-blue-100 text-blue-800">Nouveau</Badge>;
      case 'in_review': return <Badge className="bg-amber-100 text-amber-800">En cours</Badge>;
      case 'resolved': return <Badge className="bg-amber-100 text-amber-800">Résolu</Badge>;
      case 'closed': return <Badge className="bg-gray-100 text-gray-800">Fermé</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="rounded-xl shadow-sm border-0 bg-white/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="w-[40%]">Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucun feedback trouvé</TableCell></TableRow>
            ) : (
              feedbacks.map((fb) => (
                <TableRow key={fb.id} className="group hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium">{fb.customers?.name || 'Inconnu'}</div>
                    <div className="text-xs text-muted-foreground">{fb.customers?.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{fb.feedback_categories?.name || 'Général'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{fb.subject}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{fb.message}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(fb.created_at)}</TableCell>
                  <TableCell>{getStatusBadge(fb.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {fb.status !== 'resolved' && (
                        <Button size="icon" variant="ghost" onClick={() => onResolve(fb.id)} title="Résoudre">
                          <CheckCircle2 className="w-4 h-4 text-amber-600"/>
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title="Répondre">
                        <MessageSquare className="w-4 h-4 text-blue-600"/>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(fb.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};