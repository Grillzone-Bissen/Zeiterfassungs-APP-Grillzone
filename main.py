import datetime
import sqlite3
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.gridlayout import GridLayout
from kivy.uix.label import Label
from kivy.uix.screenmanager import Screen, ScreenManager


# --- DATENBANK SETUP ---
def init_db():
    conn = sqlite3.connect("zeiterfassung.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stempelzeiten (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_id INTEGER,
            emp_name TEXT,
            typ TEXT,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()


# --- MITARBEITER MAPPING (1 bis 99) ---
# Hier verknüpfst du die Nummern mit den Namen deines Teams
STAFF = {
    1: "Karim",
    2: "Sarah",
    13: "Marco",
    # Du kannst hier jederzeit weitere Nummern hinzufügen...
}


class TerminalScreen(Screen):

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        init_db()
        self.current_input = ""

        # Haupt-Layout
        layout = BoxLayout(orientation="vertical", padding=20, spacing=15)

        # 1. Titel & Anzeige der eingegebenen Nummer
        self.display_label = Label(
            text="Mitarbeiter-Nr. eingeben",
            font_size="28sp",
            size_hint_y=0.2,
            bold=True,
        )
        layout.add_widget(self.display_label)

        # 2. Status-Nachricht (z. B. "Hallo Marco - Eingestempelt um 08:00")
        self.status_label = Label(
            text="Willkommen im Diner!", font_size="18sp", size_hint_y=0.15
        )
        layout.add_widget(self.status_label)

        # 3. Ziffernblock (1 bis 9 + 0 + C + Enter)
        grid = GridLayout(cols=3, spacing=10, size_hint_y=0.5)

        for digit in ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"]:
            btn = Button(text=digit, font_size="24sp")
            if digit == "C":
                btn.bind(on_press=self.clear_input)
            elif digit == "OK":
                btn.bind(on_press=self.process_number)
            else:
                btn.bind(on_press=self.add_digit)
            grid.add_widget(btn)

        layout.add_widget(grid)
        self.add_widget(layout)

    def add_digit(self, instance):
        if len(self.current_input) < 2:  # Maximal 2 Stellen (1 bis 99)
            self.current_input += instance.text
            self.display_label.text = f"Nummer: {self.current_input}"

    def clear_input(self, instance):
        self.current_input = ""
        self.display_label.text = "Mitarbeiter-Nr. eingeben"
        self.status_label.text = ""

    def get_last_status(self, emp_id):
        """Prüft, ob der Mitarbeiter aktuell EIN- oder AUSgestempelt ist."""
        conn = sqlite3.connect("zeiterfassung.db")
        cursor = conn.cursor()
        cursor.execute(
            "SELECT typ FROM stempelzeiten WHERE emp_id = ? ORDER BY id DESC LIMIT 1",
            (emp_id,),
        )
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else "STOP"  # Standardmäßig ist er ausgestempelt

    def process_number(self, instance):
        if not self.current_input:
            return

        emp_id = int(self.current_input)
        name = STAFF.get(emp_id)

        if not name:
            self.status_label.text = (
                f" Fehler: Nummer {emp_id} unbekannt!"
            )
            self.current_input = ""
            return

        last_status = self.get_last_status(emp_id)
        new_status = "START" if last_status == "STOP" else "STOP"
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # In Datenbank speichern
        conn = sqlite3.connect("zeiterfassung.db")
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO stempelzeiten (emp_id, emp_name, typ, timestamp) VALUES (?, ?, ?, ?)",
            (emp_id, name, new_status, now_str),
        )
        conn.commit()
        conn.close()

        # Rückmeldung für den Mitarbeiter
        aktion = "gestartet" if new_status == "START" else "beendet"
        time_only = datetime.datetime.now().strftime("%H:%M")
        self.status_label.text = (
            f"✓ {name}: Schicht {aktion} um {time_only} Uhr."
        )

        # Eingabe für den Nächsten zurücksetzen
        self.current_input = ""
        self.display_label.text = "Mitarbeiter-Nr. eingeben"


class DinerTimeApp(App):

    def build(self):
        sm = ScreenManager()
        sm.add_widget(TerminalScreen(name="terminal"))
        return sm


if __name__ == "__main__":
    DinerTimeApp().run()
