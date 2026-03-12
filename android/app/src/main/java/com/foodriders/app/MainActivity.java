package com.foodriders.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 🚨 1. WHATSAPP-STYLE EMERGENCY OVERHAUL (Siren Alert v5)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String channelId = "foodriders_urgent_v5"; // Fresh ID for V21
            NotificationChannel channel = new NotificationChannel(
                channelId,
                "🚨 FoodRiders HYPER Alerts",
                NotificationManager.IMPORTANCE_HIGH
            );
            
            channel.setDescription("MAX URGENCY: plays siren and vibrates non-stop.");
            channel.enableVibration(true);
            // Non-stop pulse pattern [wait, vibrate, rest, vibrate...]
            channel.setVibrationPattern(new long[]{0, 1500, 500, 1500, 500, 1500, 500, 1500, 500, 1500, 500, 1500});
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);
            channel.enableLights(true);
            channel.setLightColor(android.graphics.Color.RED);
            
            Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/raw/siren");
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            channel.setSound(soundUri, audioAttributes);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                // Clear ALL old messy channels from previous attempts
                manager.deleteNotificationChannel("foodriders_alerts_final");
                manager.deleteNotificationChannel("foodriders_urgent_alert_v1");
                manager.deleteNotificationChannel("foodriders_emergency_v3");
                manager.deleteNotificationChannel("foodriders_emergency_v4");
                manager.createNotificationChannel(channel);
            }
        }

        // 🚀 2. App-Specific Routing & Desktop View Logic
        String packageName = getPackageName();
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();

        // ENABLE AUDIO & JS
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false); // 🔥 CRITICAL FOR SIREN AUTOPLAY
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Add Vibration Bridge
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void vibrate(int duration) {
                Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(duration);
                    }
                }
            }
        }, "AndroidBridge");

        if (packageName.equals("com.foodriders.admin")) {
            // 🔥 Aggressive Desktop View Enforcement
            String desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
            
            webView.getSettings().setUserAgentString(desktopUA);
            webView.getSettings().setUseWideViewPort(true);
            webView.getSettings().setLoadWithOverviewMode(true);
            webView.getSettings().setSupportZoom(true);
            webView.getSettings().setBuiltInZoomControls(true);
            webView.getSettings().setDisplayZoomControls(true); // Allow user to zoom out if needed
            
            // Set scale to fit computer width (around 0.35 for most phones to fit 1280px)
            webView.setInitialScale(1); 

            // ⚡ Auto-inject Desktop Viewport after load
            webView.setWebViewClient(new com.getcapacitor.BridgeWebViewClient(getBridge()) {
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    view.evaluateJavascript(
                        "var meta = document.querySelector('meta[name=\"viewport\"]');" +
                        "if (meta) { meta.setAttribute('content', 'width=1200, initial-scale=0.35, maximum-scale=5.0, user-scalable=yes'); }" +
                        "else { var m = document.createElement('meta'); m.name='viewport'; m.content='width=1200, initial-scale=0.35'; document.head.appendChild(m); }",
                        null
                    );
                }
            });
            
            webView.loadUrl("https://www.foodriders.in/admin");
            System.out.println("✅ [BOOT] Admin Mode: Aggressive Desktop View Enabled");
            
        } else if (packageName.equals("com.foodriders.rider")) {
            // Start at Rider Portal
            webView.loadUrl("https://www.foodriders.in/delivery-login");
            System.out.println("✅ [BOOT] Rider Mode Detected");
        }
    }
}
