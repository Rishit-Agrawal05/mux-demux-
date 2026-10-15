const boardLayout = [
    ['StartRed,Red', 'StartBlue,Blue', 'StartYellow,Yellow', 'None,Red', 'IonStorm,Red', 'None,Yellow', 'Asteroid,Red', 'None,Blue'],
    ['None,Blue', 'None,Red', 'Num7,Blue', 'None,Red', 'None,Blue', 'None,Red', 'IonStorm,Red', 'None,Yellow'],
    ['None,Yellow', 'None,Red', 'Num4,Yellow', 'None,Yellow', 'IonStorm,Red', 'GravityWell,Red', 'None,Red', 'Asteroid,Red'],
    ['None,Blue', 'GravityWell,Red', 'IonStorm,Red', 'Num2,Blue', 'None,Blue', 'None,Red', 'None,Blue', 'GravityWell,Red'],
    ['None,Blue', 'None,Yellow', 'Asteroid,Red', 'None,Red', 'IonStorm,Red', 'None,Blue', 'None,Yellow', 'None,Red'],
    ['None,Blue', 'Num9,Blue', 'GravityWell,Red', 'None,Yellow', 'IonStorm,Red', 'None,Red', 'None,Blue', 'None,Yellow'],
    ['None,Yellow', 'Asteroid,Red', 'None,Blue', 'None,Blue', 'None,Yellow', 'IonStorm,Red', 'None,Red', 'None,Blue'],
    ['TargetRed,None', 'Asteroid,Red', 'None,Yellow', 'TargetBlue,None', 'IonStorm,Red', 'None,Blue', 'Asteroid,Red', 'TargetYellow,None']
];

// Light obfuscation only (a browser-only page can never truly hide a secret).
const FINAL_CODE_B64 = 'NTE4Mw==';      // final module code
const RESET_CODE_B64 = 'cmlzaGl0';      // manual reset security code

const COLORS = ['Red', 'Blue', 'Yellow'];
const STORAGE_KEY = 'synapseSavedData';

let grid = [];
let overrideCode = [];
let activeTurn = 'FreeChoice';
let moveCounter = 1;
let selectedDrone = null; // only used during a Free Choice turn

function freshDrones() {
    return {
        Red: { x: 0, y: 0, locked: false, burned: ['0,0'] },
        Blue: { x: 1, y: 0, locked: false, burned: ['1,0'] },
        Yellow: { x: 2, y: 0, locked: false, burned: ['2,0'] }
    };
}
let drones = freshDrones();

let timerInterval;
let secondsElapsed = 0;
let isTimerRunning = false;

// Coordinates translator (e.g., 0,0 -> A1)
function getCoordString(x, y) {
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    return `${cols[x]}${y + 1}`;
}

function isHazard(feature) {
    return feature.includes('IonStorm') || feature.includes('Asteroid') || feature.includes('GravityWell');
}

function initBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';

    // Render Grid
    for (let y = 0; y < 8; y++) {
        grid[y] = [];
        for (let x = 0; x < 8; x++) {
            let [feature, color] = boardLayout[y][x].split(',');
            grid[y][x] = { x, y, feature, color };

            let cellEl = document.createElement('div');
            cellEl.className = `cell bg-${color}`;

            if (feature.includes('Asteroid')) cellEl.classList.add('hazard-Asteroid');
            if (feature.includes('IonStorm')) cellEl.classList.add('hazard-IonStorm');
            if (feature.includes('GravityWell')) cellEl.classList.add('hazard-GravityWell');

            cellEl.id = `cell-${x}-${y}`;
            cellEl.style.gridColumn = `${x + 1}`;
            cellEl.style.gridRow = `${y + 1}`;

            // Marker container for Burned Paths
            cellEl.innerHTML += `<div class="burned-markers" id="markers-${x}-${y}"></div>`;

            if (feature.includes('Start')) cellEl.innerHTML += `<span class="start-label">Start</span>`;
            if (feature.includes('Target')) cellEl.innerHTML += `<span class="target-label">Target ${feature.replace('Target', '')}</span>`;
            if (feature.includes('IonStorm')) cellEl.innerHTML += `<span class="hazard-label">Ion Storm</span>`;
            if (feature.includes('Asteroid')) cellEl.innerHTML += `<span class="hazard-label">Asteroid</span>`;
            if (feature.includes('GravityWell')) cellEl.innerHTML += `<span class="hazard-label">Gravity Well</span>`;
            if (feature.includes('Num')) cellEl.innerHTML += `<span class="number-label">${feature.replace('Num', '')}</span>`;

            cellEl.addEventListener('click', () => handleCellClick(x, y));
            boardEl.appendChild(cellEl);
        }
    }

    // Render Tokens
    COLORS.forEach(color => {
        let droneEl = document.createElement('div');
        droneEl.id = `drone-${color.toLowerCase()}`;
        droneEl.className = `drone drone-${color.toLowerCase()}`;
        boardEl.appendChild(droneEl);
    });

    loadGameState();
    renderBurnedMarkers();

    updateDronePositions();
    highlightValidMoves();
    updateTurnUI();

    // Timer starts as soon as the board is up (unless the mission is already won)
    if (!isTimerRunning && activeTurn !== 'VICTORY') startTimer();
}

// Draw one dot per drone on every square it has burned (START squares included from the start)
function renderBurnedMarkers() {
    document.querySelectorAll('.burned-markers').forEach(m => m.innerHTML = '');
    COLORS.forEach(color => {
        drones[color].burned.forEach(coord => {
            let [bx, by] = coord.split(',');
            let container = document.getElementById(`markers-${bx}-${by}`);
            if (container) container.innerHTML += `<div class="b-marker bm-${color}"></div>`;
        });
    });
}

function startTimer() {
    if (!isTimerRunning && activeTurn !== 'VICTORY') {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            secondsElapsed++;
            displayTime();
            saveGameState();
        }, 1000);
    }
}

function stopTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
}

