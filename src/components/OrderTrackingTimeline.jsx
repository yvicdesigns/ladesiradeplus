import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import { DELIVERY_STATUSES, getStatusIndex, STATUS_CANCELLED, STATUS_DELIVERED } from '@/lib/deliveryConstants';
import { CheckCircle, ClipboardList, ChefHat } from 'lucide-react';

export const OrderTrackingTimeline = ({ status, createdAt, updatedAt, orderMethod, orderType }) => {
  const isCancelled = status === STATUS_CANCELLED || status === 'rejected';
  const isRestaurant = orderType === 'restaurant' || orderMethod === 'counter' || orderType === 'dine_in';

  let steps = [];
  let currentStepIndex = 0;

  if (isRestaurant) {
    steps = [
      { key: 'pending', label: 'Commandé', icon: ClipboardList },
      { key: 'preparing', label: 'En préparation', icon: ChefHat },
      { key: 'ready', label: orderMethod === 'counter' ? 'Prêt à retirer' : 'Servi', icon: CheckCircle }
    ];
    
    if (status === 'pending' || status === 'confirmed') currentStepIndex = 0;
    else if (status === 'preparing') currentStepIndex = 1;
    else if (status === 'ready' || status === 'served' || status === 'delivered') currentStepIndex = 2;
  } else {
    steps = DELIVERY_STATUSES.filter(s => s.key !== 'cancelled' && s.key !== 'rejected');
    currentStepIndex = getStatusIndex(status);
  }

  return (
    <div className="w-full py-2 md:py-1 lg:py-4">
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-5 md:gap-0.5 lg:gap-2">
        
        {/* Progress Bar Background (Tablet & Desktop only) */}
        <div className="absolute top-2.5 md:top-3 left-0 w-full h-0.5 bg-gray-200 hidden md:block -z-10" />
        
        {/* Progress Bar Fill (Tablet & Desktop only) */}
        <motion.div 
          className={cn(
            "absolute top-2.5 md:top-3 left-0 h-0.5 hidden md:block -z-10 origin-left",
            isCancelled ? "bg-red-200" : "bg-primary"
          )}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0, currentStepIndex / (steps.length - 1)) }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex md:flex-col items-center gap-4 md:gap-0.5 lg:gap-2 relative z-10 w-full md:w-auto">
              
              {/* Vertical Line for Mobile (Left side connection) */}
              {index !== steps.length - 1 && (
                <div className={cn(
                  "absolute left-[15px] top-8 w-0.5 h-full bg-gray-200 md:hidden",
                  isCompleted && !isCancelled && "bg-primary"
                )} />
              )}

              {/* Icon Circle */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "rounded-full flex items-center justify-center border transition-colors duration-300 flex-shrink-0 z-20 bg-white",
                  // Mobile Sizes (Large for touch)
                  "w-8 h-8", 
                  // Tablet Sizes (Compact)
                  "md:w-6 md:h-6",
                  // Desktop Sizes (Prominent)
                  "lg:w-10 lg:h-10",

                  isCurrent && isCancelled ? "bg-red-100 border-red-500 text-red-600" :
                  isCompleted ? "bg-primary border-primary text-white" : 
                  "bg-white border-gray-300 text-gray-400",
                  
                  isCurrent && !isCancelled && "bg-white border-primary text-primary shadow-sm ring-2 ring-primary/20"
                )}
              >
                <Icon className="w-4 h-4 md:w-3 md:h-3 lg:w-5 lg:h-5" />
              </motion.div>
              
              {/* Text Container */}
              <div className="flex flex-col md:items-center justify-center py-1 md:py-0">
                <span className={cn(
                  "font-semibold leading-tight", 
                  // Mobile Text
                  "text-sm text-left",
                  // Tablet Text
                  "md:text-[10px] md:text-center",
                  // Desktop Text
                  "lg:text-sm lg:text-center",

                  isCompleted ? "text-gray-900" : "text-gray-400",
                  isCurrent && "text-primary"
                )}>
                  {step.label}
                </span>
                
                {/* Timestamp placeholder - visible on mobile/desktop */}
                {index === 0 && createdAt && (
                  <span className="text-gray-400 mt-0.5 leading-none text-xs md:text-[9px] lg:text-xs hidden md:block">
                    {formatTime(createdAt)}
                  </span>
                )}
                
                {/* Delivered/Ready Timestamp */}
                {index === steps.length - 1 && isCompleted && updatedAt && (
                  <span className="text-gray-400 mt-0.5 leading-none text-xs md:text-[9px] lg:text-xs hidden md:block text-amber-600 font-medium">
                    {formatTime(updatedAt)}
                  </span>
                )}
                
                {isCurrent && (status !== STATUS_DELIVERED && status !== 'served' && status !== 'ready') && ( 
                   <span className="font-medium animate-pulse text-blue-600 leading-none mt-1 md:mt-0.5 block md:text-center text-xs md:text-[9px] lg:text-xs">
                     En cours
                   </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};