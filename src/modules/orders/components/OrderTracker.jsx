import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, ChefHat, Truck, MapPin } from 'lucide-react';
import { ORDER_STATUSES } from '../constants';

const STEPS = [
  { status: ORDER_STATUSES.PENDING, label: 'Reçue', icon: Clock },
  { status: ORDER_STATUSES.PREPARING, label: 'En préparation', icon: ChefHat },
  { status: ORDER_STATUSES.IN_TRANSIT, label: 'En livraison', icon: Truck },
  { status: ORDER_STATUSES.DELIVERED, label: 'Livrée', icon: MapPin },
];

export const OrderTracker = ({ order }) => {
  if (!order) return null;

  const currentStatus = order.status;
  
  // Calculate progress
  let progressValue = 0;
  const currentStepIndex = STEPS.findIndex(s => s.status === currentStatus || 
    (currentStatus === ORDER_STATUSES.CONFIRMED && s.status === ORDER_STATUSES.PENDING) ||
    (currentStatus === ORDER_STATUSES.READY && s.status === ORDER_STATUSES.PREPARING) ||
    (currentStatus === ORDER_STATUSES.SERVED && s.status === ORDER_STATUSES.DELIVERED)
  );
  
  if (currentStatus === ORDER_STATUSES.CANCELLED || currentStatus === ORDER_STATUSES.REJECTED) {
    return (
      <Card className="border-red-200 bg-red-50 mt-6 shadow-sm">
        <CardContent className="p-6 text-center text-red-700 font-medium">
          Cette commande a été annulée.
        </CardContent>
      </Card>
    );
  }

  if (currentStepIndex >= 0) {
    progressValue = ((currentStepIndex + 1) / STEPS.length) * 100;
  } else if (currentStatus === ORDER_STATUSES.DELIVERED || currentStatus === ORDER_STATUSES.SERVED) {
    progressValue = 100;
  }

  return (
    <Card className="mt-6 shadow-sm border-gray-200">
      <CardContent className="p-6 md:p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Suivi en direct</h3>
        
        <div className="relative">
          <Progress value={progressValue} className="h-2 mb-8 bg-gray-100" />
          
          <div className="absolute top-[-12px] left-0 right-0 flex justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex || progressValue === 100;
              const isCurrent = index === currentStepIndex && progressValue < 100;
              const Icon = step.icon;
              
              return (
                <div key={step.status} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white transition-colors duration-500 shadow-sm
                    ${isCompleted ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}
                    ${isCurrent ? 'ring-4 ring-primary/20 animate-pulse' : ''}
                  `}>
                    {isCompleted && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium hidden md:block ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};