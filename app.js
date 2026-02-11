// Main app logic extracted from toernooi.html
// Start with initial rows and listeners
for(let i=0; i<10; i++) addRow();
attachInputListeners();

function addRow() {
    const row = document.createElement('tr');
    row.innerHTML = `<td><input type="text" class="p-name" placeholder="Naam..."></td>
                     <td><input type="number" class="p-m1" value="0"></td>
                     <td><input type="number" class="p-m2" value="0"></td>`;
    document.getElementById('player-rows').appendChild(row);
    attachInputListeners();
}

function applyBracketCodes() {
    // removed: final is determined automatically from semifinal results
}

function updateFinalIfReady() {
    const s = window.semiResults || {};
    if(s[1] && s[2]) {
        const leftTeam = s[1];
        const rightTeam = s[2];
        document.getElementById('final-winners').innerHTML = `
            <div class="team-names">
                <span id="final-left" class="team-name final-team" data-code="${leftTeam.code}">${leftTeam.p1.name} &nbsp;&amp;&nbsp; ${leftTeam.p2.name}</span>
            </div>
            <div class="vs">VS</div>
            <div class="team-names">
                <span id="final-right" class="team-name final-team" data-code="${rightTeam.code}">${rightTeam.p1.name} &nbsp;&amp;&nbsp; ${rightTeam.p2.name}</span>
            </div>
                <div class="scores-row">
                    <button class="score-btn" onclick="changeFinalScore('${leftTeam.code}','${rightTeam.code}',-1)">−</button>
                    <input id="final-score-${leftTeam.code}" class="final-score-input" type="number" min="0" max="9" inputmode="numeric" pattern="[0-9]*" value="0">
                    <button class="score-btn" onclick="changeFinalScore('${leftTeam.code}','${rightTeam.code}',1)">+</button>

                    <button class="score-btn" onclick="changeFinalScore('${rightTeam.code}','${leftTeam.code}',-1)">−</button>
                    <input id="final-score-${rightTeam.code}" class="final-score-input" type="number" min="0" max="9" inputmode="numeric" pattern="[0-9]*" value="0">
                    <button class="score-btn" onclick="changeFinalScore('${rightTeam.code}','${leftTeam.code}',1)">+</button>
                </div>
        `;

        setupFinalAutoConfirm(leftTeam.code, rightTeam.code);
        try { evaluateFinal(leftTeam.code, rightTeam.code); } catch(e){}
        window.finalWinner = null;
        removeFinalFlash();
        autoSave();
    }
}

function getPlayersFromInputs() {
    const players = [];
    const names = document.querySelectorAll('.p-name');
    const m1s = document.querySelectorAll('.p-m1');
    const m2s = document.querySelectorAll('.p-m2');
    names.forEach((n, i) => {
        const name = n.value.trim();
        const m1 = parseInt((m1s[i] && m1s[i].value) || 0, 10) || 0;
        const m2 = parseInt((m2s[i] && m2s[i].value) || 0, 10) || 0;
        if(name !== '') players.push({ name, m1, m2, total: m1 + m2 });
    });
    return players;
}

function autoSave() {
    const players = getPlayersFromInputs();
    const teams = window.currentTeams || [];
    const semiResults = window.semiResults || {};
    const data = { players, teams, semiResults, finalWinner: window.finalWinner || null, timestamp: new Date().toISOString() };
    try {
        fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(err => {
            console.error('autosave POST failed', err);
            try { localStorage.setItem('toernooi_data', JSON.stringify(data)); } catch(e) {}
        });
    } catch(e) {
        try { localStorage.setItem('toernooi_data', JSON.stringify(data)); } catch(e) {}
    }
    try { populatePlayerScoreboard(getPlayersFromInputs()); } catch(e) {}
}

function attachInputListeners() {
    const names = document.querySelectorAll('.p-name');
    const m1s = document.querySelectorAll('.p-m1');
    const m2s = document.querySelectorAll('.p-m2');
    const handler = () => { autoSave(); try { populatePlayerScoreboard(getPlayersFromInputs()); } catch(e){} };
    names.forEach(n => { n.removeEventListener('input', handler); n.addEventListener('input', handler); });
    m1s.forEach(i => { i.removeEventListener('input', handler); i.addEventListener('input', handler); });
    m2s.forEach(i => { i.removeEventListener('input', handler); i.addEventListener('input', handler); });
}

