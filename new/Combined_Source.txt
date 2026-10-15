/* ==================== BEGIN FILE: index.html ==================== */

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Synapse</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <!-- Dashboard Panel -->
        <div class="dashboard glass-panel">
            <h1>Project Synapse</h1>

            <div class="panel-section split-panel">
                <div>
                    <h3>Active Turn</h3>
                    <div id="turn-indicator" class="turn-box">TEAM CHOICE</div>
                </div>
                <div>
                    <h3>Mission Time</h3>
                    <div id="timer-display" class="timer-box">00:00</div>
                </div>
            </div>

            <div id="hint" class="hint"></div>

            <div class="panel-section">
                <h3>Override Code</h3>
                <div class="code-display" id="code-display">
                    <div class="code-slot">_</div>
                    <div class="code-slot">_</div>
                    <div class="code-slot">_</div>
                    <div class="code-slot">_</div>
                </div>
            </div>

            <div class="panel-section">
                <h3>Move History</h3>
                <div class="log-box" id="log-box">
                    <p class="sys-msg">System Initialized. Awaiting first move.</p>
                </div>
            </div>

            <button class="rulebook-btn" onclick="openRulebookModal()">📖 View Rulebook</button>
            <button class="manual-reset-btn" onclick="openManualResetModal()">Manual Override Reset</button>
        </div>

        <!-- Game Board -->
        <div class="board-wrapper glass-panel">
            <div class="board" id="board">
                <!-- Cells and Drones will be injected here via JavaScript -->
            </div>
        </div>
    </div>

    <!-- Rulebook Modal -->
    <div id="rulebook-modal" class="modal hidden">
        <div class="modal-content glass-modal rulebook-content">
            <h2 style="color: #4da6ff;">PROJECT SYNAPSE RULEBOOK</h2>
            <div class="rules-text">
                <h4>Mission</h4>
                <p>Move all three drones from their START squares to their own TARGET squares, then read off the 4-digit override code. The team may choose any drone for the very first move; after that, the board decides who moves.</p>
                <table class="route-table">
                    <tr><th>Drone</th><th>Start</th><th>Target</th></tr>
                    <tr><td>Red Rover</td><td>A1</td><td>A8</td></tr>
                    <tr><td>Blue Probe</td><td>B1</td><td>D8</td></tr>
                    <tr><td>Yellow Orbiter</td><td>C1</td><td>H8</td></tr>
                </table>

                <h4>Movement</h4>
                <p>Every move is exactly one square up, down, left or right. No diagonals, and no leaving the board. Two drones can never occupy the same square.</p>
                <p><strong>Burned Path:</strong> a drone may never land on a square it has already occupied during the current run. Its own START square counts as burned from the beginning. Squares that other drones have visited are fine.</p>

                <h4>The Telemetry Chain</h4>
                <p>The color of the square a drone just landed on decides which drone must move next. A Blue square means the Blue Probe moves next, even if the Red Rover just moved.</p>

                <h4>Targets and locking</h4>
                <p>A drone that lands on its own TARGET locks permanently and becomes an immovable wall.</p>
                <p><strong>Lock order:</strong> the Blue Probe and Yellow Orbiter may lock in either order. The Red Rover must lock <strong>last</strong>.</p>
                <p>A drone may pass through an empty TARGET that belongs to another drone; it counts as a blank square.</p>
                <p><strong>Free choice:</strong> TARGET squares have no color, so after any lock or any target landing, the team picks which active drone moves next. In this game: click the drone you want to move, then click a highlighted square. START squares are off-limits to every drone except the one that began there, so they never give a free choice.</p>

                <h4>The override code</h4>
                <p>Four digits are hidden on the board. The code is the order in which a drone first lands on them. Landing on a digit that is already recorded adds nothing, but its tile color still decides who moves next. The code is extracted only when all three drones are locked and all four digits have been recorded.</p>

                <h4>Crashes</h4>
                <p>Any of these crashes the sequence: all drones return to START and a fresh run begins.</p>
                <ul>
                    <li><strong>Hazard Strike:</strong> landing on an Ion Storm, Asteroid or Gravity Well.</li>
                    <li><strong>Memory Loop:</strong> being forced onto a square that drone has already visited.</li>
                    <li><strong>Logic Paradox:</strong> the chain names a drone that has no legal move (edges, other drones, hazards, its own burned path, or it is already locked).</li>
                    <li><strong>Restricted Zone Breach:</strong> landing on another drone's START square.</li>
                    <li><strong>Launch Sequence Violation:</strong> the Red Rover lands on its TARGET while the Blue Probe or Yellow Orbiter is still unlocked.</li>
                </ul>

                <h4>Every-turn checklist</h4>
                <ol>
                    <li>Move one square; check it is not a hazard, another drone's START, a burned square or an occupied square.</li>
                    <li>If it is a digit you haven't recorded yet, add it to the code.</li>
                    <li>If it is the drone's own TARGET, lock it (Red only if both others are locked).</li>
                    <li>Read the color to find who moves next. On a TARGET, the team chooses.</li>
                    <li>Check that the next drone has at least one legal move.</li>
                </ol>
            </div>
            <button class="cancel-btn" onclick="closeRulebookModal()">Close Rulebook</button>
        </div>
    </div>

    <!-- Crash/Victory Modal -->
    <div id="crash-modal" class="modal hidden">
        <div class="modal-content glass-modal">
            <h2 id="modal-title">SYSTEM HALT</h2>
            <p id="modal-desc" class="modal-text">Reason goes here.</p>
            <button class="restart-btn" id="crash-restart-btn" onclick="softRestart()">Restart Sequence</button>

            <!-- Full reset available right on the end screen (security code required) -->
            <div class="end-reset" id="end-reset">
                <p class="end-reset-label" id="end-reset-label">Full reset (wipes timer and history)</p>
                <input type="password" id="end-security-code" placeholder="Enter Security Code...">
                <button class="cancel-btn" onclick="attemptManualReset('end')">Authorize Full Reset</button>
                <p id="end-error-msg" class="error-text hidden">Access Denied: Invalid Security Code.</p>
            </div>
        </div>
    </div>

    <!-- Manual Reset Modal (security code required) -->
    <div id="reset-modal" class="modal hidden">
        <div class="modal-content glass-modal">
            <h2 style="color: #fff;">MANUAL OVERRIDE</h2>
            <p class="modal-text">Enter security code to completely wipe memory and reset timer.</p>
            <div class="security-module">
                <input type="password" id="security-code" placeholder="Enter Security Code...">
                <button class="restart-btn" onclick="attemptManualReset()">Authorize Reset</button>
                <p id="error-msg" class="error-text hidden">Access Denied: Invalid Security Code.</p>
                <button class="cancel-btn" onclick="closeManualResetModal()">Cancel</button>
            </div>
        </div>
    </div>

    <script src="script.js"></script>
