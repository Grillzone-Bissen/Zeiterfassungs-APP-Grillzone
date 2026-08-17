import os
from android.runnable import run_on_ui_thread
from jnius import autoclass

# Native Android-Klassen laden
PythonActivity = autoclass('org.kivy.android.PythonActivity')
WebView = autoclass('android.webkit.WebView')
WebViewClient = autoclass('android.webkit.WebViewClient')

@run_on_ui_thread
def start_webview():
    activity = PythonActivity.mActivity
    webview = WebView(activity)
    webview.getSettings().setJavaScriptEnabled(True)
    webview.getSettings().setDomStorageEnabled(True)
    webview.setWebViewClient(WebViewClient())
    
    # HTML-Datei aus dem App-Verzeichnis laden
    html_path = os.path.abspath('index.html')
    webview.loadUrl('file://' + html_path)
    
    activity.setContentView(webview)

if __name__ == '__main__':
    start_webview()
