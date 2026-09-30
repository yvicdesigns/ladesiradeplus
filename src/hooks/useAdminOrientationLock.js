import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';

// Android's own "tablet" cutoff (sw600dp): the smallest of the two screen
// dimensions, which stays constant across rotations (unlike innerWidth,
// which swaps depending on current orientation).
const TABLET_MIN_WIDTH_DP = 600;

function isTabletClassDevice() {
  const w = window.screen?.width || 0;
  const h = window.screen?.height || 0;
  return Math.min(w, h) >= TABLET_MIN_WIDTH_DP;
}

// Forces landscape on admin/kitchen routes, but only on tablet-class devices
// (kitchen/counter tablet use case). Restaurant owners running the same app
// on a phone need portrait while on the move, so phones are left alone.
// Only applies to the native Android/iOS app — no-op on web, where the
// browser/OS already controls rotation.
export const useAdminOrientationLock = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!isTabletClassDevice()) return;

    ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {
      // Some devices/OS versions restrict orientation locking — ignore.
    });

    return () => {
      ScreenOrientation.unlock().catch(() => {});
    };
  }, []);
};
