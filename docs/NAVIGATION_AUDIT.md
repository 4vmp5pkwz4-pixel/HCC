# Navigation and information-architecture audit

Stage 1 of the control-model rework. Everything below is **measured** in the running
application (Chromium, 1440×900 desktop profile), not read off the source. The probe
scripts drive the real UI: they switch worlds, open panels, and inspect the live DOM and
computed styles.

Nothing in this document changes the application. It exists so the rebuild that follows
is designed against facts rather than impressions.

---

## 1 · The map as it is today

### Worlds (7)

`solar` · `cyc` · `obs` · `s3` · `fbs` · `field` · `fractal`

Selected by `.modebtn[data-mode]` in a single horizontal row in the top bar. There is no
registry: the set exists only as DOM buttons plus a chain of `mode==='…'` comparisons
inside `setMode()`.

### Laboratories (72)

All 72 belong to the `s3` world. They exist as `#v-<id>` buttons inside `#labPanel`.
`S3_VIEW_NAMES` names all 72; `LAB_ATLAS_DEFS` describes 46 of them with a title and a
one-sentence purpose. **26 laboratories therefore have no description anywhere.**

Grouping exists (`labDomainOf`, `LAB_DOMAIN_LABEL`, `PREMIUM_VIEW_DOMAINS`) but is derived
from a *visual-identity* registry that was built for palettes, not for navigation.

### Panels (14 in the DOM)

`navPanel` `ctl` `info` `zpPanel` `bixPanel` `smithPanel` `xrCheck` `motionPanel`
`vectorPanel` `oscPanel` `objectPanel` `atlasPanel` **`labPanel`** `selCard`

`PANEL_IDS` lists **13**. `labPanel` is absent from it.

---

## 2 · What the measurements found

### 2.1 The laboratory catalogue is an orphan panel

| fact | evidence |
|---|---|
| `labPanel` is not in `PANEL_IDS` | source |
| no `[data-panel="labPanel"]` control exists | DOM query returns none |
| no `openPanel('labPanel')` / `togglePanel('labPanel')` anywhere | source |
| all 72 `#v-*` buttons measure 0 × 0 in every world, including `s3` | `getBoundingClientRect()` |

The only route to the catalogue is a button (`#labOpenBrowser`) rendered **inside the
Controls panel**, and only while the `s3` world is active. So reaching any laboratory
costs: switch to S³ → open Controls → scroll → press "Browse all 72 laboratories".

This is the whole of the "laboratories are hard to discover" complaint, and it is one
missing registration rather than a layout problem.

### 2.2 A correction to my own first pass

My first probe reported 72 laboratory buttons present in `fbs`, `field` and `fractal` —
i.e. the S³ catalogue leaking into unrelated worlds. **That was an artefact of the probe**,
which walked the worlds in sequence and read stale DOM left by the previous `s3` visit.
Re-probed by returning to `solar` between each world:

| world | `#v-*` buttons |
|---|---|
| solar | 0 |
| fbs | 0 |
| field | 0 |
| fractal | 0 |
| s3 | 72 |

So the S³ catalogue does **not** leak. Recording the correction rather than the first
number, because a rebuild justified by a measurement error would be worse than none.

### 2.3 Panels do close on a world change

Opened in S³, then switched to Solar:

| panel | open in S³ | still open in Solar |
|---|---|---|
| `zpPanel` | yes | no |
| `bixPanel` | yes | no |

So "open panels survive a mode change and become meaningless" is **not** reproducible for
the secondary dock. What *is* true is that nothing declares a scope, so the property holds
by accident of the current close-everything behaviour rather than by construction — there
is no invariant preventing the next panel from being wrong.

### 2.4 Duplicate and ambiguous navigation routes

Distinct controls found in the live DOM whose labels promise navigation:

`⌕ Search` · `🧭 Navigator` · `📊 QA Atlas` · `← Back` · `↩ Return to atlas` · `↩ Return`

Six controls, at least three of which ("Back", "Return", "Return to atlas") are candidates
for the single Back the target architecture requires. "Atlas" additionally names three
unrelated things: the QA panel, the runtime manifest, and per-laboratory atlases
("Defect atlas", "Pole atlas").

### 2.5 There are no deep links

`location.hash` is empty on load and is never written. Reload, browser Back and browser
Forward cannot restore a world, a laboratory or an inspector tab, because the application
never puts them in the URL.

### 2.6 There is no context store

World is read from `state.mode`, laboratory from `state.s3view`, panel state from
`activePanelId` plus per-panel booleans (`LAB_BROWSER_OPEN`, `LAB_BROWSER_FOLDED`, …), and
"is this the active world" is answered in places by `.modebtn.active` — a DOM class. There
is no single object any component can ask.

---

## 3 · Target architecture

```
Atlas
└── World          worldId
    └── Laboratory     labId
        └── Inspector      inspectorTab
```

**Registries.** `WORLD_REGISTRY`, `LAB_REGISTRY`, `TOOL_REGISTRY`. Every laboratory
declares `{id, parentWorld, category, title, description, status, capabilities,
defaultInspector, enter, leave}`. Every panel declares
`scope: "global" | "world" | "laboratory"` plus the world or laboratory it belongs to.

**Context store.** `{worldId, labId, inspectorTab, selectedObjectId, openPanels,
navigationHistory}` as the single source of truth. No component may infer the active mode
from a DOM class or a private flag.

