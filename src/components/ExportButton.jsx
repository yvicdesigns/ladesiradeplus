import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Loader2, FileText, FileSpreadsheet, FileCode } from 'lucide-react';

const ExportButton = ({ onExport, loading = false, count = 0, disabled = false, className }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={disabled || loading || count === 0}
          className={`gap-2 ${className}`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>Exporter {count > 0 ? `(${count})` : ''}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('csv')} className="cursor-pointer gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Exporter en CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')} className="cursor-pointer gap-2">
          <FileText className="h-4 w-4" />
          <span>Exporter en PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('json')} className="cursor-pointer gap-2">
          <FileCode className="h-4 w-4" />
          <span>Exporter en JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;