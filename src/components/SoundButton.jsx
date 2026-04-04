import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/useSound';
import { Loader2 } from 'lucide-react';

export const SoundButton = React.forwardRef(({ 
  onClick, 
  children, 
  soundType = 'click', 
  soundVolume, 
  disabled, 
  className,
  ...props 
}, ref) => {
  const { playSound } = useSound();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = async (e) => {
    console.log("SoundButton clicked");
    
    // Visual feedback
    setIsPlaying(true);
    
    // Play sound regardless of disabled state? 
    // Usually no, but button might be physically clickable even if "logic" is disabled
    if (!disabled) {
      try {
        playSound(soundType, soundVolume);
      } catch (err) {
        console.error("SoundButton: Failed to play sound", err);
      }
    }
    
    // Reset visual feedback quickly since sounds are short
    setTimeout(() => setIsPlaying(false), 200);

    // Propagate click
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Button 
      ref={ref}
      onClick={handleClick} 
      disabled={disabled || isPlaying} 
      className={className}
      {...props}
    >
      {isPlaying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
      {children}
    </Button>
  );
});

SoundButton.displayName = "SoundButton";