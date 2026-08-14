# HCC for machines

The atlas is a visual instrument. **The core is not.** Every number the atlas draws that has
a computational contract is produced by `core/`, which is pure ESM with no DOM, no
Three.js, no animation frame and no WebGL — and is reachable over HTTP and MCP.

```
node server/server.mjs           # http://127.0.0.1:8974
node test/run-tests.mjs          # 50 contract + benchmark checks
node scripts/demo-agent.mjs      # the full agent scenario, no browser
node scripts/extract-kernels.mjs # re-slice the physics out of index.html
node scripts/ci.mjs              # rebuild every artifact and check everything
docker build -t hcc . && docker run -p 8974:8974 hcc
```

## What is actually implemented

| | count |
|---|---|
| laboratories in the catalogue | **85** (73 from the visual atlas + 12 kernels) |
| with a computational contract | **12** |
| returning `NOT_IMPLEMENTED` | **73** |
| declared open problems | **102** |
| falsifiable self-tests inside the kernels | **57** |

That ratio is the honest state of the refactor and the API reports it in `/api/v1/health`.
A laboratory without a kernel returns **501 NOT_IMPLEMENTED**, never a plausible number.

### The twelve

| id | status |
|---|---|
| `smith.mobius` | EXACT |
| `smith.fit_series_rlc` | NUMERICALLY_VERIFIED |
| `smith.identify_resonances` | SYNTHETIC_ONLY |
| `smith.wireless_transfer` | REFERENCE_MODEL |
| `fbs.zero_point_ladder` | CONDITIONAL |
| `fibonacci.anyons` | EXACT |
| `capacity.conditional_selector` | CONDITIONAL |
| `edge.admissibility_no_go` | CONDITIONAL |
| `s3.spectral_operator` | NUMERICALLY_VERIFIED |
| `bianchi_ix.evolution` | NUMERICALLY_VERIFIED |
| `s3.particle_creation` | NUMERICALLY_VERIFIED |
| `s3.ebk_quantisation` | NUMERICALLY_VERIFIED |

### Eight of them are EXTRACTED, not retyped

There were two ways to give the atlas's physics a machine contract: retype it into
`core/labs`, or take it. Retyping creates a second copy that drifts, and a drift between the
picture and the number is the exact failure this core exists to prevent — so
`scripts/extract-kernels.mjs` reads the single module block of `index.html`, builds the
identifier graph between its top-level declarations, and emits the transitive closure the
kernels name into `core/atlas/extracted.mjs`, **verbatim and in original source order**.

* If the closure ever touches `window`, `document`, `THREE` or any renderer global, the
  extraction **fails** and prints the chain from the kernel to it. That failure is the useful
  part: it names the physics still entangled with a renderer.
* `node scripts/extract-kernels.mjs --check` is the drift guard, and CI and the Docker build
  both run it. Edit the atlas without regenerating and the build stops.
* `docs/verify-kernel-extraction.cjs` (18/18) checks the slicer against the thing it sliced
  from: every declaration must occur **byte for byte** inside `index.html`, and the physics
  must come out with the values the atlas quotes in its own prose.

A laboratory that renders but has no kernel of its own now **names the kernels extracted from
it** in `covered_by`, so an agent landing on `atlas.sec` is told where the computation lives
rather than concluding there is none.

## The six methods, identical for every laboratory

`describe · run · sweep · validate · export · cancel`

## Routes

```
GET    /api/v1/health
GET    /api/v1/labs
GET    /api/v1/labs/{id}
POST   /api/v1/labs/{id}/runs        # short work inline, slow work returns 202 + job
POST   /api/v1/labs/{id}/sweep
GET    /api/v1/labs/{id}/validate
GET    /api/v1/runs/{id}
DELETE /api/v1/runs/{id}
GET    /api/v1/runs/{id}/events      # SSE progress
GET    /api/v1/open-problems
GET    /api/v1/runs                  # every retained job, with the bounds in force
GET    /openapi.json
GET    /.well-known/mcp.json
POST   /mcp                          # MCP Streamable HTTP, JSON-RPC 2.0
POST   /mcp/call                     # DEPRECATED — the first transport, still working
GET    /                             # 302 → /HCC/
```

## Jobs, threads and bounds

Slow work runs on a **worker thread**, not on the event loop. Before this, an "asynchronous"
run returned 202 honestly and then blocked the process for the whole computation, so a second
agent's health check queued behind somebody else's Bianchi IX integration.

| variable | default | what it does |
|---|---|---|
| `HCC_MAX_ACTIVE_JOBS` | 4 | past this, `POST .../runs` returns **429 BUSY** naming the limit |
| `HCC_MAX_RETAINED_RUNS` | 256 | oldest **finished** run is evicted first; a running job is never evicted |

Both are reported in `/api/v1/health` under `jobs`, so an agent can learn what it may ask for
before it is refused.

## curl

```bash
curl -s localhost:8974/api/v1/health | jq '{core_version,git_commit,labs,implemented,requires_webgl}'
curl -s localhost:8974/api/v1/labs/smith.wireless_transfer | jq '.outputs[] | {name,unit}'
curl -s -X POST localhost:8974/api/v1/labs/smith.wireless_transfer/runs \
  -H 'content-type: application/json' \
  -d '{"input":{"d_m":0.2,"f_hz":1e6}}' | jq '{status,outputs:{eta:.outputs.eta,k:.outputs.k},git_commit}'
```

## Python

