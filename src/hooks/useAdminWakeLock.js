import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useAdminWakeLock = () => {
  const location = useLocation();
  const wakeLockRef = useRef(null);

  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');

    const acquire = async () => {
      if (!('wakeLock' in navigator)) return;
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        // Silently ignore — wake lock can be denied (e.g. low battery)
      }
    };

    const release = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };

    if (isAdminRoute) {
      acquire();
      // Re-acquire if the page becomes visible again (e.g. tab switch)
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') acquire();
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        release();
      };
    } else {
      release();
    }
  }, [location.pathname]);
};
