const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMUIZJmCpYpW0Mnaebqx6uM2qmgyv8OMFv2Ch49f888y4PVIVFLxyrXUcNbFU1ViBW/exec";

let currentUser = null;

// Admin (99) beim Laden der Seite im Speicher garantieren
window.addEventListener('DOMContentLoaded', () => {
    initUsers();
});

function initUsers() {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
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

    // Sicherstellen, dass 99 immer als Admin vorhanden ist
    if (nrInput === '99') {
        users['99'] = { nr: '99', name: 'Administrator', isAdmin: true };
        localStorage.setItem('users', JSON.stringify(users));
    }

    let user = users[nrInput];

    if (!user) {
        errorMsg.innerText = `Personalnummer ${nrInput} nicht gefunden!`;
        return;
    }

    currentUser = user;

    // Login-Maske ausblenden
    document.getElementById('login-view').classList.add('hidden');

    // Unterscheidung Admin vs. Mitarbeiter
    if (currentUser.nr === '99') {
        document.getElementById('admin-view').classList.remove('hidden');
        renderUserList();
    } else {
        document.getElementById('time-view').classList.remove('hidden');
        document.getElementById('welcome-msg').innerText = `Willkommen, ${currentUser.name}!`;
        document.getElementById('status-msg').innerText = "Status: Bereit";
    }
}

function logout() {
    currentUser = null;
    document.getElementById('personal-nr-input').value = '';
    document.getElementById('login-error-msg').innerText = '';

    document.getElementById('time-view').classList.add('hidden');
    document.getElementById('admin-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
}

// =========================================================
// STEMPEL-FUNKTION (Mitarbeiter)
// =========================================================
function stamp(type) {
    if (!currentUser) return;

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
    .then(() => alert(`Erfolgreich gestempelt: ${type}`))
    .catch(err => alert('Fehler beim Übertragen!'));
}

// =========================================================
// ADMIN-FUNKTIONEN (User anlegen, auflisten & löschen)
// =========================================================
function createUser() {
    const nameInput = document.getElementById('new-name').value.trim();
    const nrInput = document.getElementById('new-nr').value.trim();

    if (!nameInput || !nrInput) {
        alert("Bitte Name und Personalnummer eingeben!");
        return;
    }

    if (nrInput === '99') {
        alert("Die 99 ist als Admin reserviert!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    users[nrInput] = { nr: nrInput, name: nameInput };
    localStorage.setItem('users', JSON.stringify(users));

    alert(`User "${nameInput}" (Nr. ${nrInput}) angelegt!`);

    document.getElementById('new-name').value = '';
    document.getElementById('new-nr').value = '';
    renderUserList();
}

// Mitarbeiter in der Liste anzeigen (inkl. Löschen-Button)
function renderUserList() {
    const listEl = document.getElementById('user-list-container');
    listEl.innerHTML = '';

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    
    Object.keys(users).forEach(nr => {
        if (nr !== '99') {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '8px 0';
            li.style.borderBottom = '1px solid #eee';

            li.innerHTML = `
                <span><strong>Nr. ${nr}:</strong> ${users[nr].name}</span>
                <button onclick="deleteUser('${nr}')" class="btn btn-danger" style="width: auto; padding: 4px 10px; margin: 0; font-size: 12px;">Löschen</button>
            `;
            listEl.appendChild(li);
        }
    });
}

// User löschen
function deleteUser(nr) {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let userName = users[nr] ? users[nr].name : nr;

    if (confirm(`Möchtest du den User "${userName}" (Nr. ${nr}) wirklich löschen?`)) {
        delete users[nr];
        localStorage.setItem('users', JSON.stringify(users));
        renderUserList();
    }
}

function exportCSV() {
    alert("CSV-Export gestartet.");
}