```python
import json, urllib.request
def call(path, body=None):
    req = urllib.request.Request("http://127.0.0.1:8974" + path,
        data=None if body is None else json.dumps(body).encode(),
        headers={"content-type": "application/json"})
    return json.load(urllib.request.urlopen(req))

labs = call("/api/v1/labs")["labs"]
r = call("/api/v1/labs/smith.fit_series_rlc/runs", {"input": {
    "f_hz": [...], "z_re": [...], "z_im": [...]}})
assert r["status"] == "NUMERICALLY_VERIFIED"
print(r["outputs"]["f0"], r["output_units"]["f0"])   # 6204505.657 Hz
```

## JavaScript

```js
const run = (id, input) => fetch(`http://127.0.0.1:8974/api/v1/labs/${id}/runs`,
  { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ input }) })
  .then(r => r.json());
const r = await run('smith.mobius', { z_re: 0.5, z_im: 0.6, theta: Math.PI / 2 });
console.log(r.outputs.route_disagreement);   // ~2e-16: the two routes agree
```

## MCP

Nine tools over **JSON-RPC 2.0** at `POST /mcp` (MCP Streamable HTTP, protocol `2025-06-18`):

```bash
curl -s -X POST localhost:8974/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | jq '.result.serverInfo'

curl -s -X POST localhost:8974/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | jq -r '.result.tools[].name'
# list_labs describe_lab run_lab sweep_lab get_run cancel_run validate_run export_artifact list_open_problems

# one call, a whole parameter range: the Fibonacci fusion dimensions
curl -s -X POST localhost:8974/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"sweep_lab","arguments":
      {"lab_id":"fibonacci.anyons","parameter":"n","values":[1,2,3,4,5,6,7,8]}}}' \
  | jq '[.result.structuredContent.rows[].outputs.dim_total]'
# [1,2,3,5,8,13,21,34]
```

A **refusal comes back as a tool result with `isError: true`**, not as a transport failure:
the agent asked a well-formed question and the honest answer is "no number".

`POST /mcp/call` — the first transport — still works and carries `Deprecation: true` and a
`Link: </mcp>; rel="successor-version"` on every response, so a client that already depends on
it learns that from the wire rather than from a changelog.

## The status taxonomy, and the rule behind it

`EXACT · NUMERICALLY_VERIFIED · CONDITIONAL · REFERENCE_MODEL · SYNTHETIC_ONLY · OPEN ·
NOT_IMPLEMENTED`

**A visual agreement or a synthetic self-test may never be promoted to an empirical
confirmation.** `smith.identify_resonances` is `SYNTHETIC_ONLY` because every dataset it has
ever seen was generated by this repository. `smith.wireless_transfer` is `REFERENCE_MODEL`
because it is a model of two coaxial loops, not a measurement of a device.

## Falsifiers, per instrument

| instrument | it is wrong if |
|---|---|
| `smith.mobius` | the plane and sphere routes disagree beyond 1e-12, the cross-ratio changes, or a passive load leaves the unit disc |
| `smith.fit_series_rlc` | the blocked hold-out residual greatly exceeds the training residual, or L or C comes back negative |
| `smith.identify_resonances` | known synthetic poles are not recovered to the stated tolerance, or the fit returns right-half-plane poles for a passive device |
| `smith.wireless_transfer` | M(d) does not approach the dipole law, the power balance does not close, or efficiency exceeds 1 |
| `fbs.zero_point_ladder` | the action cell departs from ħ/2 at any rung, the compactness ratio departs from φ^(−2N), or the bare sum stops growing with its cutoff |
| `fibonacci.anyons` | the pentagon fails over any of its 512 labellings, the hexagon **accepts** mixed chirality, Yang–Baxter fails, or the fusion dimension leaves the Fibonacci sequence |
| `capacity.conditional_selector` | the free energy is not strictly convex, or its minimum is not unique over the declared domain |
| `edge.admissibility_no_go` | the naive root moves off ~9.286 for an O(1) APS constant, or the constant needed to reach 292 turns out to be O(1) rather than ~1e61 |
| `s3.spectral_operator` | the assembled spectrum departs from the exact trace identity, or the isotropic limit is not (2j+1)²-degenerate at c/2·j(j+1) |
| `bianchi_ix.evolution` | the constraint residual grows without bound, an equilibrium is found (the NO-GO forbids it), or a bounded orbit's Lyapunov doubling ratio plateaus at 1 |
| `s3.particle_creation` | the Wronskian departs from 1, or an isotropic run returns a nonzero occupation |
| `s3.ebk_quantisation` | the relative error fails to fall by roughly four when j doubles — the 1/j² law of a leading O(ħ²) correction |

## What this service will never say

It will not claim that *all* resonances were found — finite noisy data over a finite band
cannot support that. The wording it does use is: **"all resolvable modes inside the stated
band, for the stated model class, at the stated detection threshold and resolution."**

It will not report super-unity efficiency, superluminal transfer, or extraordinary
long-range power transfer. The near-field model stops at `kd > 0.3` and says so instead of
extrapolating; there is no full-wave solver in this build, and that is an open problem, not
a result.

**It will not return 292.** The recursion operator ℛ is offered as the thing whose spectrum
should select the closed shell N_φ = 292. Implemented as written, its gap balance has its root
at **9.28604831206314**, and reaching 292 would take an APS constant of
**1.0577692873473666e61** — the answer smuggled in as an input. So
`edge.admissibility_no_go` reports `selects_292: false`, publishes the refuted root as an
output, and quotes 292 only for comparison. An atlas that implemented ℛ and quietly displayed
292 would be doing the exact opposite of what the manuscript asked for.

For the same reason `capacity.conditional_selector` carries `N_phi_derived: false` and
`edge.admissibility_no_go` carries `Z_edge_computed: false`. Nothing in this repository derives
φ; `R_N = ℓ_P φ^N` is a declared ansatz, and `phi.physical_origin` is a named open problem.
