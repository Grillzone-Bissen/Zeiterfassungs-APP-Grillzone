let currentUser = null;
const ADMIN_CODE = "99";

// Login-Funktion (KORRIGIERT)
function login() {
    const nr = document.getElementById('personal-nr-input').value.trim();
    
    if (!nr) {
        return alert('Bitte gib eine Personalnummer ein!');
    }

    // 1. ZUERST Admin-Prüfung durchführen
    if (nr === ADMIN_CODE) {
        currentUser = { nr: ADMIN_CODE, name: "Administrator", isAdmin: true };
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('admin-view').classList.remove('hidden');
        renderUserList();
        return;
    }

    // 2. DANN Mitarbeiter im LocalStorage suchen
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    if (users[nr]) {
        currentUser = { nr: nr, name: users[nr], isAdmin: false };
        document.getElementById('welcome-msg').innerText = `Hallo, ${currentUser.name}!`;
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('time-view').classList.remove('hidden');
    } else {
        alert('Personalnummer nicht gefunden!');
    }
}

// Abmelden
function logout() {
    currentUser = null;
    document.getElementById('personal-nr-input').value = '';
    document.getElementById('time-view').classList.add('hidden');
    document.getElementById('admin-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
}

// User anlegen (Nur Admin)
function createUser() {
    const name = document.getElementById('new-name').value.trim();
    const nr = document.getElementById('new-nr').value.trim();

    if (!name || !nr) return alert('Bitte Name und Personalnummer eingeben!');
    if (nr === ADMIN_CODE) return alert('Die Personalnummer 99 ist für den Admin reserviert!');

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[nr]) return alert('Diese Personalnummer existiert bereits!');

    users[nr] = name;
    localStorage.setItem('users', JSON.stringify(users));
    
    alert(`User ${name} (Nr. ${nr}) angelegt!`);
    document.getElementById('new-name').value = '';
    document.getElementById('new-nr').value = '';
    
    renderUserList();
}

// User-Liste im Adminbereich anzeigen
function renderUserList() {
    const userListDiv = document.getElementById('user-list');
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    userListDiv.innerHTML = '';

    const keys = Object.keys(users);
    if (keys.length === 0) {
        userListDiv.innerHTML = '<p style="color: #666;">Keine Mitarbeiter angelegt.</p>';
        return;
    }

    keys.forEach(nr => {
        const item = document.createElement('div');
        item.className = 'user-item';
        item.innerHTML = `
            <span><strong>${users[nr]}</strong> (Nr. ${nr})</span>
            <button class="btn-delete" onclick="deleteUser('${nr}')">Löschen</button>
        `;
        userListDiv.appendChild(item);
    });
}

// User löschen (Nur Admin)
function deleteUser(nr) {
    if (confirm(`Möchtest du den User mit der Nr. ${nr} wirklich löschen?`)) {
        let users = JSON.parse(localStorage.getItem('users') || '{}');
        delete users[nr];
        localStorage.setItem('users', JSON.stringify(users));
        renderUserList();
    }
}

// Zeit stempeln
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

    let logs = JSON.parse(localStorage.getItem('timeLogs') || '[]');
    logs.push(entry);
    localStorage.setItem('timeLogs', JSON.stringify(logs));

    document.getElementById('status-msg').innerText = `Status: ${type} gespeichert um ${entry.time}`;
}

// CSV Exportieren
function exportCSV() {
    let logs = JSON.parse(localStorage.getItem('timeLogs') || '[]');
    if (logs.length === 0) return alert('Keine Daten zum Exportieren vorhanden!');

    let csvContent = "data:text/csv;charset=utf-8,Personalnummer;Name;Aktion;Datum;Uhrzeit\n";
    logs.forEach(row => {
        csvContent += `${row.personalNr};${row.name};${row.action};${row.date};${row.time}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Zeiterfassung_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
