import os
import webbrowser
from kivy.app import App
from kivy.uix.label import Label
from kivy.clock import Clock

class ZeiterfassungApp(App):
    def build(self):
        # Öffnet beim Start die lokale HTML-Datei im Android-Browser
        Clock.schedule_once(self.open_browser, 0.5)
        return Label(text="Zeiterfassung wird gestartet...")

    def open_browser(self, dt):
        html_path = os.path.abspath('index.html')
        webbrowser.open('file://' + html_path)

if __name__ == '__main__':
    ZeiterfassungApp().run()
