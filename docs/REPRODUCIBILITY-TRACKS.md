# Reproducibility Tracks — architecture specification (Phase 5, item 5)

**Status:** implemented in v4.337.0. Verified by `docs/verify-the-reproducibility-tracks.cjs` (6/6) and by a
browser replay of a link sealed in Node.

## 1 · Why this item, of the five

The Phase-5 list names five capabilities: a math-to-LaTeX bridge, non-Euclidean raytracing, live data
assimilation, autonomous agent swarms, and reproducibility tracks. Only the fifth grounds the other four.

- A LaTeX derivation, a ray-traced image or an agent's "significant rhyme" is a *claim*.
- A claim that nobody else can re-derive step by step is not yet evidence.

The atlas already has partial answers to the other items:

- **Raytracing (item 2).** The ghost sky of S³/Γ is exact and closed-form, because geodesics of S³ are great circles.
- **Real data (item 3).** Real catalogues are embedded: Hipparcos, a 17 300-galaxy local web, the VCV quasars. The live
  Gaia and SDSS services are not reachable from this build.
- **Agent contracts (item 4).** These exist as `api/agent.json`, `api/live-agent-bridge.d.mts` and the typed
  instruments.

What the atlas did not have was a way to hand a discovery to someone else and have them get the same numbers.

The first cross-host replay proved the point. A track sealed in Node and opened in the page broke at once: the
φ-ladder audit gave Z(ln φ) = 1.855 in the core and 2.048 in the page. Two bugs were behind it, and both are
repaired:

- the page derives a dozen ladder rows at load time, while the core read the typed literals;
- the extractor read `...GALAXIES` as a member access.

The ledger records this as `twoHosts`, of kind *revises*.

## 2 · The object

A track is a JSON document with schema `hcc.track/1`. Its types are in `api/tracks.d.mts`.

```ts
interface Track {
  schema: 'hcc.track/1';
  id: string;                                   // 'discovery:ghostSky', 'view:s3gamma', …
  title?: string;
  atlas?: { version: string; build: string };   // what it was recorded on
  discovery?: string;                           // ledger id, when it re-derives one
  steps: TrackStep[];
  fingerprint?: string;                         // present on a sealed track
}
type TrackStep =
  | { op: 'nav';    world: string; lab?: string | null }
  | { op: 'state';  set: Record<string, number | string | boolean> }
  | { op: 'camera'; pos: [number, number, number]; target: [number, number, number] }
  | { op: 'call';   fn: TrackOpName; args?: Record<string, unknown>; expect?: Record<string, Expectation> };
```

There are two kinds of step:

- **Screen steps** (`nav`, `state`, `camera`) say where to stand. They need a screen.
- **Calls** say what to compute and what must come out. They need nothing but the core.

## 3 · The security rule: a link is data, never code

- **Calls are whitelisted.** A call may only name an operation of `TRACK_OPS`, a frozen object of 15 pure kernels.
  Lookup uses `hasOwnProperty`, so `__proto__` and `constructor` are refused.
- **Arguments are never evaluated.** They are JSON-cloned and passed to the kernel. Nothing is `eval`'d.
- **State keys are restricted.** A `state` step may only set a key that matches `/^[A-Za-z][A-Za-z0-9_]{0,40}$/`, whose
  value is a primitive of the same type the key already has. The key must already exist in `state` or be on a short
  allow-list.
- **Camera steps take only finite numbers.**

## 4 · The pipeline

```
record ──► seal ──► link ──► replay (page) ──┐
  │          │        │                        ├─► same fingerprint ⇔ two hosts, same numbers
  │          │        └──► replay (Node CLI) ──┘
  │          └ fingerprint = FNV-1a(canon(outputs))   canon: keys sorted, numbers to 8 significant digits
  └ HCC_TRACKS.record(): world, lab, camera, the state keys that matter, and the calls of every ledger entry
    whose laboratories include the one you stand in
```

- **Encoding.** UTF-8 JSON, base64url, carried as `#track=…`. The boot router writes its own route into the hash
  within a second, so the link is captured the moment the script runs (`TRACK_BOOT_HASH`).
- **Replay in the page** (`trackReplayOpen`). Screen steps are applied one by one, with a pause, so a person can
  follow. Then every call runs and each expectation is marked ✓ or ✗. The dialog shows:
  - the version the track was recorded on against the version it is replayed on — a mismatch is flagged as a change
    of the atlas, not of the physics, until shown otherwise;
  - the fingerprint, and whether it equals the link's.
- **Replay outside the browser.** `node api/track-replay.mjs '<link>'`, or `--discovery <id>`, or `--list`. It runs the
  same `trackRun` on `core/atlas/extracted.mjs`, which is the physics sliced byte for byte out of `index.html`. Exit
  code 0 means every expectation holds and the sealed fingerprint matches.

## 5 · The ledger, replayable

`DISCOVERY_TRACKS` holds the canonical track of 13 ledger entries. These are the ones a computation can re-derive in
seconds:

- `ghostSky`, `pdsSpectrum`, `pdsHidden`
- `epochChain`, `age`, `eett`, `sigmat`, `dinf`
- `bbhend`
- `phiAudit`, `twoHosts`
- `betti`, `wiener`

In the Discovery Explorer each of these entries has two buttons:

- **⟲ replay** re-derives it in place;
- **🔗 link** copies a sealed link.

Entries whose check takes minutes, such as the circle search or the Local Group Monte Carlo, say so, and their
verifiers replay them.

## 6 · The API

```ts
window.HCC_TRACKS: {
  schema; ops(); discovery(id); discoveries();
  encode(t); decode(link); run(t | link); link(t); record(); replay(t | link): Promise<TrackReport>
}
```

The command palette also offers "Record a reproducibility track of this view" and "Replay a reproducibility track
from a link".

## 7 · Invariants the verifier holds every build

1. `encode ∘ decode = id`. The link is base64url. A foreign document is refused.
2. Unknown and prototype-reached operations are refused, and arguments come back as data.
3. Every tracked discovery re-derives on the core. Its fingerprint is stable across runs, and a sealed link matches.
4. The CLI exits 0 on a sealed link and prints the same fingerprint. A tampered expectation exits 1.
5. The core reads the same ladder as the page, through the same reconciliation, and the extractor carries spreads.
6. `api/tracks.d.mts` names exactly the operations `TRACK_OPS` offers. The types cannot drift.

## 8 · What comes next (open)

- **Sealed tracks for agents.** An agent that finds a "structural rhyme" leaves a track rather than a sentence; the
  inquiry marker *is* the replayable computation. This connects item 4 to item 5.
- **Symbolic export.** For the closed-form operations (`space.circles`, `ghost.rmax`, `cosmic.chi`), emit a SymPy
  script beside the numbers, so that the formula is checked as well as its value. This connects item 1 to item 5.
- **Longer tracks by delegation.** Allow calls that take minutes (the circle search, the Local Group Monte Carlo) and
  run them in a worker, with progress.
