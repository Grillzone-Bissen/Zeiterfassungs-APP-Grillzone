const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMUIZJmCpYpW0Mnaebqx6uM2qmgyv8OMFv2Ch49f888y4PVIVFLxyrXUcNbFU1ViBW/exec";

let currentUser = null;

// Beim Starten bestehende User laden oder Admin anlegen
window.addEventListener('DOMContentLoaded', () => {
    initUsers();
});

function initUsers() {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Falls noch gar kein User existiert, Admin (99) voranlegen
    if (!users['99']) {
        users['99'] = { nr: '99', name: 'Administrator' };
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// =========================================================
// USER ANLEGEN (Button: "User Speichern")
// =========================================================
function createUser() {
    const nameInput = document.getElementById('new-name').value.trim();
    const nrInput = document.getElementById('new-nr').value.trim();

    if (!nameInput || !nrInput) {
        alert("Bitte sowohl Name als auch Personalnummer eingeben!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');

    // Im LocalStorage speichern
    users[nrInput] = {
        nr: nrInput,
        name: nameInput
    };

    localStorage.setItem('users', JSON.stringify(users));

    alert(`User "${nameInput}" mit Personalnummer ${nrInput} erfolgreich gespeichert!`);

    // Feldeingaben zurücksetzen
    document.getElementById('new-name').value = '';
    document.getElementById('new-nr').value = '';
}

// =========================================================
// LOGIN / LOGOUT (Button: "Einloggen" & "Abmelden")
// =========================================================
function login() {
    const nrInput = document.getElementById('personal-nr-input').value.trim();

    if (!nrInput) {
        alert("Bitte Personalnummer eingeben!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let user = users[nrInput];

    if (!user) {
        alert(`Personalnummer ${nrInput} wurde nicht gefunden! Bitte zuerst unten anlegen.`);
        return;
    }

    currentUser = user;

    // UI umschalten: Login-Karte ausblenden, Stempel-Karte anzeigen
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('time-view').classList.remove('hidden');

    document.getElementById('welcome-msg').innerText = `Willkommen, ${currentUser.name}!`;
    document.getElementById('status-msg').innerText = "Status: Bereit";
}

function logout() {
    currentUser = null;
    document.getElementById('personal-nr-input').value = '';
    
    // UI umschalten: Stempel-Karte ausblenden, Login-Karte anzeigen
    document.getElementById('time-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
}

// =========================================================
// STEMPEL-FUNKTION (Senden an Google Sheets)
// =========================================================
function stamp(type) {
    if (!currentUser) {
        alert("Bitte zuerst anmelden!");
        return;
    }

    const now = new Date();
    const entry = {
        personalNr: currentUser.nr,
        name: currentUser.name,
        action: type,
        date: now.toLocaleDateString('de-DE'),
        time: now.toLocaleTimeString('de-DE')
    };

    document.getElementById('status-msg').innerText = `Status: ${type} um ${entry.time} Uhr`;

    // Per Fetch an Google Apps Script übertragen
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(entry)
    })
    .then(() => {
        alert(`Erfolgreich gestempelt: ${type}`);
    })
    .catch(err => {
        console.error('Fehler beim Senden:', err);
        alert('Fehler beim Übertragen an Google Sheets!');
    });
}

// =========================================================
// CSV EXPORT
// =========================================================
function exportCSV() {
    alert("CSV-Export-Funktion wird geladen.");
}