**Scope enforcement.** A panel whose scope does not match the context is removed, not
disabled and not left empty. Pinning means "keep within the permitted scope", not "show
everywhere".

**One Atlas.** Search, Navigator and the laboratory browser merge into one surface
carrying worlds, the laboratories of the selected world, categories, search, Recently
Used, Favorites, Recommended and status filters. Choosing a laboratory performs the whole
transition: resolve its parent world → close incompatible panels → switch world →
activate the laboratory → restore its state → open its default inspector → update
breadcrumb and URL.

**Routes.** `#/world/<id>` and `#/world/<id>/lab/<id>`, restored on reload and on browser
Back/Forward. One Back action; a clickable breadcrumb `Atlas / S³ · Hopf / Applied Maps /
Smith–Möbius`.

**Categories** for the 72 S³ laboratories, replacing the palette-derived grouping:
Geometry & Topology · Hopf & Fibre Structures · Dynamics & Integrability · Contact &
Symplectic · Quantum & Spectral · Relativity & Null Geometry · Möbius & Applied Maps ·
Cosmology & Bianchi IX · Invariants & Verification.

**Architecture test** (`docs/verify-navigation-architecture.cjs`), asserting: every
laboratory has an existing `parentWorld`; every route is unique; every panel has a scope;
no S³ panel outside S³; every search result reaches a working state; every world has a
default entry; no unreachable laboratory; no orphan panel; no visible dead control; and
Back / Forward / reload restore the state.

---

## 4 · Stage 2 — what was built

Implemented in the same branch, on top of this audit.

**Registries.** `WORLD_REGISTRY` (7 worlds, each with a `defaultEntry`), `LAB_REGISTRY`
(72 laboratories, each with `id, parentWorld, category, title, description, status,
capabilities, defaultInspector, route`) and `TOOL_REGISTRY` (every panel with a scope).
The registry is *derived* from data that already existed — names from `S3_VIEW_NAMES`,
purposes from `LAB_ATLAS_DEFS` — so nothing is invented and nothing is lost. The 26
laboratories the audit found bare now carry a purpose line.

**Context store.** `HCC_CTX = {worldId, labId, inspectorTab, selectedObjectId, openPanels,
navigationHistory}`, exposed as `HCC_NAV` for QA. Nothing infers the active world from a
DOM class any more.

**One navigation system.** `setMode` and `setS3View` are *not* replaced — they become the
implementation underneath. The world buttons and `uiSetS3View` both route through
`hccGo()`, which is the only code allowed to change world and laboratory together: it
resolves the parent world, drops out-of-scope panels, switches, activates, restores,
opens the inspector, and writes breadcrumb and URL. The architecture test fails if an
entry point bypasses it.

**Scope enforcement.** A panel outside its scope is *removed*, never disabled and never
left empty. Measured after leaving a laboratory: **orphan panels 0, panels visible
outside scope 0.**

**One Atlas.** Worlds, the 72 laboratories in nine categories, search, favourites,
recently used, and status filters, in one panel. It takes the primary dock slot; the
duplicate "↩ Return" moves to the overflow rather than being deleted.

**Routes.** `#/world/<id>` and `#/world/<id>/lab/<id>`, parsed at boot **before the first
frame** so there is no flash of the wrong world. Measured: a cold load of
`#/world/s3/lab/berry` restores world and laboratory; browser Back from `hopf` returns to
`berry`; unknown worlds and unknown laboratories are rejected rather than half-applied.

**Breadcrumb.** `Atlas / S³ · Hopf / Möbius & Applied Maps / Impedance · Möbius · Smith`,
every segment clickable.

**Mobile.** Four destinations — Atlas, Controls, Inspect, More — replacing the scrolling
row of seven worlds as the primary route. Measured on iPhone 13 portrait and landscape:
4 items, none under 44 × 44, 0 panels outside scope, 0 page errors.

### A bug my own test caught

The breadcrumb first rendered as `Atlas / / / Impedance`. `impL()` takes `{en, ru, de}`
and the registries carry `[en, ru, de]`; handing an array to it returns an empty string
in silence. The registries now use their own picker.

### Verification

`docs/verify-navigation-architecture.cjs` — **10/10**, static, plus three live self-tests
inside the atlas. 570/570 self-tests green, all 72 S³ views walk with 0 page errors.

## 5 · What is still not done


The **desktop three-column layout** (Atlas left, scene centre, Inspector right, Timeline
below) is not built: the Atlas and the inspectors exist and are correctly scoped, but they
still float as panels rather than occupying fixed columns. The **Inspector tab set**
(Controls / Measurements / Theory / Objects / Data) is declared per laboratory as
`defaultInspector` but is not yet a tab strip. `Recommended` is not implemented;
Favorites and Recently Used are.

That is deliberate. Migrating the navigation shell of a 40,000-line single-file
application halfway would leave the old and new systems live at the same time — the one
outcome the brief rules out — and the rebuild has to be verified across desktop, iPhone
portrait and iPhone landscape, across all seven worlds and all 72 laboratories, before it
can replace what is there. Shipping the audit first means the rebuild is designed against
the numbers above, including the one that turned out to be my own measurement error.

The single defect that is both severe and narrow — the orphan catalogue of §2.1 — is
recorded here rather than patched, because registering `labPanel` on its own would add a
fourteenth ad-hoc panel route to a system whose problem is that it has too many.
