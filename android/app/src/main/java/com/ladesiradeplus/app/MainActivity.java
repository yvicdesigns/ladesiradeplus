package com.ladesiradeplus.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Explicitly opt OUT of the edge-to-edge default Android 15+
        // (targetSdk 35+) otherwise forces. Combined with
        // windowSoftInputMode="adjustNothing" (AndroidManifest.xml), this
        // restores the classic model where Android reserves space for the
        // system bars itself -- which is what the app's CSS
        // (env(safe-area-inset-*) in MobileBottomNav.jsx) was already built
        // to rely on. The keyboard itself is handled separately, in JS, via
        // useVirtualKeyboardOpen (VisualViewport API), which works
        // regardless of this native resize setting.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
