import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SearchBar = ({
  value,
  onChange,
  onClear,
  resultCount,
  placeholder = "Rechercher...",
  className,
  loading = false,
  debounceTime = 300
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  // Handle external value changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      if (value !== localValue) {
        onChange(localValue);
      }
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [localValue, onChange, debounceTime, value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div className={cn("relative w-full sm:w-72 group", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
      
      <Input
        placeholder={placeholder}
        className="pl-9 pr-12 transition-all border-muted focus:border-primary focus:ring-1 focus:ring-primary/20"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />

      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </motion.div>
          )}
          
          {localValue && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-transparent hover:text-foreground"
                onClick={handleClear}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {resultCount !== undefined && localValue && !loading && (
        <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
          {resultCount === 0 ? 'Aucun résultat' : `${resultCount} résultat${resultCount > 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
};

export default SearchBar;