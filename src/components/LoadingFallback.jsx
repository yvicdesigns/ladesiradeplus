import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingFallback = ({ type = 'page' }) => {
  if (type === 'admin') {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 hidden md:block">
           <Skeleton className="h-8 w-3/4 bg-gray-800 mb-8" />
           <div className="space-y-4">
             {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-10 w-full bg-gray-800" />)}
           </div>
        </div>
        <div className="flex-1 p-8 overflow-auto">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48 bg-white" />
            <Skeleton className="h-10 w-10 rounded-full bg-white" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl bg-white" />)}
          </div>
          <Skeleton className="h-96 w-full rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-10 w-10 animate-spin text-amber-600 mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">Chargement de l'interface...</p>
    </div>
  );
};

export default LoadingFallback;