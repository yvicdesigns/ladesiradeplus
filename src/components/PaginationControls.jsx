import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  itemsPerPage,
  onItemsPerPageChange,
  loading = false,
  className
}) => {
  const [goToPage, setGoToPage] = useState(String(currentPage));

  useEffect(() => {
    setGoToPage(String(currentPage));
  }, [currentPage]);

  const handleGoToPage = (e) => {
    e.preventDefault();
    const page = parseInt(goToPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setGoToPage(String(currentPage));
    }
  };

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className={cn("flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-2", className)}>
      <div className="flex flex-col sm:flex-row items-center gap-2 order-1 md:order-1 w-full md:w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Afficher</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
            disabled={loading}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground whitespace-nowrap">par page</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground order-2 md:order-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span>
            Affichage de <span className="font-medium text-foreground">{startItem}</span> à <span className="font-medium text-foreground">{endItem}</span> sur <span className="font-medium text-foreground">{totalCount}</span> résultats
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 order-3 md:order-3 w-full md:w-auto">
        <div className="flex items-center gap-1 bg-background border rounded-md p-1 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading || totalCount === 0}
          >
            <ChevronLeft className="h-3 w-3 mr-1" /> Précédent
          </Button>

          <div className="flex items-center gap-2 mx-2">
            <span className="text-sm font-medium whitespace-nowrap">
              Page {currentPage} sur {totalPages || 1}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading || totalCount === 0}
          >
            Suivant <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};