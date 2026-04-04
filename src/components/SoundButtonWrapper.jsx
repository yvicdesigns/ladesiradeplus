import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/useSound';
import { Loader2 } from 'lucide-react';

export const SoundButtonWrapper = React.forwardRef(({ 
  onClick, 
  children, 
  soundType = 'button', // Default uses the configured button sound from settings
  soundVolume, 
  disabled, 
  className,
  isLoading,
  asChild,
  ...props 
}, ref) => {
  const { playSound } = useSound();
  // eslint-disable-next-line no-unused-vars
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async (e) => {
    // Visual feedback state
    setIsPlaying(true);
    
    // Play sound if not explicitly disabled
    // Check loading state too to avoid spamming while loading
    if (!disabled && !isLoading) {
      try {
        // Map 'click' to 'button' for backward compatibility
        const typeToPlay = soundType === 'click' ? 'button' : soundType;
        playSound(typeToPlay, soundVolume);
      } catch (err) {
        console.error("SoundButtonWrapper: Failed to play sound", err);
      }
    }
    
    // Reset visual feedback quickly
    setTimeout(() => setIsPlaying(false), 200);

    // Propagate click
    if (onClick) {
      onClick(e);
    }
  };

  // Logic to handle children structure for Slot compatibility (asChild)
  // If asChild is true, the underlying shadcn Button uses Radix Slot.
  // Slot expects strictly ONE child element.
  // Therefore, we CANNOT inject the Loader2 icon or wrap children in a Fragment.
  // We must pass the child directly.
  
  if (asChild) {
    return (
      <Button 
        ref={ref}
        onClick={handleClick} 
        disabled={disabled || isLoading} 
        className={className}
        asChild={true}
        {...props}
      >
        {children}
      </Button>
    );
  }

  // Standard behavior (asChild=false)
  // Button renders a <button> element, which accepts multiple children.
  // We can safely inject the loading spinner.
  return (
    <Button 
      ref={ref}
      onClick={handleClick} 
      disabled={disabled || isLoading} 
      className={className}
      asChild={false}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      {children}
    </Button>
  );
});

SoundButtonWrapper.displayName = "SoundButtonWrapper";

export default SoundButtonWrapper;