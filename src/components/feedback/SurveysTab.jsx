import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/formatters';
import { Edit, Trash2, Eye, Plus, PlayCircle, StopCircle, Archive } from 'lucide-react';
import { motion } from 'framer-motion';

export const SurveysTab = ({ surveys, onCreate, onEdit, onDelete, onStatusChange }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-amber-100 text-amber-800';
      case 'closed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreate} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Plus className="w-4 h-4 mr-2"/> Créer sondage
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm border-0 bg-white/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Réponses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Aucun sondage trouvé</TableCell>
                </TableRow>
              ) : (
                surveys.map((survey) => (
                  <motion.tr 
                    key={survey.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-muted/50 transition-colors border-b last:border-0"
                  >
                    <TableCell className="font-medium">{survey.title}</TableCell>
                    <TableCell className="capitalize">{survey.type?.replace('_', ' ')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {survey.start_date ? formatDate(survey.start_date) : '-'} <br/>
                      {survey.end_date ? formatDate(survey.end_date) : ''}
                    </TableCell>
                    <TableCell>{survey.response_count || 0}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(survey.status)} variant="outline">
                        {survey.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {survey.status === 'draft' && (
                          <Button size="icon" variant="ghost" onClick={() => onStatusChange(survey.id, 'active')} title="Activer">
                            <PlayCircle className="w-4 h-4 text-amber-600"/>
                          </Button>
                        )}
                        {survey.status === 'active' && (
                          <Button size="icon" variant="ghost" onClick={() => onStatusChange(survey.id, 'closed')} title="Fermer">
                            <StopCircle className="w-4 h-4 text-blue-600"/>
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => onEdit(survey)}>
                          <Edit className="w-4 h-4 text-gray-600"/>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(survey.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4"/>
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};