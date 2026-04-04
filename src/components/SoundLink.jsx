import React from 'react';
import { Link } from 'react-router-dom';
import { useSound } from '@/hooks/useSound';

export const SoundLink = React.forwardRef(({ to, children, onClick, ...props }, ref) => {
  const { playSound } = useSound();

  const handleClick = (e) => {
    // Use the generic 'button' category which maps to the configured button sound
    playSound('button');
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link ref={ref} to={to} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
});

SoundLink.displayName = 'SoundLink';