package com.m4caco.scorace;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

@SuppressWarnings("deprecation")
public final class MainActivity extends Activity {
    private static final String HOME = "https://masterset-cinderace.vercel.app/";
    private static final String SITE_HOST = "masterset-cinderace.vercel.app";
    private static final int FILE_REQUEST = 101;
    private static final int CAMERA_REQUEST = 102;

    private FrameLayout root;
    private WebView webView;
    private ProgressBar progress;
    private LinearLayout offline;
    private View fullScreenView;
    private WebChromeClient.CustomViewCallback fullScreenCallback;
    private ValueCallback<Uri[]> pendingFiles;
    private PermissionRequest pendingCamera;

    private int dp(int n) {
        return Math.round(n * getResources().getDisplayMetrics().density);
    }

    private boolean isTrusted(Uri uri) {
        return uri != null && "https".equalsIgnoreCase(uri.getScheme())
                && SITE_HOST.equalsIgnoreCase(uri.getHost());
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(16,16,16));
        getWindow().setNavigationBarColor(Color.rgb(16,16,16));
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(16,16,16));
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        setContentView(root);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(16,16,16));
        root.addView(webView, new FrameLayout.LayoutParams(-1,-1));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgressTintList(ColorStateList.valueOf(Color.rgb(244,214,100)));
        root.addView(progress, new FrameLayout.LayoutParams(-1, dp(3), Gravity.TOP));
        createOfflineScreen();
        configureWebView();
        webView.loadUrl(HOME);
    }

    private void createOfflineScreen() {
        offline = new LinearLayout(this);
        offline.setOrientation(LinearLayout.VERTICAL);
        offline.setGravity(Gravity.CENTER);
        offline.setPadding(dp(28),dp(24),dp(28),dp(24));
        offline.setBackgroundColor(Color.rgb(16,16,16));

        TextView heading = new TextView(this);
        heading.setText(R.string.offline_title);
        heading.setTextSize(23);
        heading.setTextColor(Color.rgb(244,214,100));
        heading.setGravity(Gravity.CENTER);

        TextView help = new TextView(this);
        help.setText(R.string.offline_message);
        help.setTextSize(15);
        help.setGravity(Gravity.CENTER);
        help.setTextColor(Color.WHITE);
        help.setPadding(0,dp(18),0,dp(22));

        Button retry = new Button(this);
        retry.setText(R.string.retry);
        retry.setOnClickListener(v -> webView.loadUrl(HOME));

        offline.addView(heading);
        offline.addView(help);
        offline.addView(retry);
        offline.setVisibility(View.GONE);
        root.addView(offline, new FrameLayout.LayoutParams(-1,-1));
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setGeolocationEnabled(false);
        if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isTrusted(uri)) return false;
                if (request.isForMainFrame()) openExternally(uri);
                return true;
            }
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                if (isTrusted(Uri.parse(url))) {
                    offline.setVisibility(View.GONE);
                    progress.setVisibility(View.VISIBLE);
                }
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
            }
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    Log.w("SCORACE", "Não foi possível carregar o site");
                    offline.setVisibility(View.VISIBLE);
                    progress.setVisibility(View.GONE);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int percent) {
                progress.setProgress(percent);
                if (percent >= 100) progress.setVisibility(View.GONE);
            }
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (pendingFiles != null) pendingFiles.onReceiveValue(null);
                pendingFiles = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_REQUEST);
                } catch (ActivityNotFoundException e) {
                    pendingFiles.onReceiveValue(null);
                    pendingFiles = null;
                    Toast.makeText(MainActivity.this, R.string.no_file_picker, Toast.LENGTH_LONG).show();
                }
                return true;
            }
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> grantCameraIfAllowed(request));
            }
            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingCamera == request) pendingCamera = null;
            }
            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullScreenView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                fullScreenView = view;
                fullScreenCallback = callback;
                webView.setVisibility(View.GONE);
                root.addView(view, new FrameLayout.LayoutParams(-1,-1));
            }
            @Override
            public void onHideCustomView() { hideFullScreen(); }
        });

        webView.setDownloadListener((url, userAgent, disposition, mime, length) -> {
            try {
                Uri uri = Uri.parse(url);
                if (!"https".equalsIgnoreCase(uri.getScheme())) throw new IllegalArgumentException();
                String name = URLUtil.guessFileName(url, disposition, mime);
                DownloadManager.Request request = new DownloadManager.Request(uri);
                request.setTitle(name);
                if (mime != null) request.setMimeType(mime);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                if (userAgent != null) request.addRequestHeader("User-Agent", userAgent);
                if (isTrusted(uri)) {
                    String cookies = CookieManager.getInstance().getCookie(url);
                    if (cookies != null) request.addRequestHeader("Cookie", cookies);
                }
                ((DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(request);
                Toast.makeText(this, R.string.download_started, Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Log.w("SCORACE", "Download indisponível", e);
                Toast.makeText(this, R.string.download_failed, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void grantCameraIfAllowed(PermissionRequest request) {
        if (!isTrusted(request.getOrigin())) { request.deny(); return; }
        boolean wantsVideo = false;
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) wantsVideo = true;
            else { request.deny(); return; }  // No microphone or other special grants.
        }
        if (!wantsVideo) { request.deny(); return; }
        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[] {PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        } else {
            if (pendingCamera != null) pendingCamera.deny();
            pendingCamera = request;
            requestPermissions(new String[] {Manifest.permission.CAMERA}, CAMERA_REQUEST);
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code != CAMERA_REQUEST || pendingCamera == null) return;
        PermissionRequest request = pendingCamera;
        pendingCamera = null;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED
                && isTrusted(request.getOrigin())) {
            request.grant(new String[] {PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        } else request.deny();
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == FILE_REQUEST && pendingFiles != null) {
            ValueCallback<Uri[]> callback = pendingFiles;
            pendingFiles = null;
            callback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
        }
    }

    private void hideFullScreen() {
        if (fullScreenView == null) return;
        root.removeView(fullScreenView);
        fullScreenView = null;
        webView.setVisibility(View.VISIBLE);
        if (fullScreenCallback != null) fullScreenCallback.onCustomViewHidden();
        fullScreenCallback = null;
    }

    private void openExternally(Uri uri) {
        if (uri == null) return;
        String scheme = uri.getScheme();
        if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)
                && !"mailto".equalsIgnoreCase(scheme) && !"tel".equalsIgnoreCase(scheme)) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (ActivityNotFoundException ignored) { }
    }

    @Override
    public void onBackPressed() {
        if (fullScreenView != null) hideFullScreen();
        else if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) webView.onPause();
    }
    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }
    @Override
    protected void onDestroy() {
        if (pendingFiles != null) pendingFiles.onReceiveValue(null);
        if (pendingCamera != null) pendingCamera.deny();
        if (webView != null) {
            webView.stopLoading();
            root.removeView(webView);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
