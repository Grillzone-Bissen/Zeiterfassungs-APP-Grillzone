const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxILO_m7PVf3J3fW6dtjemzfT1LK5L4lDp3s3iK_dZl-mCmxfkKHrynKalJUn-ERnPcTw/exec";

let currentUser = null;
let selectedManualUser = null;

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

function handleLoginSubmit(event) {
    if (event) event.preventDefault();
    login();
}

function login() {
    const inputEl = document.getElementById('personal-nr-input');
    const errorMsg = document.getElementById('login-error-msg');
    if (errorMsg) errorMsg.innerText = '';

    if (!inputEl) return;
    const nrInput = inputEl.value.trim();

    if (!nrInput) {
        if (errorMsg) errorMsg.innerText = "Bitte Personalnummer eingeben!";
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');

    if (nrInput === '99') {
        users['99'] = { nr: '99', name: 'Administrator', isAdmin: true };
        localStorage.setItem('users', JSON.stringify(users));
    }

    let user = users[nrInput];

    if (!user) {
        if (errorMsg) errorMsg.innerText = `Personalnummer ${nrInput} nicht gefunden!`;
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
    selectedManualUser = null;
    const inputEl = document.getElementById('personal-nr-input');
    const errorMsg = document.getElementById('login-error-msg');
    
    if (inputEl) inputEl.value = '';
    if (errorMsg) errorMsg.innerText = '';

    // Manuelles Formular zurücksetzen
    const manualForm = document.getElementById('manual-time-form');
    if (manualForm) manualForm.classList.add('hidden');

    document.getElementById('time-view').classList.add('hidden');
    document.getElementById('admin-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
}

function stamp(type) {
    if (!currentUser) return;

    const now = new Date();

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

    let history = JSON.parse(localStorage.getItem('stampHistory') || '[]');
    history.push(entry);
    localStorage.setItem('stampHistory', JSON.stringify(history));

    document.getElementById('status-msg').innerText = `Status: ${type} um ${entry.time} Uhr`;

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
                <button type="button" onclick="deleteUser('${nr}')" class="btn btn-danger" style="width: auto; padding: 4px 10px; margin: 0; font-size: 12px;">Löschen</button>
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
// MANUELLE ZEITERFASSUNG (Nur Admin 99)
// =========================================================
function openManualTimeForm() {
    const inputEl = document.getElementById('manual-user-nr');
    if (!inputEl) return;

    const nrInput = inputEl.value.trim();
    if (!nrInput) {
        alert("Bitte eine Personalnummer eingeben!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Typsicherer Abgleich: Suchen nach passendem Schlüssel
    let foundKey = Object.keys(users).find(key => String(key).trim() === String(nrInput));
    let targetUser = foundKey ? users[foundKey] : null;

    if (!targetUser) {
        alert(`Mitarbeiter mit Personalnummer ${nrInput} wurde nicht gefunden!`);
        return;
    }

    selectedManualUser = targetUser;

    const headerEl = document.getElementById('manual-selected-user-header');
    if (headerEl) {
        headerEl.innerText = `Manuelle Erfassung für: ${targetUser.name} (Nr. ${targetUser.nr})`;
    }

    // Heutiges Datum als Standard setzen (YYYY-MM-DD)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const todayStr = `${year}-${month}-${day}`;

    document.getElementById('manual-date').value = todayStr;
    document.getElementById('manual-start-time').value = "08:00";
    document.getElementById('manual-end-time').value = "16:30";

    // Formular direkt einblenden über Inline-Style
    const formEl = document.getElementById('manual-time-form');
    if (formEl) {
        formEl.classList.remove('hidden');
        formEl.style.display = 'block';
    }
}

function submitManualTime() {
    if (!selectedManualUser) {
        alert("Kein Mitarbeiter ausgewählt!");
        return;
    }

    const rawDate = document.getElementById('manual-date').value;
    const startTime = document.getElementById('manual-start-time').value;
    const endTime = document.getElementById('manual-end-time').value;

    if (!rawDate || !startTime || !endTime) {
        alert("Bitte Datum, Arbeitsbeginn und Arbeitsende vollständig ausfüllen!");
        return;
    }

    // Datum in DD.MM.YYYY umwandeln
    const dateParts = rawDate.split('-');
    const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;

    // Sekunden anfügen (HH:MM:SS)
    const formattedStart = startTime.length === 5 ? `${startTime}:00` : startTime;
    const formattedEnd = endTime.length === 5 ? `${endTime}:00` : endTime;

    const startEntry = {
        personalNr: String(selectedManualUser.nr),
        name: selectedManualUser.name,
        action: "Arbeitsbeginn",
        date: formattedDate,
        time: formattedStart
    };

    const endEntry = {
        personalNr: String(selectedManualUser.nr),
        name: selectedManualUser.name,
        action: "Arbeitsende",
        date: formattedDate,
        time: formattedEnd
    };

    // Daten nacheinander an Google Sheets senden
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(startEntry)
    })
    .then(() => {
        return fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(endEntry)
        });
    })
    .then(() => {
        alert(`Zeiten für ${selectedManualUser.name} erfolgreich nachgetragen!`);
        
        const formEl = document.getElementById('manual-time-form');
        if (formEl) {
            formEl.style.display = 'none';
            formEl.classList.add('hidden');
        }
        document.getElementById('manual-user-nr').value = '';
        selectedManualUser = null;
    })
    .catch(err => {
        console.error("Fehler beim Nachtragen:", err);
        alert("Fehler beim Übertragen an Google Sheets!");
    });
}

// CORS-Sicherer CSV Export ohne AJAX-Sperre
function exportCSV() {
    window.location.href = GOOGLE_SCRIPT_URL;
}
