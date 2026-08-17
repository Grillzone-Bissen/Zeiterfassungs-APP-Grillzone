const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMUIZJmCpYpW0Mnaebqx6uM2qmgyv8OMFv2Ch49f888y4PVIVFLxyrXUcNbFU1ViBW/exec";
                            
let currentUser = null;
const ADMIN_CODE = "99";

function initAdmin() {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users[ADMIN_CODE]) {
        users[ADMIN_CODE] = "Administrator";
        localStorage.setItem('users', JSON.stringify(users));
    }
}
initAdmin();

function login() {
    const nrInput = document.getElementById('personal-nr-input');
    if (!nrInput) return;
    
    const nr = nrInput.value.trim();
    if (!nr) return alert('Bitte gib eine Personalnummer ein!');

    if (nr === ADMIN_CODE) {
        currentUser = { nr: ADMIN_CODE, name: "Administrator", isAdmin: true };
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('admin-view').classList.remove('hidden');
        renderUserList();
        return;
    }

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

function logout() {
    currentUser = null;
    document.getElementById('personal-nr-input').value = '';
    document.getElementById('time-view').classList.add('hidden');
    document.getElementById('admin-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
}

function createUser() {
    const nameInput = document.getElementById('new-name');
    const nrInput = document.getElementById('new-nr');
    const name = nameInput.value.trim();
    const nr = nrInput.value.trim();

    if (!name || !nr) return alert('Bitte Name und Personalnummer eingeben!');
    if (nr === ADMIN_CODE) return alert('Die Personalnummer 99 ist für den Admin reserviert!');

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[nr]) return alert('Diese Personalnummer existiert bereits!');

    users[nr] = name;
    localStorage.setItem('users', JSON.stringify(users));
    
    alert(`User ${name} (Nr. ${nr}) angelegt!`);
    nameInput.value = '';
    nrInput.value = '';
    renderUserList();
}

function renderUserList() {
    const userListDiv = document.getElementById('user-list');
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    userListDiv.innerHTML = '';

    const keys = Object.keys(users).filter(nr => nr !== ADMIN_CODE);
    if (keys.length === 0) {
        userListDiv.innerHTML = '<p style="color: #666;">Keine regulären Mitarbeiter angelegt.</p>';
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

function deleteUser(nr) {
    if (confirm(`Möchtest du den User mit der Nr. ${nr} wirklich löschen?`)) {
        let users = JSON.parse(localStorage.getItem('users') || '{}');
        delete users[nr];
        localStorage.setItem('users', JSON.stringify(users));
        renderUserList();
    }
}

// ZEIT STEMPELN UND AN GOOGLE SHEETS SENDEN
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

    // 1. Lokales Backup im Browser speichern
    let logs = JSON.parse(localStorage.getItem('timeLogs') || '[]');
    logs.push(entry);
    localStorage.setItem('timeLogs', JSON.stringify(logs));

    document.getElementById('status-msg').innerText = `Status: ${type} gespeichert um ${entry.time}`;

    // 2. An Google Sheets senden
    if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.startsWith("https://script.google.com")) {
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(entry)
        }).then(() => {
            console.log('Erfolgreich an Google Sheets gesendet.');
        }).catch(err => {
            console.error('Fehler beim Senden an Google Sheets:', err);
        });
    }
}

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
}

// =========================================================
// MANUELLE ZEITERFASSUNG (NACHBUCHUNG)
// =========================================================

// Modal öffnen & Datum auf heute vorbelegen
function openManualStampModal() {
    const modal = document.getElementById('manual-stamp-modal');
    if (modal) {
        modal.style.display = 'flex'; // Öffnet das Fenster
    }
    // Heutiges Datum als Vorgabe setzen (Format: YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('manual-date');
    if (dateInput) {
        dateInput.value = today;
    }
}

// Modal schließen
function closeManualStampModal() {
    const modal = document.getElementById('manual-stamp-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Manuelle Zeiterfassung absenden
function submitManualStamp() {
    const nr = document.getElementById('manual-nr').value.trim();
    const rawDate = document.getElementById('manual-date').value; // Format: YYYY-MM-DD
    const action = document.getElementById('manual-action').value;
    const time = document.getElementById('manual-time').value; // Format: HH:MM

    if (!nr || !rawDate || !time) {
        alert("Bitte fülle alle Felder aus (Personalnummer, Datum und Uhrzeit)!");
        return;
    }

    // Datum von YYYY-MM-DD in deutsches Format D.M.YYYY umwandeln
    const dateParts = rawDate.split("-");
    const formattedDate = `${parseInt(dateParts[2], 10)}.${parseInt(dateParts[1], 10)}.${dateParts[0]}`;
    const formattedTime = `${time}:00`; // Sekunden ergänzen

    // Name aus den lokal gespeicherten Mitarbeitern ermitteln (falls vorhanden)
    let employees = JSON.parse(localStorage.getItem('users') || '[]');
    let emp = employees.find(e => String(e.nr) === String(nr));
    let name = emp ? emp.name : `Mitarbeiter ${nr}`;

    const entry = {
        personalNr: nr,
        name: name,
        action: action,
        date: formattedDate,
        time: formattedTime,
        isManual: true // Kennzeichnung für manuelle Nachbuchung
    };

    // An Google Script senden
    if (typeof GOOGLE_SCRIPT_URL !== 'undefined' && GOOGLE_SCRIPT_URL.startsWith("https://script.google.com")) {
        fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(entry)
        }).then(() => {
            alert(`Manuelle Buchung für Personal-Nr. ${nr} (${action} am ${formattedDate} um ${time}) wurde gespeichert.`);
            closeManualStampModal();
        }).catch(err => {
            console.error('Fehler beim Senden:', err);
            alert('Fehler beim Speichern der manuellen Buchung.');
        });
    } else {
        alert("Google Script URL fehlt oder ist ungültig.");
    }
}
