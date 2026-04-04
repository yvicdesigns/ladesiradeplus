import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSound } from '@/hooks/useSound';

export const SoundNavLink = React.forwardRef(({ to, children, onClick, className, ...props }, ref) => {
  const { playSound } = useSound();

  const handleClick = (e) => {
    playSound('button');
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <NavLink 
      ref={ref} 
      to={to} 
      onClick={handleClick} 
      className={className}
      {...props}
    >
      {children}
    </NavLink>
  );
});

SoundNavLink.displayName = 'SoundNavLink';