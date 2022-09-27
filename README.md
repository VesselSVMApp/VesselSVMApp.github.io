# RTSP to Three JS Texture

##  개발 스택
-   Three js
-   FFmpeg
-   Node js ꞏ node-rtsp-stream & Web Socket

## 설치 
-   FFmpeg 설치 후, “ffmpeg\bin” 시스템 환경 변수 설정
-   Node.js 설치 후, “nodejs\” 시스템 환경 변수 설정

## 실행
-   node index.js 명령
-   node terminal에서 스트림이 진행되는 것을 확인

### PC 환경
- kimgooq.github.io 에 접속 후 ip 주소 입력

### Mobile 환경
>Android Studio Java & Minimum SDK [ API 21 : Android 5.0 (Lollipop) ]
 - Manifest
```
Add
- <uses-permission android:name="android.permission.INTERNET" />
- android:usesCleartextTraffic="true"
- android:screenOrientation="landscape"
```

- Java
```
import androidx.appcompat.app.AppCompatActivity;  
import android.content.Context;  
import android.os.Build;  
import android.os.Bundle;  
  
import android.webkit.WebChromeClient;  
import android.webkit.WebSettings;  
import android.webkit.WebView;  
import android.webkit.WebViewClient;  
  
public class MainActivity extends AppCompatActivity {  
    private WebView myWebView = null;  
 private Context mContext;  
  
  @Override  
  protected void onCreate(Bundle savedInstanceState) {  
        super.onCreate(savedInstanceState);  
  setContentView(R.layout.activity_main);  
  
  myWebView = (WebView) findViewById(R.id.webview);  
  myWebView.setWebViewClient(new WebViewClient());  
  myWebView.setWebChromeClient(new WebChromeClient());  
  myWebView.getSettings().setBuiltInZoomControls(false);  
  myWebView.getSettings().setJavaScriptEnabled(true);  
  
 if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {  
            WebView.setWebContentsDebuggingEnabled(true);  
  }  
  
        myWebView.getSettings().setAllowFileAccess(true);  
  myWebView.getSettings().setAllowContentAccess(true);  
  myWebView.getSettings().setAllowFileAccessFromFileURLs(true);  
  myWebView.getSettings().setAllowUniversalAccessFromFileURLs(true);  
  myWebView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);  
  
  myWebView.loadUrl("https://kimgooq.github.io/");  
  }  
}
```

- Layout xml
```
<?xml version="1.0" encoding="utf-8"?>  
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"  
  xmlns:app="http://schemas.android.com/apk/res-auto"  
  xmlns:tools="http://schemas.android.com/tools"  
  android:layout_width="match_parent"  
  android:layout_height="match_parent"  
  tools:context=".MainActivity">  
 <LinearLayout  android:layout_width="match_parent"  
  android:layout_height="match_parent"  
  android:orientation="vertical">  
  
 <LinearLayout  android:layout_width="match_parent"  
  android:layout_height="0dp"  
  android:layout_weight="9"  
  android:orientation="horizontal">  
  
 <ImageView  android:id="@+id/imageView"  
  android:layout_width="0dp"  
  android:layout_height="match_parent"  
  android:layout_weight="1"  
  app:srcCompat="@drawable/ic_launcher_background" />  
  
 <WebView  android:id="@+id/webview"  
  android:layout_width="0dp"  
  android:layout_height="match_parent"  
  android:layout_weight="1"></WebView>  
  
 <WebView  android:id="@+id/webview_right"  
  android:layout_width="0dp"  
  android:layout_height="match_parent"  
  android:layout_weight="1"></WebView>  
  
 </LinearLayout>  
 <LinearLayout  android:layout_width="match_parent"  
  android:layout_height="0dp"  
  android:layout_weight="1"  
  android:background="#03A9F4"  
  android:orientation="horizontal">  
  
 <ImageView  android:id="@+id/profileicon"  
  android:layout_width="wrap_content"  
  android:layout_height="wrap_content"  
  android:layout_weight="0"  
  tools:srcCompat="@tools:sample/avatars" />  
 </LinearLayout>  
 </LinearLayout>  
</androidx.constraintlayout.widget.ConstraintLayout>
```
- Virtual Device는 사양 문제로 WebView Load 불가
- 따라서 Mobile Device 연결 및 USB 디버깅 허용 후 App Test 진행
- Mobile 환경에서 RTSP 영상이 재생되는 PlaneGeometry는 정상적이지만, fetch API 문제로 인한 Ship model이 load되지 않기에 WebView로 kimgooq.github.io 를 Load해오고 있음
- 스트림해주는 PC와 같은 Network 상에 접속해있어야 하며, App 실행 후 IP Address 입력하여 Scene 확인 가능

### 특이사항
- 정상적으로 작동되지 않을 시, Chrome 사이트 설정 > 안전하지 않은 콘텐츠 > [VesselSVMApp.github.io](http://VesselSVMApp.github.io/) 허용
