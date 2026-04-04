import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Settings, 
  MapPin, 
  Users, 
  FileText, 
  QrCode, 
  MoreVertical,
  Download,
  Printer,
  RefreshCw
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const TableCard = ({ 
  table, 
  onEdit, 
  onDelete, 
  onChangeStatus, 
  onView, 
  onOpenQR 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-amber-500 hover:bg-green-600';
      case 'occupied': return 'bg-red-500 hover:bg-red-600';
      case 'reserved': return 'bg-blue-500 hover:bg-blue-600';
      case 'maintenance': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full flex flex-col hover:shadow-xl transition-shadow border-border overflow-hidden group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Table {table.table_number}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(table.status)} text-white border-0 capitalize shadow-sm`}>
              {table.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 pt-4 space-y-3 cursor-pointer relative" onClick={() => onView(table)}>
          <div className="flex justify-between items-start">
             <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  <span><span className="font-semibold text-foreground">{table.capacity}</span> Seats</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4 text-primary" />
                  <span><span className="font-semibold text-foreground">{table.location || 'N/A'}</span></span>
                </div>
             </div>
             
             {/* QR Preview */}
             <div 
               className="h-14 w-14 bg-white p-1 rounded-lg border border-border shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
               onClick={(e) => {
                 e.stopPropagation();
                 onOpenQR(table);
               }}
               title="View QR Code"
             >
               {table.qr_code ? (
                 <img src={table.qr_code} alt="QR" className="h-full w-full object-contain" />
               ) : (
                 <QrCode className="h-8 w-8 text-muted-foreground/50" />
               )}
             </div>
          </div>

          {table.notes && (
            <div className="flex items-start text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded-md">
              <FileText className="mr-2 h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="line-clamp-2 text-xs">{table.notes}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-border p-2 bg-muted/10 flex justify-between gap-1">
          <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs font-medium" onClick={() => onChangeStatus(table)}>
            <Settings className="h-3.5 w-3.5 mr-1.5" /> Status
          </Button>
          
          <div className="w-px h-4 bg-border self-center" />
          
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" onClick={() => onEdit(table)} title="Edit">
              <Edit className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" title="More Options">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Table Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenQR(table)}>
                  <QrCode className="mr-2 h-4 w-4" /> View QR Code
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(table)} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Table
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};