function displayTime() {
    let m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    let s = (secondsElapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}

// --- MODAL HELPERS ---

// mode: 'crash' (red, restart button) or 'victory' (green, reset-for-next-team button)
function showEndModal(mode, title, descHTML) {
    const titleEl = document.getElementById('modal-title');
    titleEl.innerText = title;
    titleEl.style.color = mode === 'victory' ? '#00ff00' : '#ff3333';
    document.getElementById('modal-desc').innerHTML = descHTML;
    document.getElementById('crash-restart-btn').classList.toggle('hidden', mode === 'victory');
    document.getElementById('end-reset-label').innerText = mode === 'victory'
        ? 'Reset for the next team (security code)'
        : 'Full reset (wipes timer and history)';
    document.getElementById('end-security-code').value = '';
    document.getElementById('end-error-msg').classList.add('hidden');
    document.getElementById('crash-modal').classList.remove('hidden');
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setHint(text) {
    document.getElementById('hint').innerText = text || '';
}

// --- RESET LOGIC ---

// Soft Reset (after a crash): drones, code and counter reset; timer and history carry on.
function softRestart() {
    if (activeTurn === 'VICTORY') return; // a won mission can only be reset with the security code

    drones = freshDrones();
    overrideCode = [];
    activeTurn = 'FreeChoice';
    moveCounter = 1;
    selectedDrone = null;

    document.getElementById('crash-modal').classList.add('hidden');
    document.querySelectorAll('.code-slot').forEach(slot => slot.innerText = '_');

    const box = document.getElementById('log-box');
    box.innerHTML += `<p class="sys-msg" style="color: #ffaa00;">--- SEQUENCE RESTARTED ---</p>`;
    box.scrollTop = box.scrollHeight;

    saveGameState();
    initBoard();
}

// Hard Reset: needs the security code. Wipes everything including the timer.
// source: 'end' = the box on the crash/success screen, anything else = the dashboard popup
function attemptManualReset(source) {
    const prefix = source === 'end' ? 'end-' : '';
    const inputEl = document.getElementById(prefix + 'security-code');
    const errorEl = document.getElementById(prefix + 'error-msg');
    const input = inputEl.value.toLowerCase().trim();
    if (btoa(input) === RESET_CODE_B64) {
        stopTimer();
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    } else {
        errorEl.classList.remove('hidden');
    }
}

// Press Enter in either security-code box to submit
window.addEventListener('DOMContentLoaded', () => {
    [['security-code', undefined], ['end-security-code', 'end']].forEach(([id, src]) => {
        document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') attemptManualReset(src); });
    });
});

// UI Modals
function openManualResetModal() { document.getElementById('reset-modal').classList.remove('hidden'); }
function closeManualResetModal() {
    document.getElementById('reset-modal').classList.add('hidden');
    document.getElementById('security-code').value = '';
    document.getElementById('error-msg').classList.add('hidden');
}
function openRulebookModal() { document.getElementById('rulebook-modal').classList.remove('hidden'); }
function closeRulebookModal() { document.getElementById('rulebook-modal').classList.add('hidden'); }

// State Persistence
function saveGameState() {
    const gameState = {
        drones: drones, overrideCode: overrideCode, activeTurn: activeTurn, moveCounter: moveCounter,
        logHTML: document.getElementById('log-box').innerHTML,
        secondsElapsed: secondsElapsed, isTimerRunning: isTimerRunning,
        isCrashModalVisible: !document.getElementById('crash-modal').classList.contains('hidden'),
        modalTitle: document.getElementById('modal-title').innerText,
        modalDesc: document.getElementById('modal-desc').innerHTML,
        isVictory: activeTurn === 'VICTORY'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGameState() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return;

    const state = JSON.parse(savedData);
    drones = state.drones; overrideCode = state.overrideCode;
    activeTurn = state.activeTurn; secondsElapsed = state.secondsElapsed;
    moveCounter = state.moveCounter || 1;
    document.getElementById('log-box').innerHTML = state.logHTML;

    displayTime();
    if (state.isTimerRunning && activeTurn !== 'VICTORY') startTimer();

    let slots = document.querySelectorAll('.code-slot');
    slots.forEach(slot => slot.innerText = '_');
    overrideCode.forEach((num, index) => slots[index].innerText = num);

    if (state.isCrashModalVisible) {
        showEndModal(state.isVictory ? 'victory' : 'crash', state.modalTitle, state.modalDesc);
    }
}

// --- GAME LOGIC ---

function triggerCrash(reason) {
    activeTurn = 'CRASHED';
    selectedDrone = null;
    // The timer keeps running through a crash; it only stops on victory.

    showEndModal('crash', 'CRASH!', escapeHTML(reason));
    setHint('');

    const box = document.getElementById('log-box');
    box.innerHTML += `<p style="color: #ff5555;">[CRASH] ${escapeHTML(reason)}</p>`;
    box.scrollTop = box.scrollHeight;

    document.getElementById('turn-indicator').innerText = 'CRASHED';
    saveGameState();
}

function updateDronePositions() {
    COLORS.forEach(color => {
        let d = drones[color];
        let el = document.getElementById(`drone-${color.toLowerCase()}`);
        el.style.gridColumn = d.x + 1;
        el.style.gridRow = d.y + 1;

        if (d.locked) {
            el.classList.add('locked');
            el.classList.remove('active-token');
            el.classList.remove('selected');
        }
    });
}

function getAdjacent(x, y) {
    return [{x: x+1, y: y}, {x: x-1, y: y}, {x: x, y: y+1}, {x: x, y: y-1}]
           .filter(pos => pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8);
}

function isOccupied(x, y) {
    return Object.values(drones).some(d => d.x === x && d.y === y);
}

// Drones the rules currently allow to move (Free Choice => any unlocked drone)
function eligibleDrones() {
    if (activeTurn === 'CRASHED' || activeTurn === 'VICTORY') return [];
    let list = activeTurn === 'FreeChoice' ? COLORS : [activeTurn];
    return list.filter(c => !drones[c].locked);
}

function canReach(color, x, y) {
    return getAdjacent(drones[color].x, drones[color].y).some(p => p.x === x && p.y === y);
}

function highlightValidMoves() {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('valid-move', 'selectable'));

    let movers = eligibleDrones();
    // In Free Choice, once a drone is picked only its squares light up
    if (activeTurn === 'FreeChoice' && selectedDrone) movers = [selectedDrone];

    movers.forEach(color => {
        getAdjacent(drones[color].x, drones[color].y).forEach(pos => {
            if (!isOccupied(pos.x, pos.y)) {
                document.getElementById(`cell-${pos.x}-${pos.y}`).classList.add('valid-move');
            }
        });
    });

    // In Free Choice, outline the squares of the drones that can be picked
    if (activeTurn === 'FreeChoice') {
        eligibleDrones().forEach(c => {
            document.getElementById(`cell-${drones[c].x}-${drones[c].y}`).classList.add('selectable');
        });
    }

    COLORS.forEach(c => {
        document.getElementById(`drone-${c.toLowerCase()}`).classList.toggle('selected', selectedDrone === c);
    });
}

function handleCellClick(x, y) {
    let movers = eligibleDrones();
    if (movers.length === 0) return;

    // Free Choice: clicking a drone picks it (click it again to un-pick)
    if (activeTurn === 'FreeChoice') {
        let occupant = movers.find(c => drones[c].x === x && drones[c].y === y);
        if (occupant) {
            selectedDrone = selectedDrone === occupant ? null : occupant;
            highlightValidMoves();
            updateHint();
            return;
        }
    }

    if (isOccupied(x, y)) return;

    let candidates = movers.filter(c => canReach(c, x, y));
    if (activeTurn === 'FreeChoice' && selectedDrone) candidates = candidates.filter(c => c === selectedDrone);
    if (candidates.length === 0) return;

    let mover;
    if (activeTurn !== 'FreeChoice') {
        mover = activeTurn;
    } else if (candidates.length === 1) {
        mover = candidates[0];
    } else {
        setHint('Two drones can reach that square. Click the drone you want to move first.');
        return;
    }

    selectedDrone = null;
    executeMove(mover, x, y);
}

function executeMove(color, x, y) {
    let drone = drones[color];
    let cellData = grid[y][x];
    let posKey = `${x},${y}`;

    let oldCoord = getCoordString(drone.x, drone.y);
    let newCoord = getCoordString(x, y);

    const box = document.getElementById('log-box');
    box.innerHTML += `<p>${moveCounter}. <strong>${color}</strong>: ${oldCoord} &rarr; ${newCoord}</p>`;
    box.scrollTop = box.scrollHeight;
    moveCounter++;

    drone.x = x;
    drone.y = y;

    if (isHazard(cellData.feature)) {
        updateDronePositions(); return triggerCrash("Hazard Strike: landed on a space anomaly.");
    }

    if (cellData.feature.includes('Start') && !cellData.feature.includes(`Start${color}`)) {
        updateDronePositions(); return triggerCrash("Restricted Zone Breach: landed on another drone's START square.");
    }

    if (drone.burned.includes(posKey)) {
        updateDronePositions(); return triggerCrash("Memory Loop: landed on a square this drone already visited.");
    }
    drone.burned.push(posKey);
    document.getElementById(`markers-${x}-${y}`).innerHTML += `<div class="b-marker bm-${color}"></div>`;

    if (cellData.feature.includes('Num')) {
        let digit = cellData.feature.replace('Num', '');
        if (!overrideCode.includes(digit)) {
            overrideCode.push(digit);
            let slots = document.querySelectorAll('.code-slot');
            overrideCode.forEach((num, index) => slots[index].innerText = num);
            box.innerHTML += `<p class="sys-msg">Digit ${digit} extracted.</p>`;
        }
    }

    if (cellData.feature === `Target${color}`) {
        if (color === 'Red' && (!drones['Blue'].locked || !drones['Yellow'].locked)) {
            updateDronePositions(); return triggerCrash("Launch Sequence Violation: Red Rover reached its TARGET before Blue and Yellow were locked.");
        }
        drone.locked = true;
        box.innerHTML += `<p class="sys-msg">${color} drone securely locked.</p>`;
    }

    updateDronePositions();

    if (drones.Red.locked && drones.Blue.locked && drones.Yellow.locked) {
        if (overrideCode.length === 4) {
            stopTimer(); // the timer only ever stops on a successful mission
            activeTurn = 'VICTORY';
            setHint('');
            document.getElementById('turn-indicator').innerText = 'MISSION COMPLETE';
            document.querySelectorAll('.drone').forEach(d => d.classList.remove('active-token', 'selected'));
            highlightValidMoves();

            showEndModal('victory', 'MISSION SUCCESS', `
                Board Override Accepted: <strong>${overrideCode.join('')}</strong><br><br>
                <span style="font-size: 22px; color: #fff;">FINAL MODULE CODE: <strong style="color:#4da6ff; letter-spacing: 2px;">${atob(FINAL_CODE_B64)}</strong></span><br><br>
                Completion Time: ${document.getElementById('timer-display').innerText}
            `);
            saveGameState();
            return;
        } else {
            // House rule (not in the PDF): every drone is locked but the code is incomplete, so nothing can move any more.
            return triggerCrash(`Failure: all drones are locked but only ${overrideCode.length} of 4 digits were recorded. Code not extracted.`);
        }
    }

    activeTurn = cellData.feature.includes('Target') ? 'FreeChoice' : cellData.color;
    updateTurnUI();

    if (activeTurn !== 'FreeChoice') {
        let nextDrone = drones[activeTurn];
        if (nextDrone.locked) return triggerCrash(`Logic Paradox: the chain names ${activeTurn}, which is already locked.`);

        let hasLegalMove = false;
        getAdjacent(nextDrone.x, nextDrone.y).forEach(pos => {
            let pKey = `${pos.x},${pos.y}`;
            let tCell = grid[pos.y][pos.x];
            if (!isOccupied(pos.x, pos.y) && !nextDrone.burned.includes(pKey) &&
                !isHazard(tCell.feature) &&
                !(tCell.feature.includes('Start') && !tCell.feature.includes(`Start${activeTurn}`))) {
                hasLegalMove = true;
            }
        });
        if (!hasLegalMove) return triggerCrash(`Logic Paradox: the chain names ${activeTurn}, which has no legal move.`);
    }

    highlightValidMoves();
    updateHint();
    saveGameState();
}

function updateHint() {
    if (activeTurn === 'FreeChoice') {
        setHint(selectedDrone
            ? `${selectedDrone} selected. Click a highlighted square.`
            : 'Team choice: click the drone you want to move.');
    } else if (activeTurn === 'CRASHED' || activeTurn === 'VICTORY') {
        setHint('');
    } else {
        setHint(`The chain says ${activeTurn} moves next.`);
    }
}

function updateTurnUI() {
    let indicator = document.getElementById('turn-indicator');
    if (activeTurn === 'CRASHED') { indicator.innerText = 'CRASHED'; return; }
    if (activeTurn === 'VICTORY') { indicator.innerText = 'MISSION COMPLETE'; return; }
    indicator.innerText = activeTurn === 'FreeChoice' ? 'TEAM CHOICE' : `${activeTurn.toUpperCase()} DRONE`;

    document.querySelectorAll('.drone').forEach(d => d.classList.remove('active-token'));

    if (activeTurn === 'FreeChoice') {
        indicator.style.background = 'rgba(255,255,255,0.2)';
        COLORS.forEach(c => {
            if (!drones[c].locked) document.getElementById(`drone-${c.toLowerCase()}`).classList.add('active-token');
        });
    } else {
        if (activeTurn === 'Red') indicator.style.background = 'rgba(179,36,36,0.8)';
        if (activeTurn === 'Blue') indicator.style.background = 'rgba(36,92,179,0.8)';
        if (activeTurn === 'Yellow') indicator.style.background = 'rgba(179,167,36,0.8)';
        if (!drones[activeTurn].locked) document.getElementById(`drone-${activeTurn.toLowerCase()}`).classList.add('active-token');
    }
    updateHint();
}

window.onload = initBoard;
