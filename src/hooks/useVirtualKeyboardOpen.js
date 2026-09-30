import { useEffect, useState } from 'react';

const SHRINK_THRESHOLD_PX = 150;

// Detects the on-screen keyboard on mobile web via the VisualViewport API:
// when it opens, the visual viewport shrinks while window.innerHeight (the
// layout viewport) stays the same. There is no native "keyboard shown" event
// on the web platform, so this delta is the standard way to infer it.
export function useVirtualKeyboardOpen() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const layoutHeight = window.innerHeight;
    const handleResize = () => {
      setIsOpen(layoutHeight - viewport.height > SHRINK_THRESHOLD_PX);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  return isOpen;
}
