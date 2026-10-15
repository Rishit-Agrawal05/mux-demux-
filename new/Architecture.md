# Project Synapse — Architecture Document

## 1. Project overview
Project Synapse is a browser-based, interactive grid puzzle. Three drones (Red, Blue, Yellow) move across a fixed 8×8 board. The application enforces movement and hazard rules, records the four-digit override code, tracks elapsed time and move history, saves the current game state in browser storage, and displays crash/victory dialogs.

The web application is implemented with HTML, CSS, and JavaScript. A separate Python script checks whether the board layout has exactly one legal solution. A text file records a known solution route.

## 2. Repository file map

```text
Project Synapse
├── index.html                 HTML page and UI structure
├── style.css                  Visual styling and responsive presentation
├── script.js                  Board data, game rules, state, events, persistence
├── check_unique.py            Offline Python board-solution validator
└── unique_board_solution.txt  Human-readable known route and override code
```

## 3. Components and responsibilities

### `index.html` — presentation structure
- Defines the page title and main game container.
- Provides the dashboard: active-turn indicator, mission timer, hints, override-code slots, move-history log, and buttons.
- Provides the board container. JavaScript creates the 8×8 cells and drone elements at runtime.
- Defines the rulebook, crash/victory, and manual-reset modals.
- Loads `style.css` in the document head and `script.js` near the end of the body.
- Inline button handlers call functions implemented in `script.js`.

### `style.css` — visual layer
- Styles the dashboard, board grid, cells, colored tile types, hazards, numbers, drone tokens, burned-path markers, buttons, and modal dialogs.
- Defines visual states such as valid moves, selectable drones, active tokens, and locked drones.
- Uses remote Unsplash images for the page background and hazard tile artwork; those images require network access to load.

### `script.js` — application logic
- Stores the 8×8 `boardLayout`, tile colors/features, and the three drone definitions.
- Initializes and renders board cells, labels, drones, and burned-path markers.
- Handles clicks, legal-move highlighting, turn selection, and movement.
- Applies game rules: one-square orthogonal movement, no overlap, hazards forbidden, each drone's path cannot be revisited, other drones' START squares are restricted, targets lock drones, and Red must lock last.
- Records the first visit to each numbered tile to form the override code.
- Tracks timer, move history, crash/victory state, and reset dialogs.
- Saves/restores game state through browser `localStorage` using the key `synapseSavedData`.
- Contains obfuscated browser-side constants for the final module code and reset security code. This is only light obfuscation; values embedded in client-side JavaScript are not secret.

### `check_unique.py` — offline board checker
- Reads `boardLayout` from a JavaScript file by matching its source text.
- Searches legal routes using depth-first search and reports the number of solutions and the override codes produced.
- Can optionally dump routes to JSON with `--dump`.
- It is a Python utility, not part of the browser runtime. Run it with Python 3 and pass the JavaScript file path.

### `unique_board_solution.txt` — reference solution
- Gives a step-by-step route, coordinate notation, and the expected override code `2479`.
- Documents the board change described in its first line.
- Serves as a manual reference, separate from the application's runtime logic.

## 4. Runtime relationships

```text
Browser
  └── index.html
       ├── loads style.css
       │    └── styles page, grid, tokens, status and modal states
       └── loads script.js
            ├── builds the board inside #board
            ├── reads/writes localStorage (synapseSavedData)
            ├── updates dashboard elements in index.html
            └── applies CSS classes defined in style.css

Developer / test workflow
  ├── script.js ── boardLayout source ──> check_unique.py
  └── unique_board_solution.txt ──> manual route reference
```

## 5. Main browser execution flow
1. The browser parses `index.html` and loads `style.css`.
2. `script.js` initializes the board, reads the layout, creates the 64 cells and drone tokens, then attempts to restore a saved game.
3. The UI renders drone positions, burned-path markers, valid moves, and the active-turn indicator.
4. A player clicks a drone (when free choice is available) and then a highlighted destination cell.
5. JavaScript validates the move, updates drone positions and burned paths, records new digits, determines the next turn, and checks for a crash or victory.
6. The timer and game state are periodically updated; game state is persisted in browser storage.
7. End-state modals allow the run to be restarted or a security-code-protected full reset to be attempted.

## 6. Important data and DOM connections
- Board data: `boardLayout` in `script.js`.
- Board mount point: `#board` in `index.html`.
- Dashboard targets: `#turn-indicator`, `#timer-display`, `#hint`, `#code-display`, and `#log-box`.
- Modal targets: `#rulebook-modal`, `#crash-modal`, and `#reset-modal`.
- Drone elements: `#drone-red`, `#drone-blue`, and `#drone-yellow`, created by JavaScript.
- Persistence key: `synapseSavedData`.

## 7. How to run and validate
### Run the game
Keep `index.html`, `style.css`, and `script.js` in the same directory, then open `index.html` in a modern browser. A local static server is also suitable.

### Check board uniqueness
From the directory containing the files, run:

```bash
python3 check_unique.py script.js
```

To write all discovered routes to a JSON file:

```bash
python3 check_unique.py script.js --dump solutions.json
```

The checker assumes it can parse an 8×8 `boardLayout` declaration from `script.js`. Keep the board format compatible with the regular expression in the script.

## 8. File-format note
The `.C` and `.txt` deliverables are combined source listings for archival and review. They contain HTML, CSS, JavaScript, Python, and reference text separated by clear file markers. Renaming these contents to `.C` does **not** translate them into C and does not make the web application compilable with a C compiler. A genuine C port would require rewriting the web application logic and interface for a C-compatible environment.
