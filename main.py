import os
from kivy.app import App
from kivy.uix.webview import WebView

class ZeiterfassungApp(App):
    def build(self):
        # Pfad zur lokalen index.html
        html_path = os.path.abspath('index.html')
        
        # Erstelle eine WebView und lade die HTML-Datei
        webview = WebView(f"file://{html_path}")
        return webview

if __name__ == '__main__':
    ZeiterfassungApp().run()