function setupAutoConfirmForSemi(codeA, codeB, semiIndex) {
    const aEl = document.getElementById('score-' + codeA);
    const bEl = document.getElementById('score-' + codeB);
    if(!aEl || !bEl) return;
    const tryAuto = () => evaluateSemi(codeA, codeB, semiIndex);
    aEl.addEventListener('input', tryAuto);
    bEl.addEventListener('input', tryAuto);
}

function setupFinalAutoConfirm(codeA, codeB) {
    const aEl = document.getElementById('final-score-' + codeA);
    const bEl = document.getElementById('final-score-' + codeB);
    if(!aEl || !bEl) return;
    const clampAndTry = (e) => {
        const t = e.target;
        let v = parseInt(t.value || 0, 10) || 0;
        if(v < 0) v = 0;
        if(v > 9) v = 9;
        if(String(t.value) !== String(v)) t.value = v;
        try { evaluateFinal(codeA, codeB); } catch(e) {}
    };
    aEl.addEventListener('input', clampAndTry);
    bEl.addEventListener('input', clampAndTry);
    aEl.addEventListener('change', clampAndTry);
    bEl.addEventListener('change', clampAndTry);
}

function evaluateFinal(codeA, codeB) {
    const aEl = document.getElementById('final-score-' + codeA);
    const bEl = document.getElementById('final-score-' + codeB);
    if(!aEl || !bEl) return;
    const aVal = parseInt(aEl.value || 0, 10) || 0;
    const bVal = parseInt(bEl.value || 0, 10) || 0;
    const teams = window.currentTeams || [];
    const teamA = teams.find(t => t.code === codeA);
    const teamB = teams.find(t => t.code === codeB);
    if(!teamA || !teamB) return;
    if((aVal >= 9 || bVal >= 9)) {
        if(aVal > bVal) { declareFinalWinner(codeA); return; }
        if(bVal > aVal) { declareFinalWinner(codeB); return; }
    }
    // no textual final-winner note shown here; visual highlight + confetti are used
}

function declareFinalWinner(code) {
    const teams = window.currentTeams || [];
    const winner = teams.find(t => t.code === code);
    if(!winner) return;
    window.finalWinner = winner;
    removeFinalFlash();
    const leftEl = document.getElementById('final-left');
    const rightEl = document.getElementById('final-right');
    if(leftEl && rightEl) {
        const leftCode = leftEl.dataset && leftEl.dataset.code;
        const rightCode = rightEl.dataset && rightEl.dataset.code;
        if(leftCode === winner.code) {
            leftEl.classList.add('flash','winner-text');
            rightEl.classList.add('loser-text');
        } else if(rightCode === winner.code) {
            rightEl.classList.add('flash','winner-text');
            leftEl.classList.add('loser-text');
        }
    }
    // no textual final-winner note; keep visual highlight and confetti
    try { runConfetti(true); } catch(e){}
    autoSave();
}

function removeFinalFlash() {
    const leftEl = document.getElementById('final-left');
    const rightEl = document.getElementById('final-right');
    if(leftEl) { leftEl.classList.remove('flash'); leftEl.classList.remove('winner-text','loser-text'); }
    if(rightEl) { rightEl.classList.remove('flash'); rightEl.classList.remove('winner-text','loser-text'); }
}

function runConfetti() {
    const persistent = arguments.length ? !!arguments[0] : false;
    if(persistent && window._confettiRunning) return;
    const canvas = persistent && window._confettiCanvas ? window._confettiCanvas : document.createElement('canvas');
    if(persistent) { window._confettiCanvas = canvas; window._confettiRunning = true; }
    canvas.style.position = 'fixed'; canvas.style.left = 0; canvas.style.top = 0; canvas.style.pointerEvents = 'none';
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    if(!canvas.parentNode) document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const root = getComputedStyle(document.documentElement);
    const orange = (root.getPropertyValue('--cs-orange') || '#ff9d00').trim();
    const colors = [orange, '#ffd700', '#ffdd57', '#ffb84d'];
    const particles = [];
    for(let i=0;i<180;i++) particles.push({ x: Math.random()*canvas.width, y: Math.random()*-canvas.height, r: (Math.random()*6)+4, d: Math.random()*50, color: colors[Math.floor(Math.random()*colors.length)], tilt: Math.random()*10-10 });
    function draw() { ctx.clearRect(0,0,canvas.width, canvas.height); particles.forEach(p => { ctx.fillStyle = p.color; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r*0.6, p.tilt*Math.PI/180, 0, Math.PI*2); ctx.fill(); }); }
    function update() { const now = Date.now(); particles.forEach(p => { p.y += Math.random()*6 + 2; p.x += Math.sin(now/100 + p.d) * 2; p.tilt += 0.5; if(p.y > canvas.height + 20) { p.y = -10; p.x = Math.random()*canvas.width; } }); }
    function loop() { draw(); update(); if(persistent) { if(window.finalWinner) requestAnimationFrame(loop); else { window._confettiRunning = false; if(canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); window._confettiCanvas = null; } } else { const duration = 3000; const end = Date.now() + duration; (function burst(){ draw(); update(); if(Date.now() < end) requestAnimationFrame(burst); else { if(canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); } })(); } }
    loop();
}

