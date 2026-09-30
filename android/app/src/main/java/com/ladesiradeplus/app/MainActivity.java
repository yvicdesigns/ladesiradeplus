package com.ladesiradeplus.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 15+ (targetSdk 35+) forces edge-to-edge, and this app's
        // theme still carries the legacy windowSoftInputMode="adjustResize" +
        // windowTranslucentNavigation combo. That combination was measured
        // (via logcat + a live device screenshot) to make the WebView's
        // window.innerHeight collapse to ~70px instead of the ~1400px that
        // should remain above the keyboard -- leaving a large blank gap
        // between the squeezed content and the real keyboard. Rather than
        // fight that broken automatic resize, we bypass it entirely: go
        // fully edge-to-edge and apply the keyboard's real height as WebView
        // padding ourselves, which is the insets model Android expects an
        // app to own from API 35 onward instead of windowSoftInputMode
        // resize/pan. AndroidManifest.xml sets adjustNothing so the OS
        // doesn't also try to resize/pan on top of this.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WebView webView = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, windowInsets) -> {
            Insets imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            Insets systemBarInsets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(
                systemBarInsets.left,
                systemBarInsets.top,
                systemBarInsets.right,
                Math.max(imeInsets.bottom, systemBarInsets.bottom)
            );
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