</body>
</html>


/* ==================== END FILE: index.html ==================== */


/* ==================== BEGIN FILE: style.css ==================== */

* {
    box-sizing: border-box; margin: 0; padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Generic helper (the old CSS only hid .modal.hidden, so hidden buttons/messages stayed visible) */
.hidden { display: none !important; }

body {
    /* Dark fallback colour so the page still looks right if the Unsplash image can't load */
    background: #05070f url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048') no-repeat center center fixed;
    background-size: cover; color: #eee;
    display: flex; justify-content: center; align-items: center; height: 100vh;
}

.glass-panel {
    background: rgba(10, 15, 30, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 15px 35px rgba(0,0,0,0.8);
}

.game-container { display: flex; gap: 30px; padding: 25px; border-radius: 15px; }

/* Dashboard */
.dashboard { width: 290px; display: flex; flex-direction: column; gap: 15px; padding: 20px; border-radius: 12px; }
h1 { font-size: 22px; text-transform: uppercase; border-bottom: 2px solid rgba(255,255,255,0.2); padding-bottom: 10px; text-shadow: 0 2px 4px #000; }
h3 { font-size: 13px; color: #bbb; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px; }

.split-panel { display: flex; gap: 10px; }
.split-panel > div { flex: 1; }

.turn-box, .timer-box {
    padding: 12px 5px; text-align: center; font-weight: bold; border-radius: 5px;
    background: rgba(255,255,255,0.1); color: white; letter-spacing: 1px; transition: background 0.3s;
    font-size: 14px; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
}

.hint { min-height: 34px; font-size: 12px; line-height: 1.4; color: #ffd966; }

.code-display { display: flex; gap: 10px; }
.code-slot {
    flex: 1; height: 40px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.3);
    display: flex; justify-content: center; align-items: center; font-size: 20px; font-weight: bold;
    border-radius: 5px; text-shadow: 0 0 10px #fff; color: #fff;
}

.log-box {
    background: rgba(0,0,0,0.6); height: 160px; padding: 12px; border: 1px solid rgba(255,255,255,0.1);
    overflow-y: auto; font-size: 13px; color: #fff; border-radius: 5px; font-family: monospace;
}
.log-box p { margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; }
.sys-msg { color: #888; font-style: italic; }

.rulebook-btn { background: rgba(77, 166, 255, 0.2); color: #4da6ff; border: 1px solid rgba(77, 166, 255, 0.4); padding: 10px; cursor: pointer; border-radius: 5px; font-weight: bold; text-transform: uppercase; transition: 0.3s; margin-top: auto; }
.rulebook-btn:hover { background: rgba(77, 166, 255, 0.4); color: #fff; }

.manual-reset-btn { background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 10px; cursor: pointer; border-radius: 5px; font-weight: bold; text-transform: uppercase; transition: 0.3s; }
.manual-reset-btn:hover { background: rgba(255, 255, 255, 0.2); }

/* The Board */
.board-wrapper { padding: 15px; border-radius: 12px; }
.board {
    display: grid; grid-template-columns: repeat(8, 70px); grid-template-rows: repeat(8, 70px);
    gap: 3px; background: rgba(0,0,0,0.8); border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; position: relative;
}

.cell {
    width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;
    font-weight: bold; cursor: pointer; user-select: none; transition: 0.2s;
    background-size: cover; background-position: center; grid-column: span 1; grid-row: span 1; position: relative;
}

.bg-Red { background-color: rgba(179, 36, 36, 0.8); color: #fff; }
.bg-Blue { background-color: rgba(36, 92, 179, 0.8); color: #fff; }
.bg-Yellow { background-color: rgba(179, 167, 36, 0.8); color: #000; }
.bg-None { background-color: rgba(40, 40, 40, 0.8); color: #fff; }

.hazard-Asteroid { background-image: url('https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=200'); background-blend-mode: overlay; }
.hazard-IonStorm { background-image: url('https://images.unsplash.com/photo-1531642765602-5cae8bbbf285?q=80&w=200'); background-blend-mode: overlay; }
.hazard-GravityWell { background-image: url('https://images.unsplash.com/photo-1462332420958-a05d1e002413?q=80&w=200'); background-blend-mode: overlay; }

.cell:hover { filter: brightness(1.3); }
.cell.valid-move { outline: 3px solid rgba(255,255,255,0.9); z-index: 10; box-shadow: inset 0 0 20px rgba(255,255,255,0.6); }
/* Free Choice: squares holding a drone you can pick */
.cell.selectable { outline: 2px dashed rgba(255, 217, 102, 0.9); z-index: 9; }

/* Burned Path Markers (Non-darkening) */
.burned-markers { position: absolute; top: 3px; right: 3px; display: flex; flex-direction: column; gap: 2px; z-index: 5; }
.b-marker { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 3px #000; }
.bm-Red { background: #ff4d4d; border: 1px solid #fff; }
.bm-Blue { background: #4da6ff; border: 1px solid #fff; }
.bm-Yellow { background: #ffff4d; border: 1px solid #000; }

.hazard-label { font-size: 10px; text-transform: uppercase; text-align: center; color: #fff; text-shadow: 0 0 5px #000, 0 0 10px #000; z-index: 1;}
.number-label { font-size: 32px; text-shadow: 0 0 15px rgba(255,255,255,1), 0 0 5px #000; z-index: 1;}
.start-label, .target-label { font-size: 11px; text-transform: uppercase; text-shadow: 0 0 3px #000; z-index: 1;}

/* Physical Tokens */
.drone {
    place-self: center; width: 48px; height: 48px; border-radius: 50%;
    position: relative; /* keeps the ::after highlight dot inside the drone */
    pointer-events: none; z-index: 20;
    box-shadow: 0 12px 24px rgba(0,0,0,0.9), inset 0 6px 12px rgba(255,255,255,0.6), inset 0 -6px 12px rgba(0,0,0,0.6);
    display: flex; justify-content: center; align-items: center;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.drone::after { content: ''; width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,0.4); position: absolute; top: 4px; }

.drone-red { background: radial-gradient(circle at 30% 30%, #ff4d4d, #990000); border: 2px solid #ff9999; }
.drone-blue { background: radial-gradient(circle at 30% 30%, #4da6ff, #003399); border: 2px solid #99ccff; }
.drone-yellow { background: radial-gradient(circle at 30% 30%, #ffff4d, #999900); border: 2px solid #ffff99; }

.drone.active-token { animation: hover-float 2s infinite ease-in-out; border-color: #fff; box-shadow: 0 0 15px #fff, 0 12px 24px rgba(0,0,0,0.9); }
.drone.selected { border-color: #ffd966; box-shadow: 0 0 0 4px #ffd966, 0 0 22px #ffd966, 0 12px 24px rgba(0,0,0,0.9); }

@keyframes hover-float { 0% { transform: translateY(0px) scale(1.05); } 50% { transform: translateY(-5px) scale(1.05); } 100% { transform: translateY(0px) scale(1.05); } }

.drone.locked { border-radius: 12px; border: 3px dashed #000; transform: scale(0.85) !important; opacity: 0.9; animation: none; }

/* Modals */
.modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 100; backdrop-filter: blur(5px); }
.glass-modal { background: rgba(20, 20, 25, 0.9); padding: 40px; border-radius: 15px; text-align: center; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 20px 50px rgba(0,0,0,0.9); width: 420px; }
.glass-modal h2 { color: #ff3333; font-size: 32px; margin-bottom: 15px; }
.modal-text { font-size: 16px; line-height: 1.5; color: #ddd; margin-bottom: 20px; }
.restart-btn { margin-top: 15px; padding: 12px 25px; background: #b32424; color: white; font-weight: bold; border: none; cursor: pointer; border-radius: 5px; text-transform: uppercase; width: 100%; font-size: 16px; transition: 0.2s;}
.restart-btn:hover { background: #d63030; }
.cancel-btn { margin-top: 10px; padding: 10px; background: transparent; color: #aaa; border: 1px solid #555; cursor: pointer; border-radius: 5px; width: 100%; }
.cancel-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

.security-module { margin-top: 10px; display: flex; flex-direction: column; gap: 10px; }
.security-module input { padding: 12px; font-size: 16px; text-align: center; border-radius: 5px; border: 1px solid #555; background: rgba(0,0,0,0.5); color: white; }
.error-text { color: #ff5555; font-size: 13px; font-weight: bold; }

/* Rulebook Specifics */
.rulebook-content { text-align: left; width: 560px; max-width: 95vw; max-height: 88vh; overflow-y: auto; padding: 30px; }
.rulebook-content h2 { font-size: 24px; }
.rules-text h4 { color: #4da6ff; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 6px; }
.rules-text p, .rules-text li { font-size: 14px; color: #ccc; line-height: 1.6; }
.rules-text p { margin-bottom: 8px; }
.rules-text ul, .rules-text ol { margin: 0 0 8px 20px; }
.rules-text strong { color: #fff; }
.route-table { border-collapse: collapse; margin: 8px 0; font-size: 13px; color: #ccc; }
.route-table th, .route-table td { border: 1px solid rgba(255,255,255,0.2); padding: 4px 14px; text-align: left; }
.route-table th { color: #fff; }

/* Reset box shown on the crash / success screen */
.end-reset { margin-top: 22px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.15); display: flex; flex-direction: column; gap: 8px; }
.end-reset-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #aaa; }
.end-reset input { padding: 10px; font-size: 15px; text-align: center; border-radius: 5px; border: 1px solid #555; background: rgba(0,0,0,0.5); color: white; }
.end-reset .cancel-btn { margin-top: 0; }


/* ==================== END FILE: style.css ==================== */


/* ==================== BEGIN FILE: script.js ==================== */

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


/* ==================== END FILE: script.js ==================== */


/* ==================== BEGIN FILE: check_unique.py ==================== */

#!/usr/bin/env python3
"""Project Synapse board checker.

Usage:  python3 check_unique.py path/to/script.js [--dump solutions.json]

Reads boardLayout from script.js, searches every legal run under the rulebook
(same logic as the game) and reports how many distinct solutions exist and which
override codes they produce.  A board has ONE correct answer when it prints
"solutions: 1".
"""
import re, sys, json

def load_layout(path):
    src = open(path, encoding='utf-8').read()
    m = re.search(r'const\s+boardLayout\s*=\s*\[(.*?)\n\];', src, re.S)
    rows = re.findall(r'\[([^\[\]]*)\]', m.group(1))
    return [re.findall(r"'([^']*)'", r) for r in rows]

C = ['Red', 'Blue', 'Yellow']
def hazard(f): return f in ('IonStorm', 'Asteroid', 'GravityWell')

def solve(layout, limit=None):
    G = [[tuple(c.split(',')) for c in r] for r in layout]
    sols, seen = [], set()

    def legal(pos, burn, lock, c):
        x, y = pos[c]; out = []
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x+dx, y+dy
            if not (0 <= nx < 8 and 0 <= ny < 8): continue
            if any(pos[o] == (nx, ny) for o in C): continue
            f, col = G[ny][nx]
            if hazard(f) or (nx, ny) in burn[c]: continue
            if f.startswith('Start') and f != 'Start'+c: continue
            if f == 'TargetRed' and c == 'Red' and not (lock['Blue'] and lock['Yellow']): continue
            out.append((nx, ny))
        return out

    def dfs(pos, burn, lock, code, turn, path):
        k = (tuple(pos[c] for c in C), tuple(frozenset(burn[c]) for c in C),
             tuple(lock[c] for c in C), code, turn)
        if k in seen: return
        seen.add(k)
        cands = [c for c in C if not lock[c]] if turn == 'Free' else [turn]
        for c in cands:
            for (nx, ny) in legal(pos, burn, lock, c):
                f, col = G[ny][nx]
                npos = dict(pos); npos[c] = (nx, ny)
                nburn = {k2: set(v) for k2, v in burn.items()}; nburn[c].add((nx, ny))
                nlock = dict(lock); ncode = code
                if f.startswith('Num') and f[3:] not in ncode: ncode += f[3:]
                if f == 'Target'+c: nlock[c] = True
                npath = path + [(c, nx, ny)]
                if all(nlock.values()):
                    if len(ncode) == 4: sols.append((ncode, npath))
                    continue
                nt = 'Free' if f.startswith('Target') else col
                if nt != 'Free' and (nlock[nt] or not legal(npos, nburn, nlock, nt)): continue
                dfs(npos, nburn, nlock, ncode, nt, npath)

    pos = {'Red': (0,0), 'Blue': (1,0), 'Yellow': (2,0)}
    dfs(pos, {c: {pos[c]} for c in C}, {c: False for c in C}, '', 'Free', [])
    return sols

if __name__ == '__main__':
    layout = load_layout(sys.argv[1])
    assert len(layout) == 8 and all(len(r) == 8 for r in layout), 'could not read an 8x8 boardLayout'
    sols = solve(layout)
    codes = {}
    for code, p in sols: codes.setdefault(code, []).append(p)
    print('solutions:', len(sols))
    print('distinct override codes:', len(codes))
    for k, v in sorted(codes.items()): print(f'  {k}: {len(v)} route(s), shortest {min(len(p) for p in v)} moves')
    print('UNIQUE BOARD' if len(sols) == 1 else ('NO SOLUTION' if not sols else 'NOT UNIQUE'))
    if '--dump' in sys.argv:
        out = sys.argv[sys.argv.index('--dump') + 1]
        json.dump([{'code': c, 'moves': [list(m) for m in p]} for c, p in sols], open(out, 'w'))
        print('dumped to', out)


/* ==================== END FILE: check_unique.py ==================== */


/* ==================== BEGIN FILE: unique_board_solution.txt ==================== */

PROJECT SYNAPSE - the one and only solution (after changing G5 into an Asteroid)
Columns A-H left to right, rows 1-8 top to bottom. Override code: 2479

 1. Yellow C1 -> D1   (Red moves next)
 2. Red    A1 -> A2   (Blue moves next)
 3. Blue   B1 -> B2   (Red moves next)
 4. Red    A2 -> A3   (Yellow moves next)
 5. Yellow D1 -> D2   (Red moves next)
 6. Red    A3 -> A4   (Blue moves next)
 7. Blue   B2 -> A2   (Blue moves next)
 8. Blue   A2 -> A3   (Yellow moves next)
 9. Yellow D2 -> D3   (Yellow moves next)
10. Yellow D3 -> D4   (Blue moves next; digit 2 recorded)
11. Blue   A3 -> B3   (Red moves next)
12. Red    A4 -> A5   (Blue moves next)
13. Blue   B3 -> C3   (Yellow moves next; digit 4 recorded)
14. Yellow D4 -> E4   (Blue moves next)
15. Blue   C3 -> C2   (Blue moves next; digit 7 recorded)
16. Blue   C2 -> D2   (Red moves next)
17. Red    A5 -> B5   (Yellow moves next)
18. Yellow E4 -> F4   (Red moves next)
19. Red    B5 -> B6   (Blue moves next; digit 9 recorded)
20. Blue   D2 -> D3   (Yellow moves next)
21. Yellow F4 -> F5   (Blue moves next)
22. Blue   D3 -> D4   (Blue moves next; digit 2 already recorded)
23. Blue   D4 -> D5   (Red moves next)
24. Red    B6 -> A6   (Blue moves next)
25. Blue   D5 -> D6   (Yellow moves next)
26. Yellow F5 -> F6   (Red moves next)
27. Red    A6 -> A7   (Yellow moves next)
28. Yellow F6 -> G6   (Blue moves next)
29. Blue   D6 -> D7   (Blue moves next)
30. Blue   D7 -> C7   (Blue moves next)
31. Blue   C7 -> C8   (Yellow moves next)
32. Yellow G6 -> H6   (Yellow moves next)
33. Yellow H6 -> H7   (Blue moves next)
34. Blue   C8 -> D8   (team choice; LOCKS on its target)
35. Yellow H7 -> H8   (team choice; LOCKS on its target)
36. Red    A7 -> A8   (Red locks last: mission success)

Free choice: step 1 and any step right after a target landing - click the drone first, then the square.


/* ==================== END FILE: unique_board_solution.txt ==================== */
