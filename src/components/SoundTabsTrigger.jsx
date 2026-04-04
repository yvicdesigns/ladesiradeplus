import React from 'react';
import { TabsTrigger } from '@/components/ui/tabs';
import { useSound } from '@/hooks/useSound';

export const SoundTabsTrigger = React.forwardRef(({ value, children, onClick, ...props }, ref) => {
  const { playSound } = useSound();

  const handleClick = (e) => {
    playSound('button');
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <TabsTrigger 
      ref={ref} 
      value={value} 
      onClick={handleClick} 
      {...props}
    >
      {children}
    </TabsTrigger>
  );
});

SoundTabsTrigger.displayName = 'SoundTabsTrigger';