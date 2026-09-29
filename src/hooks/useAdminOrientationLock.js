import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';

// Forces landscape on admin/kitchen routes (tablet use), restores free
// rotation when leaving them. Only applies to the native Android/iOS app —
// no-op on web, where the browser/OS already controls rotation.
export const useAdminOrientationLock = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {
      // Some devices/OS versions restrict orientation locking — ignore.
    });

    return () => {
      ScreenOrientation.unlock().catch(() => {});
    };
  }, []);
};
