document.addEventListener('DOMContentLoaded', () => {
    const views = {
        buerger: document.getElementById('buerger-view'),
        verwalter: document.getElementById('verwalter-view')
    };
    
    const ui = {
        userDisplay: document.getElementById('currentUserDisplay'),
        logoutBtn: document.getElementById('logoutBtn'),
        authSection: document.getElementById('auth-section'),
        loggedSection: document.getElementById('logged-in-section')
    };
    
    const wohnsitz = {
        card: document.getElementById('wohnsitz-status'),
        btn: document.getElementById('wohnsitz-action-btn'),
        form: document.getElementById('wohnsitz-form'),
        container: document.getElementById('wohnsitz-form-container')
    };
    
    const ausweis = {
        card: document.getElementById('ausweis-status'),
        btn: document.getElementById('ausweis-action-btn'),
        form: document.getElementById('ausweis-form'),
        container: document.getElementById('ausweis-form-container')
    };
    
    let user = null;
    let data = {
        users: {},
        wohnsitz: {},
        ausweis: {}
    };
    
    function loadData() {
        try {
            data.users = JSON.parse(localStorage.getItem('users')) || {};
            data.wohnsitz = JSON.parse(localStorage.getItem('wohnsitzAntraege')) || {};
            data.ausweis = JSON.parse(localStorage.getItem('ausweisAntraege')) || {};
        } catch (e) {e
            console.error("Fehler beim Laden der Daten");
        }
    }
    
    function saveData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Fehler beim Speichern: ${key}`);
        }
    }
    
    function showMsg(element, msg, isError = true) {
        if (!element) return;
        element.textContent = msg;
        element.style.color = isError ? 'red' : 'green';
        element.style.display = 'block';
        setTimeout(() => {
            element.textContent = '';
            element.style.display = 'none';
        }, 3000);
    }
    
    function showView(view) {
        views.buerger.classList.remove('active-view');
        views.verwalter.classList.remove('active-view');
        view.classList.add('active-view');
        
        if (view === views.verwalter) {
            updateAntraege();
        }
    }
    
    document.getElementById('switchToBuerger').addEventListener('click', () => showView(views.buerger));
    document.getElementById('switchToVerwalter').addEventListener('click', () => showView(views.verwalter));
    document.getElementById('refreshBtn').addEventListener('click', () => location.reload());
    document.getElementById('cancelWohnsitzForm').addEventListener('click', () => wohnsitz.container.style.display = 'none');
    document.getElementById('cancelAusweisForm').addEventListener('click', () => ausweis.container.style.display = 'none');
    
    document.getElementById('showRegisterLink').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    });
    
    document.getElementById('showLoginLink').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });
    
    ui.logoutBtn.addEventListener('click', () => {
        user = null;
        sessionStorage.removeItem('currentUser');
        ui.authSection.style.display = 'block';
        ui.loggedSection.style.display = 'none';
        ui.userDisplay.textContent = '';
        ui.logoutBtn.style.display = 'none';
        showView(views.buerger);
    });
    
    document.getElementById('registerBtn').addEventListener('click', () => {
        const username = document.getElementById('registerUser').value.trim();
        const password = document.getElementById('registerPass').value.trim();
        const firstName = document.getElementById('registerFirstName').value.trim();
        const lastName = document.getElementById('registerLastName').value.trim();
        const errorElem = document.getElementById('registerError');
        const successElem = document.getElementById('registerSuccess');
        
        if (!username || !password || !firstName || !lastName) {
            showMsg(errorElem, 'Alle Felder sind erforderlich.');
            return;
        }
        
        if (data.users[username]) {
            showMsg(errorElem, 'Benutzername bereits vergeben.');
            return;
        }
        
        data.users[username] = { password, firstName, lastName };
        saveData('users', data.users);
        
        document.getElementById('registerUser').value = '';
        document.getElementById('registerFirstName').value = '';
        document.getElementById('registerLastName').value = '';
        document.getElementById('registerPass').value = '';
        
        showMsg(successElem, 'Registrierung erfolgreich!', false);
        document.getElementById('showLoginLink').click();
    });
    
    document.getElementById('loginBtn').addEventListener('click', () => {
        const username = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value.trim();
        const errorElem = document.getElementById('loginError');
        
        if (!username || !password) {
            showMsg(errorElem, 'Benutzername und Passwort erforderlich.');
            return;
        }
        
        if (!data.users[username] || data.users[username].password !== password) {
            showMsg(errorElem, 'Ungültiger Benutzername oder Passwort.');
            return;
        }
        
        user = username;
        sessionStorage.setItem('currentUser', username);
        
        document.getElementById('loginUser').value = '';
        document.getElementById('loginPass').value = '';
        
        ui.authSection.style.display = 'none';
        ui.loggedSection.style.display = 'block';
        ui.userDisplay.textContent = `Angemeldet als: ${user}`;
        ui.logoutBtn.style.display = 'inline-block';
        
        updateKarten();
    });
    
    function updateKarten() {
        updateWohnsitz();
        updateAusweis();
    }
    
    function updateWohnsitz() {
        if (!user) return;
        
        const antrag = data.wohnsitz[user];
        
        if (!antrag) {
            wohnsitz.card.innerHTML = '<p>Sie haben noch keinen Wohnsitz angemeldet.</p>';
            wohnsitz.btn.textContent = 'Wohnsitz anmelden';
            wohnsitz.btn.onclick = () => {
                document.getElementById('wohnsitz-form-title').textContent = 'Wohnsitz Anmelden';
                wohnsitz.container.style.display = 'block';
            };
            return;
        }
        
        let html, btnText, btnAction;
        
        switch (antrag.status) {
            case 'pending':
                html = `
                    <p><span class="status-pending">In Bearbeitung</span></p>
                    <p>Adresse: ${antrag.strasse}, ${antrag.plz} ${antrag.ort}</p>
                `;
                btnText = 'Zurückziehen';
                btnAction = () => {
                    delete data.wohnsitz[user];
                    saveData('wohnsitzAntraege', data.wohnsitz);
                    updateWohnsitz();
                };
                break;
            case 'approved':
                html = `
                    <p><span class="status-approved">Angemeldet</span></p>
                    <p>Adresse: ${antrag.strasse}, ${antrag.plz} ${antrag.ort}</p>
                `;
                btnText = 'Ummelden';
                btnAction = () => {
                    document.getElementById('wohnsitz-form-title').textContent = 'Umzug melden';
                    wohnsitz.container.style.display = 'block';
                };
                break;
            case 'rejected':
                html = `
                    <p><span class="status-rejected">Abgelehnt</span></p>
                    <p>Grund: ${antrag.reason || 'Keine Angabe'}</p>
                `;
                btnText = 'Neu beantragen';
                btnAction = () => {
                    document.getElementById('wohnsitz-form-title').textContent = 'Wohnsitz anmelden';
                    wohnsitz.container.style.display = 'block';
                };
                break;
        }
        
        wohnsitz.card.innerHTML = html;
        wohnsitz.btn.textContent = btnText;
        wohnsitz.btn.onclick = btnAction;
    }
    
    wohnsitz.form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const strasse = document.getElementById('strasse').value.trim();
        const plz = document.getElementById('plz').value.trim();
        const ort = document.getElementById('ort').value.trim();
        const einzugsdatum = document.getElementById('einzugsdatum').value;
        const errorElement = document.getElementById('wohnsitzError');
        
        if (!strasse || !plz || !ort || !einzugsdatum) {
            showMsg(errorElement, 'Bitte alle Felder ausfüllen');
            return;
        }
        
        if (!/^\d{5}$/.test(plz)) {
            showMsg(errorElement, 'Bitte gültige PLZ eingeben');
            return;
        }
        
        data.wohnsitz[user] = {
            strasse, plz, ort, einzugsdatum,
            status: 'pending',
            datum: new Date().toISOString()
        };
        
        saveData('wohnsitzAntraege', data.wohnsitz);
        wohnsitz.container.style.display = 'none';
        updateWohnsitz();
    });
    
    function updateAusweis() {
        if (!user) return;
        
        const antrag = data.ausweis[user];
        
        if (!antrag) {
            ausweis.card.innerHTML = '<p>Sie haben noch keinen Ausweis beantragt.</p>';
            ausweis.btn.textContent = 'Ausweis beantragen';
            ausweis.btn.onclick = () => ausweis.container.style.display = 'block';
            return;
        }
        
        let html, btnText, btnAction;
        
        switch (antrag.status) {
            case 'pending':
                html = `
                    <p><span class="status-pending">Antrag wird geprüft</span></p>
                    <p>Beantragt am: ${new Date(antrag.datum).toLocaleDateString()}</p>
                `;
                btnText = 'Zurückziehen';
                btnAction = () => {
                    delete data.ausweis[user];
                    saveData('ausweisAntraege', data.ausweis);
                    updateAusweis();
                };
                break;
            case 'approved':
                html = `
                    <p><span class="status-approved">Ihr Antrag wurde genehmigt!</span></p>
                    <p>Bitte vereinbaren Sie einen Termin auf unserer Website, um Ihren Ausweis abzuholen.</p>
                `;
                btnText = 'Neuen Ausweis beantragen';
                btnAction = () => ausweis.container.style.display = 'block';
                break;
            case 'rejected':
                html = `
                    <p><span class="status-rejected">Antrag abgelehnt</span></p>
                    <p>Grund: ${antrag.reason || 'Fehlende oder ungültige Angaben'}</p>
                `;
                btnText = 'Neu beantragen';
                btnAction = () => ausweis.container.style.display = 'block';
                break;
        }
        
        ausweis.card.innerHTML = html;
        ausweis.btn.textContent = btnText;
        ausweis.btn.onclick = btnAction;
    }
    
    ausweis.form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nummer = document.getElementById('ausweisNummerAlt').value.trim();
        const ablaufdatum = document.getElementById('ablaufdatumAlt').value;
        const checkbox = document.getElementById('unterschriftCheck').checked;
        const errorElement = document.getElementById('ausweisError');
        
        if (!checkbox || !ablaufdatum) {
            showMsg(errorElement, 'Bitte Pflichtfelder ausfüllen');
            return;
        }
        
        data.ausweis[user] = {
            nummer,
            ablaufdatum,
            status: 'pending',
            datum: new Date().toISOString()
        };
        
        saveData('ausweisAntraege', data.ausweis);
        ausweis.container.style.display = 'none';
        updateAusweis();
    });
    
    function updateAntraege() {
        const wohnsitzListe = document.getElementById('antraege-list');
        const ausweisListe = document.getElementById('ausweis-antraege-list');
        
        const wAntraege = Object.entries(data.wohnsitz)
            .filter(([_, a]) => a.status === 'pending');
        
        wohnsitzListe.innerHTML = wAntraege.length === 0 
            ? '<p>Keine offenen Wohnsitz-Anträge</p>'
            : wAntraege.map(([username, a]) => `
                <div class="antrag" data-user="${username}" data-type="wohnsitz">
                    <h4>Antrag von ${username}</h4>
                    <div class="antrag-details">
                        <p>Adresse: ${a.strasse}, ${a.plz} ${a.ort}</p>
                        <p>Beantragt: ${new Date(a.datum).toLocaleDateString()}</p>
                    </div>
                    <div class="antrag-actions">
                        <button class="approve-btn">Genehmigen</button>
                        <button class="reject-btn">Ablehnen</button>
                    </div>
                </div>
            `).join('');
        
        const aAntraege = Object.entries(data.ausweis)
            .filter(([_, a]) => a.status === 'pending');
        
        ausweisListe.innerHTML = aAntraege.length === 0
            ? '<p>Keine offenen Ausweis-Anträge</p>'
            : aAntraege.map(([username, a]) => `
                <div class="antrag" data-user="${username}" data-type="ausweis">
                    <h4>Ausweis-Antrag von ${username}</h4>
                    <div class="antrag-details">
                        <p>Nr: ${a.nummer || '(nicht angegeben)'}</p>
                        <p>Ablaufdatum: ${a.ablaufdatum}</p>
                    </div>
                    <div class="antrag-actions">
                        <button class="approve-btn">Genehmigen</button>
                        <button class="reject-btn">Ablehnen</button>
                    </div>
                </div>
            `).join('');
    }
    
    document.addEventListener('click', e => {
        if (!e.target.matches('.approve-btn, .reject-btn')) return;
        
        const antrag = e.target.closest('.antrag');
        if (!antrag) return;
        
        const username = antrag.dataset.user;
        const type = antrag.dataset.type;
        const isApprove = e.target.classList.contains('approve-btn');
        
        if (type === 'wohnsitz') {
            data.wohnsitz[username].status = isApprove ? 'approved' : 'rejected';
            
            if (!isApprove) {
                data.wohnsitz[username].reason = prompt('Grund für Ablehnung:') || 'Keine Angabe';
            }
            
            saveData('wohnsitzAntraege', data.wohnsitz);
        } else if (type === 'ausweis') {
            data.ausweis[username].status = isApprove ? 'approved' : 'rejected';
            
            if (!isApprove) {
                data.ausweis[username].reason = prompt('Grund für Ablehnung:') || 'Keine Angabe';
            }
            
            saveData('ausweisAntraege', data.ausweis);
        }
        
        updateAntraege();
    });
    
    document.getElementById('deleteAllDataBtn').addEventListener('click', () => {
        if (confirm('WARNUNG: Dies löscht ALLE Daten. Fortfahren?')) {
            localStorage.clear();
            alert('Daten gelöscht.');
            location.reload();
        }
    });
    
    loadData();
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser && data.users[savedUser]) {
        user = savedUser;
        ui.authSection.style.display = 'none';
        ui.loggedSection.style.display = 'block';
        ui.userDisplay.textContent = `Angemeldet als: ${user}`;
        ui.logoutBtn.style.display = 'inline-block';
        updateKarten();
    }
}); 