function evaluateSemi(codeA, codeB, semiIndex) {
    const aVal = parseInt((document.getElementById('score-' + codeA) && document.getElementById('score-' + codeA).value) || 0, 10) || 0;
    const bVal = parseInt((document.getElementById('score-' + codeB) && document.getElementById('score-' + codeB).value) || 0, 10) || 0;
    const teams = window.currentTeams || [];
    const teamA = teams.find(t => t.code === codeA);
    const teamB = teams.find(t => t.code === codeB);
    if(!teamA || !teamB) return;
    const prev = (window.semiResults || {})[semiIndex] || null;
    let winner = null;
    if(aVal >= 9 && aVal > bVal) winner = teamA;
    else if(bVal >= 9 && bVal > aVal) winner = teamB;
    const prevCode = prev ? prev.code : null;
    const newCode = winner ? winner.code : null;
    if(prevCode !== newCode) {
        window.semiResults = window.semiResults || {};
        window.semiResults[semiIndex] = winner;
        // winner text removed; visual highlight handled via classes
        const leftId = `semi${semiIndex}-left`;
        const rightId = `semi${semiIndex}-right`;
        const leftEl = document.getElementById(leftId);
        const rightEl = document.getElementById(rightId);
        if(leftEl && rightEl) {
            if(winner === teamA) { leftEl.classList.add('winner-text'); leftEl.classList.remove('loser-text'); rightEl.classList.add('loser-text'); rightEl.classList.remove('winner-text'); }
            else if(winner === teamB) { rightEl.classList.add('winner-text'); rightEl.classList.remove('loser-text'); leftEl.classList.add('loser-text'); leftEl.classList.remove('winner-text'); }
            else { leftEl.classList.remove('winner-text','loser-text'); rightEl.classList.remove('winner-text','loser-text'); }
        }
        updateFinalIfReady();
        autoSave();
    }
}

function changeSemiScore(code, otherCode, delta, semiIndex) {
    const el = document.getElementById('score-' + code);
    if(!el) return;
    let val = parseInt(el.value || 0, 10) || 0;
    val += delta;
    if(val < 0) val = 0;
    el.value = val;
    // ensure we evaluate the semi using both codes
    try { evaluateSemi(code, otherCode, semiIndex); } catch(e) {}
}

function changeFinalScore(code, otherCode, delta) {
    const el = document.getElementById('final-score-' + code);
    if(!el) return;
    let val = parseInt(el.value || 0, 10) || 0;
    val += delta;
    if(val < 0) val = 0;
    if(val > 9) val = 9;
    el.value = val;
    try { evaluateFinal(code, otherCode); } catch(e) {}
}

