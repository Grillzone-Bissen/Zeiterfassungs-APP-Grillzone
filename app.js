let currentUser = null;

// User anlegen
function createUser() {
    const name = document.getElementById('new-name').value.trim();
    const nr = document.getElementById('new-nr').value.trim();
    if (!name || !nr) return alert('Bitte Name und Personalnummer eingeben!');

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    users[nr] = name;
    localStorage.setItem('users', JSON.stringify(users));
    alert(`User ${name} mit Nr. ${nr} wurde angelegt!`);
    document.getElementById('new-name').value = '';
    document.getElementById('new-nr').value = '';
}

// Login
function login() {
    const nr = document.getElementById('personal-nr-input').value.trim();
    let users = JSON.parse(localStorage.getItem('users') || '{}');

    if (users[nr]) {
        currentUser = { nr: nr, name: users[nr] };
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
    document.getElementById('login-view').classList.remove('hidden');
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
}
