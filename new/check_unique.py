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