function populatePlayerScoreboard(players) {
    const tbody = document.getElementById('player-scoreboard-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    const sorted = (players || []).slice().sort((a,b) => b.total - a.total);
    sorted.forEach(p => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${p.name}</td><td>${p.m1}</td><td>${p.m2}</td><td>${p.total}</td>`; tbody.appendChild(tr); });
}

function fillDummyData() {
    const sample = [
        {name: 'Alpha', m1: 12, m2: 9},
        {name: 'Bravo', m1: 11, m2: 10},
        {name: 'Charlie', m1: 9, m2: 8},
        {name: 'Delta', m1: 8, m2: 7},
        {name: 'Echo', m1: 7, m2: 6},
        {name: 'Foxtrot', m1: 6, m2: 5},
        {name: 'Golf', m1: 5, m2: 4},
        {name: 'Hotel', m1: 4, m2: 3},
        {name: 'India', m1: 3, m2: 2},
        {name: 'Juliet', m1: 2, m2: 1},
        {name: 'Kilo', m1: 1, m2: 0},
        {name: 'Lima', m1: 0, m2: 0}
    ];
    const tbody = document.getElementById('player-rows');
    tbody.innerHTML = '';
    sample.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `<td><input type="text" class="p-name" value="${s.name}"></td>` +
                        `<td><input type="number" class="p-m1" value="${s.m1}"></td>` +
                        `<td><input type="number" class="p-m2" value="${s.m2}"></td>`;
        tbody.appendChild(row);
    });
    startKnockout();
}

function startKnockout() {
    let players = getPlayersFromInputs();
    if(players.length < 8) return alert("Je hebt minimaal 8 spelers nodig voor de top 8!");
    players.sort((a, b) => b.total - a.total);
    window.currentPlayers = players;
    const top8 = players.slice(0, 8);
    const teams = [
        { id: "Team 1", p1: top8[0], p2: top8[7], rank: "1 & 8" },
        { id: "Team 2", p1: top8[1], p2: top8[6], rank: "2 & 7" },
        { id: "Team 3", p1: top8[2], p2: top8[5], rank: "3 & 6" },
        { id: "Team 4", p1: top8[3], p2: top8[4], rank: "4 & 5" }
    ];
    teams.forEach((t, i) => { t.code = 'C' + (i+1); });
    window.currentTeams = teams;
    document.getElementById('m1-content').innerHTML = `
        <div class="team-names">
            <span id="semi1-left" class="team-name">${teams[0].p1.name} &nbsp;&amp;&nbsp; ${teams[0].p2.name}</span>
        </div>
        <div class="vs">VS</div>
        <div class="team-names">
            <span id="semi1-right" class="team-name">${teams[3].p1.name} &nbsp;&amp;&nbsp; ${teams[3].p2.name}</span>
        </div>
        <div class="scores-row">
            <button class="score-btn" onclick="changeSemiScore('${teams[0].code}','${teams[3].code}',-1,1)">−</button>
            <input id="score-${teams[0].code}" class="team-score-input" type="number" min="0" max="9" value="0">
            <button class="score-btn" onclick="changeSemiScore('${teams[0].code}','${teams[3].code}',1,1)">+</button>

            <button class="score-btn" onclick="changeSemiScore('${teams[3].code}','${teams[0].code}',-1,1)">−</button>
            <input id="score-${teams[3].code}" class="team-score-input" type="number" min="0" max="9" value="0">
            <button class="score-btn" onclick="changeSemiScore('${teams[3].code}','${teams[0].code}',1,1)">+</button>
        </div>
    `;
    document.getElementById('m2-content').innerHTML = `
        <div class="team-names">
            <span id="semi2-left" class="team-name">${teams[1].p1.name} &nbsp;&amp;&nbsp; ${teams[1].p2.name}</span>
        </div>
        <div class="vs">VS</div>
        <div class="team-names">
            <span id="semi2-right" class="team-name">${teams[2].p1.name} &nbsp;&amp;&nbsp; ${teams[2].p2.name}</span>
        </div>
        <div class="scores-row">
            <button class="score-btn" onclick="changeSemiScore('${teams[1].code}','${teams[2].code}',-1,2)">−</button>
            <input id="score-${teams[1].code}" class="team-score-input" type="number" min="0" max="9" value="0">
            <button class="score-btn" onclick="changeSemiScore('${teams[1].code}','${teams[2].code}',1,2)">+</button>

            <button class="score-btn" onclick="changeSemiScore('${teams[2].code}','${teams[1].code}',-1,2)">−</button>
            <input id="score-${teams[2].code}" class="team-score-input" type="number" min="0" max="9" value="0">
            <button class="score-btn" onclick="changeSemiScore('${teams[2].code}','${teams[1].code}',1,2)">+</button>
        </div>
    `;
    window.semiResults = { 1: null, 2: null };
    setupAutoConfirmForSemi(teams[0].code, teams[3].code, 1);
    setupAutoConfirmForSemi(teams[1].code, teams[2].code, 2);
    autoSave();
    populatePlayerScoreboard(window.currentPlayers || []);
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('bracket-view').classList.remove('hidden');
}
