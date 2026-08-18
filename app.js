const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMUIZJmCpYpW0Mnaebqx6uM2qmgyv8OMFv2Ch49f888y4PVIVFLxyrXUcNbFU1ViBW/exec";

let currentUser = null;

// Beim Laden der Seite prüfen, ob bereits Benutzer angelegt wurden
window.addEventListener('DOMContentLoaded', () => {
    initUsers();
});

function initUsers() {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    // Standard-Admin anlegen, falls noch keine User existieren
    if (!users['99']) {
        users['99'] = { nr: '99', name: 'Administrator', pin: '1234', isAdmin: true };
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// =========================================================
// LOGIN / LOGOUT LOGIK
// =========================================================
function login() {
    const nrInput = document.getElementById('login-nr').value.trim();
    const pinInput = document.getElementById('login-pin').value.trim();
    const msgEl = document.getElementById('login-msg');

    if (!nrInput) {
        msgEl.innerText = "Bitte Personalnummer eingeben!";
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let user = users[nrInput];

    if (!user) {
        // Falls Nummer 99 eingegeben wird, aber aus irgendeinem Grund gelöscht war
        if (nrInput === '99') {
            user = { nr: '99', name: 'Administrator', pin: pinInput || '1234', isAdmin: true };
            users['99'] = user;
            localStorage.setItem('users', JSON.stringify(users));
        } else {
            msgEl.innerText = "Personalnummer nicht gefunden!";
            return;
        }
    }

    // PIN-Prüfung (falls PIN gesetzt ist)
    if (user.pin && user.pin !== pinInput) {
        msgEl.innerText = "Falsche PIN!";
        return;
    }

    // Erfolgreicher Login
    currentUser = user;
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('welcome-user').innerText = `Willkommen, ${currentUser.name} (${currentUser.nr})`;
    msgEl.innerText = "";
}

function logout() {
    currentUser = null;
    document.getElementById('login-nr').value = "";
    document.getElementById('login-pin').value = "";
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
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

    document.getElementById('status-msg').innerText = `Gespeichert: ${type} um ${entry.time}`;

    // Senden an Google Apps Script
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
