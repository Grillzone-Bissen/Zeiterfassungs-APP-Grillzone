const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxILO_m7PVf3J3fW6dtjemzfT1LK5L4lDp3s3iK_dZl-mCmxfkKHrynKalJUn-ERnPcTw/exec";

let currentUser = null;

// Admin (99) beim Laden im Speicher sicherstellen
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
    document.getElementById('login-view').classList.add('hidden');

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
// STEMPEL-FUNKTION (Senden an Google Sheets)
// =========================================================
function stamp(type) {
    if (!currentUser) return;

    const now = new Date();

    // Datum & Zeit explizit mit führenden Nullen formatieren (DD.MM.YYYY und HH:MM:SS)
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const entry = {
        personalNr: currentUser.nr,
        name: currentUser.name,
        action: type,
        date: `${day}.${month}.${year}`,
        time: `${hours}:${minutes}:${seconds}`
    };

    // Lokale Sicherung für den Fall der Fälle
    let history = JSON.parse(localStorage.getItem('stampHistory') || '[]');
    history.push(entry);
    localStorage.setItem('stampHistory', JSON.stringify(history));

    document.getElementById('status-msg').innerText = `Status: ${type} um ${entry.time} Uhr`;

    // Senden an Google Sheets
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(entry)
    })
    .then(() => alert(`Erfolgreich gestempelt: ${type}`))
    .catch(err => {
        console.error('Fehler:', err);
        alert('Fehler beim Übertragen!');
    });
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

function deleteUser(nr) {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let userName = users[nr] ? users[nr].name : nr;

    if (confirm(`Möchtest du den User "${userName}" (Nr. ${nr}) wirklich löschen?`)) {
        delete users[nr];
        localStorage.setItem('users', JSON.stringify(users));
        renderUserList();
    }
}

// =========================================================
// CSV EXPORT (Direkt aus Google Sheets)
// =========================================================
function exportCSV() {
    fetch(GOOGLE_SCRIPT_URL)
        .then(response => response.text())
        .then(csvData => {
            if (!csvData || csvData.trim() === "") {
                alert("Keine Stempeldaten in Google Sheets vorhanden!");
                return;
            }

            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Stempeldaten_Export_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        })
        .catch(err => {
            console.error("Export-Fehler:", err);
            alert("Fehler beim Herunterladen der CSV-Datei aus Google Sheets!");
        });
}
