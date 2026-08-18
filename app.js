const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMUIZJmCpYpW0Mnaebqx6uM2qmgyv8OMFv2Ch49f888y4PVIVFLxyrXUcNbFU1ViBW/exec";

let currentUser = null;

// Beim Aufruf der Seite Admin voranlegen
window.addEventListener('DOMContentLoaded', () => {
    initUsers();
});

function initUsers() {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Falls noch gar kein Admin angelegt ist (99)
    if (!users['99']) {
        users['99'] = { nr: '99', name: 'Administrator', isAdmin: true };
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// =========================================================
// LOGIN / LOGOUT LOGIK
// =========================================================
function login() {
    const nrInput = document.getElementById('personal-nr-input').value.trim();
    const errorMsg = document.getElementById('login-error-msg');
    errorMsg.innerText = '';

    if (!nrInput) {
        errorMsg.innerText = "Bitte Personalnummer eingeben!";
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let user = users[nrInput];

    if (!user) {
        errorMsg.innerText = `Personalnummer ${nrInput} nicht gefunden!`;
        return;
    }

    currentUser = user;

    // Login-Maske ausblenden
    document.getElementById('login-view').classList.add('hidden');

    // WENN ADMIN (99) -> ADMIN-OBERFLÄCHE ÖFFNEN
    if (currentUser.nr === '99') {
        document.getElementById('admin-view').classList.remove('hidden');
        renderUserList();
    } 
    // SONST -> MITARBEITER-OBERFLÄCHE ÖFFNEN
    else {
        document.getElementById('time-view').classList.remove('hidden');
        document.getElementById('welcome-msg').innerText = `Willkommen, ${currentUser.name}!`;
        document.getElementById('status-msg').innerText = "Status: Bereit";
    }
}

function logout() {
    currentUser = null;
    document.getElementById('personal-nr-input').value = '';
    document.getElementById('login-error-msg').innerText = '';

    // Alle Spezialbereiche ausblenden und Login einblenden
    document.getElementById('time-view').classList.add('hidden');
    document.getElementById('admin-view').classList.add('hidden');
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
// ADMIN-FUNKTIONEN (User anlegen & Liste anzeigen)
// =========================================================
function createUser() {
    const nameInput = document.getElementById('new-name').value.trim();
    const nrInput = document.getElementById('new-nr').value.trim();

    if (!nameInput || !nrInput) {
        alert("Bitte Name und Personalnummer eingeben!");
        return;
    }

    if (nrInput === '99') {
        alert("Die Nummer 99 ist als Admin reserviert!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');

    users[nrInput] = {
        nr: nrInput,
        name: nameInput
    };

    localStorage.setItem('users', JSON.stringify(users));

    alert(`User "${nameInput}" mit Personalnummer ${nrInput} angelegt!`);

    document.getElementById('new-name').value = '';
    document.getElementById('new-nr').value = '';

    renderUserList();
}

function renderUserList() {
    const listEl = document.getElementById('user-list-container');
    listEl.innerHTML = '';

    let users = JSON.parse(localStorage.getItem('users') || '{}');

    Object.keys(users).forEach(nr => {
        if (nr !== '99') {
            const li = document.createElement('li');
            li.style.marginBottom = '5px';
            li.innerText = `Nr. ${nr}: ${users[nr].name}`;
            listEl.appendChild(li);
        }
    });
}

function exportCSV() {
    alert("CSV-Export gestartet.");
}
