const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxsDTXBlBWWMqtVRkYOcM4ycGpN0pePYOt-bX5fmoPBwitLmhptggiC5PpL-4Ufc8CU/exec";

// Notfall-Master-PIN (Superadmin Fallback)
const SUPERADMIN_PIN = "10041976";

let currentUser = null;
let selectedManualUser = null;

window.addEventListener('DOMContentLoaded', () => {
    initUsers();
    initPin();
});

function initUsers() {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (!users['99']) {
        users['99'] = { nr: '99', name: 'Administrator', isAdmin: true };
        localStorage.setItem('users', JSON.stringify(users));
    }
}

function initPin() {
    if (!localStorage.getItem('adminPin')) {
        localStorage.setItem('adminPin', '1234'); // Standard-PIN
    }
}

// Zentrale Formular-Steuerung (Formular-Submit ohne verschachtelte Forms)
function handleLoginSubmit(event) {
    if (event) event.preventDefault();

    const pinContainer = document.getElementById('admin-pin-container');
    
    // Wenn das PIN-Feld bereits eingeblendet ist -> PIN prüfen
    if (pinContainer && pinContainer.style.display === 'block') {
        verifyAdminPin();
    } else {
        // Ansonsten ganz normaler Login
        login();
    }
}

function login() {
    const inputEl = document.getElementById('personal-nr-input');
    const errorMsg = document.getElementById('login-error-msg');
    const pinContainer = document.getElementById('admin-pin-container');
    const submitBtn = document.getElementById('login-submit-btn');

    if (errorMsg) errorMsg.innerText = '';

    if (!inputEl) return;
    const nrInput = inputEl.value.trim();

    if (!nrInput) {
        if (errorMsg) errorMsg.innerText = "Bitte Personalnummer eingeben!";
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');

    // WENN ADMIN 99 GEWÄHLT WURDE
    if (nrInput === '99') {
        users['99'] = { nr: '99', name: 'Administrator', isAdmin: true };
        localStorage.setItem('users', JSON.stringify(users));
        
        // PIN-Feld einblenden & Button-Text anpassen
        if (pinContainer) {
            pinContainer.style.display = 'block';
            if (submitBtn) submitBtn.innerText = "PIN Bestätigen";
            
            const pinInput = document.getElementById('admin-pin-input');
            if (pinInput) pinInput.focus();
        }
        return;
    }

    // Normaler Mitarbeiter
    if (pinContainer) pinContainer.style.display = 'none';

    let foundKey = Object.keys(users).find(key => String(key).trim() === String(nrInput));
    let user = foundKey ? users[foundKey] : null;

    if (!user) {
        if (errorMsg) errorMsg.innerText = `Personalnummer ${nrInput} nicht gefunden!`;
        return;
    }

    currentUser = user;
    
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('time-view').style.display = 'block';
    document.getElementById('welcome-msg').innerText = `Willkommen, ${currentUser.name}!`;
    document.getElementById('status-msg').innerText = "Status: Bereit";
}

function verifyAdminPin() {
    const pinInput = document.getElementById('admin-pin-input').value.trim();
    const errorMsg = document.getElementById('login-error-msg');
    const savedPin = localStorage.getItem('adminPin') || '1234';

    if (pinInput === savedPin || pinInput === SUPERADMIN_PIN) {
        let users = JSON.parse(localStorage.getItem('users') || '{}');
        currentUser = users['99'];

        document.getElementById('login-view').style.display = 'none';
        document.getElementById('admin-view').style.display = 'block';
        document.getElementById('admin-pin-input').value = '';
        
        const pinContainer = document.getElementById('admin-pin-container');
        if (pinContainer) pinContainer.style.display = 'none';

        renderUserList();

        if (pinInput === SUPERADMIN_PIN) {
            alert(`Master-PIN akzeptiert!\nDer aktuell eingestellte normale PIN lautet: ${savedPin}`);
        }
    } else {
        if (errorMsg) errorMsg.innerText = "Falscher Admin PIN!";
    }
}

function changeAdminPin() {
    const currentInput = document.getElementById('current-pin-input').value.trim();
    const newInput = document.getElementById('new-pin-input').value.trim();
    const savedPin = localStorage.getItem('adminPin') || '1234';

    if (currentInput !== savedPin && currentInput !== SUPERADMIN_PIN) {
        alert("Der aktuelle PIN ist falsch!");
        return;
    }

    if (!newInput || newInput.length < 4) {
        alert("Der neue PIN muss mindestens 4 Zeichen lang sein!");
        return;
    }

    localStorage.setItem('adminPin', newInput);
    alert("Admin PIN erfolgreich geändert!");

    document.getElementById('current-pin-input').value = '';
    document.getElementById('new-pin-input').value = '';
}

function logout() {
    currentUser = null;
    selectedManualUser = null;

    const inputEl = document.getElementById('personal-nr-input');
    const errorMsg = document.getElementById('login-error-msg');
    const pinContainer = document.getElementById('admin-pin-container');
    const formEl = document.getElementById('manual-time-form');
    const submitBtn = document.getElementById('login-submit-btn');

    if (inputEl) inputEl.value = '';
    if (errorMsg) errorMsg.innerText = '';
    if (pinContainer) pinContainer.style.display = 'none';
    if (formEl) formEl.style.display = 'none';
    if (submitBtn) submitBtn.innerText = "Einloggen";

    document.getElementById('time-view').style.display = 'none';
    document.getElementById('admin-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'block';
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

function openManualTimeForm() {
    const inputEl = document.getElementById('manual-user-nr');
    if (!inputEl) return;

    const nrInput = inputEl.value.trim();
    if (!nrInput) {
        alert("Bitte eine Personalnummer eingeben!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    let foundKey = Object.keys(users).find(key => String(key).trim() === String(nrInput));
    let targetUser = foundKey ? users[foundKey] : null;

    if (!targetUser) {
        alert(`Mitarbeiter mit Personalnummer ${nrInput} wurde nicht gefunden!`);
        return;
    }

    // Header aktualisieren
    const headerEl = document.getElementById('manual-selected-user-header');
    if (headerEl) {
        headerEl.innerText = `Manuelle Erfassung für: ${targetUser.name || targetUser} (Nr. ${nrInput})`;
    }

    // Datum auf heute setzen
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const todayStr = `${year}-${month}-${day}`;

    const dateEl = document.getElementById('manual-date');
    if (dateEl) dateEl.value = todayStr;

    // UHRZEIT-FELDER EXPLIZIT LEEREN (Keine Standardwerte 08:00 / 16:30!)
    const startEl = document.getElementById('manual-start-time');
    const endEl = document.getElementById('manual-end-time');
    if (startEl) startEl.value = "";
    if (endEl) endEl.value = "";

    const formEl = document.getElementById('manual-time-form');
    if (formEl) formEl.style.display = 'block';
}

function submitManualTime() {
    const userNrInput = document.getElementById('manual-user-nr');
    const dateInput = document.getElementById('manual-date');
    const startInput = document.getElementById('manual-start-time');
    const endInput = document.getElementById('manual-end-time');

    if (!userNrInput || !dateInput || !startInput || !endInput) {
        alert("Fehler: Formular-Elemente im HTML nicht gefunden.");
        return;
    }

    const userNr = userNrInput.value.trim();
    const dateVal = dateInput.value.trim(); // Format: YYYY-MM-DD
    const startTime = startInput.value.trim();
    const endTime = endInput.value.trim();

    if (!startTime && !endTime) {
        alert("Bitte gib mindestens den Arbeitsbeginn ODER das Arbeitsende ein!");
        return;
    }

    // FAKT 1: Datum sicher von YYYY-MM-DD nach DD.MM.YYYY umwandeln
    let formattedDate = dateVal;
    if (dateVal.includes("-")) {
        const parts = dateVal.split("-"); // [YYYY, MM, DD]
        formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
    }

    // FAKT 2: Namen garantiert aus dem localStorage auflösen (kein undefined)
    let empName = "Unbekannt";
    try {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const foundKey = Object.keys(users).find(key => String(key).trim() === String(userNr));
        if (foundKey && users[foundKey]) {
            empName = typeof users[foundKey] === 'object' ? users[foundKey].name : users[foundKey];
        }
    } catch (e) {
        console.error("Fehler beim Lesen aus localStorage:", e);
    }

    // Sende-Aktionen ausführen
    if (startTime !== "") {
        sendToGoogleScript({
            date: formattedDate,
            time: startTime,
            personalNr: userNr,
            name: empName,
            action: "Arbeitsbeginn"
        });
    }

    if (endTime !== "") {
        sendToGoogleScript({
            date: formattedDate,
            time: endTime,
            personalNr: userNr,
            name: empName,
            action: "Arbeitsende"
        });
    }

    // Formular leeren & schließen
    startInput.value = "";
    endInput.value = "";
    const formEl = document.getElementById('manual-time-form');
    if (formEl) formEl.style.display = 'none';

    alert("Zeiten erfolgreich übertragen!");
}

function exportCSV() {
    window.location.href = GOOGLE_SCRIPT_URL;
}
function sendToGoogleScript(data) {
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(() => {
        console.log("Erfolgreich an Google gesendet:", data);
    })
    .catch(error => {
        console.error("Fehler beim Senden:", error);
        alert("Fehler beim Übertragen der Daten an Google Sheets!");
    });
}
