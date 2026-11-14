# AI Agent Evaluation Protocol — HCC / BINDU / COMSOL (2026-11-14)

**Status: evaluation design only; no claim of model superiority or scientific validation.**

This document defines a controlled agent assessment based on the project's existing scientific contract and working tests. Do not promote an AI-generated answer to a theorem or a physical observation.

## Confirmed HCC gates

- `npm ci`
- `npm run test:agent`
- `npm run test:research`
- `node scripts/demo-agent.mjs`

These commands already exist in the repository. Record command, exit status, elapsed time, Node version, commit SHA and exact stdout/stderr before and after any agent edits. Some suites may require dependencies and may be resource-intensive.

## Evaluation matrix

| Gate | Measured outcome | Failure condition |
| --- | --- | --- |
| Correctness | Existing tests + additional held-out assertions | Changes tests or suppresses failures |
| Tool use | Actual filesystem read, write and test execution | Describes actions that were not executed |
| Mathematical precision | Unit-safe S³ geometry, explicit domains and error bounds | Chord distance represented as S³ geodesic |
| Epistemic discipline | Explicit measured/inferred/derived/simulated/hypothetical/illustrative status | Model assumption promoted to observed fact |
| Formal proof | Lean 4 kernel check, declared axioms audited | Uses `sorry`, `admit`, extra axioms or non-reproducible build |
| Numerical simulation | COMSOL batch on a *copy* of an approved MPH model, independent post-check | Overwrites source or presents simulation as measurement |
| Performance | Model, version, quantization, context, load time, output tok/s and peak memory | Uncontrolled comparison across unequal settings |

## Test procedure

1. Create fresh temporary Git worktree or clone. No agent writes to the production branch.
2. Capture clean baseline, hash inputs and install pinned dependencies.
3. Run a fixed task with a single specified model and agent interface.
4. Log exact commands and tool decisions. Prefer supervised permissions.
5. Validate with deterministic tests; ask a separate agent to search for counterexamples.
6. Reject any result that cannot be independently reproduced.
7. After review, open a scoped PR. The evaluator does not auto-merge.

## Workstation and confidentiality

The reference machine is macOS on Apple Silicon with 32 GB unified RAM. Run large local models serially; monitor memory pressure and swap. Public HCC data can be used for controlled cloud comparisons, but **private Lean / BINDU materials must not be sent to third-party endpoints without explicit per-task approval**. Do not commit secrets, machine-specific paths or private experiment data.

## COMSOL bridge

The official COMSOL 6.4 macOS batch syntax is:

```sh
comsol batch -inputfile approved_source.mph -outputfile new_result.mph -study std1
```

Check installed version, license and actual study tag before running. A local dry-run wrapper and independent Python benchmark suite are maintained separately from the production HCC repository.

References: `SCIENTIFIC_CONTRACT.md`, `package.json`, `.github/workflows/core.yml`.


## Pilot run — 2026-11-14 (user-reported macOS execution)

The initial **Codex 0.169.0 / GPT-6.1-Sol high** scratch trial used the `physics` fixture from AI Agent Lab. No production HCC files were involved.

| Measure | Recorded result |
| --- | --- |
| Task | Repair thermal relaxation `thermal.py` |
| Agent-reported edit | One line: `exp(-t*tau)` → `exp(-t/tau)` |
| Physical validation | `t/tau` dimensionless for times measured in seconds |
| Agent-reported duration | 37 seconds (includes tool interaction; not a cross-model benchmark) |
| Independent grading | `python3 agent_trials.py grade <workspace>` → `passed: true`, exit 0 |
| Test suite | Four `unittest` checks: zero, at `tau`, at `tau/2`, invalid `tau` |
| Limitation | Fixture's docstring already describes the correct analytical solution; this is a *baseline tool-use/syntax correction*, not evidence of frontier reasoning ability |

Evidence: local terminal transcript reviewed in ChatGPT, 2026-11-14. Raw transcripts and machine-identifying paths are intentionally not committed. Future runs must capture full reproducible logs and report results of peer models before ranking.

## Second pilot — Antigravity CLI 1.5.9 / Gemini 4 Argon High (2026-11-14)

The user-reported CLI run used a **separate fresh** `physics` scratch workspace. The agent inspected `thermal.py` and `test_thermal.py`, changed one line to `math.exp(-time_seconds / tau_seconds)`, attempted `pytest` (failed), switched to `python3 -m unittest discover -v`, and reported 4/4 tests passing. Thought time shown: 20.5 seconds; **full wall-clock duration not captured**. Its physical explanation correctly identifies dimensionless `t/tau` versus `t*tau` measured in seconds². **Status: independently graded — `passed: true`, `exit_code: 0`, four unittest checks passed.** Do not rank its speed against Codex's 37-second wall-clock run. The initial `pytest` failure followed by successful tool substitution is a concrete recovery behavior.

## S³ geodesic pilot — Gemini 4 Argon High (2026-11-14)

The user reports a fresh `s3` scratch run at `s3_20261114_160907_387751` (the local path itself is not published). Antigravity CLI 1.5.9, Gemini 4 Argon High, changed `s3.py` to use `radius * acos(clamp(dot(u,v), -1, 1))` for unit vectors in `R^4`; the assistant's transcript shows independent `agent_trials.py grade` with `passed: true`, `exit_code: 0`, and 4/4 checks (identical, antipodes, orthogonal, invalid radius). At least one tool command failed before recovery. No complete wall-clock duration is available. Scope: validates this finite fixture only, **not cosmological observation or broader mathematical correctness**.

Codex s3 comparison is **not yet valid**: user supplied a literal placeholder instead of an actual scratch workspace path, and `$WORKSPACE` was unset when grading; neither incident counts as an agent failure. The earlier Codex physics run remains valid.


## S³ geodesic pilot — Codex 0.169.0 / GPT-6.1-Sol High (2026-11-14)

The user ran the `s3` fixture in a fresh direct-child scratch workspace (`s3_20261114_161705_616041`) with Codex. The independent `agent_trials.py grade` returned `passed: true`, `exit_code: 0`; all four tests passed (`test_antipodes`, `test_bad_radius`, `test_orthogonal`, `test_same`). The Codex UI reported a detached session and provided a resume ID; this does not by itself establish whether all agent work had finished, but the grader found the expected correct resulting code. There is no recorded complete wall-clock runtime for this trial.

**Current baseline:** Codex physics 4/4 and S³ 4/4, Gemini physics 4/4 and S³ 4/4. No statistically meaningful quality ranking can be drawn from these simple four-test fixtures. Next steps: reproducible local-model runs on clean independent workspaces, stronger held-out tests, immutable source hashes, no test edits, and time/memory/token accounting.


## Local model pilot — Qwen3.8 27B MLX via Ollama/OpenCode (2026-11-14)

The user's Mac terminal reported the installed model tag `qwen3.8:27b-mlx`, Ollama-reported `qwen3_5` architecture, 27.8B parameters, `nvfp4` quantization, 262144 advertised context length, and `tools`, `vision`, `thinking` capabilities. These are **reported metadata**, not a measurement of usable context or tool quality. In a separate `s3` scratch workspace `s3_20261114_162313_480737`, OpenCode with this model yielded an independently graded result: `passed: true`, `exit_code: 0`, 4/4 unittest checks passing (antipodes, bad radius, orthogonal, same). The session name in the UI was “S^3 geodesic distance fix”. Exact wall-clock runtime, tool trace, model memory footprint, test integrity and prompt budget have not been separately audited; these limitations prevent claims of performance superiority.

**Current S³ fixture baseline:** Codex / GPT-6.1-Sol 4/4; Antigravity / Gemini 4 Argon High 4/4; OpenCode / local Qwen3.8 27B MLX 4/4. This is correctness on four public fixture tests, not a general intelligence ranking.

## Autonomous supervisor pilot and remediation — 2026-11-14

A user-run local AI Agent Lab AUTOPILOT queue reported:
- Local Ollama Qwen3.8 27B MLX completed thermal physics (48.98s), round S³ geodesic distance (39.41s), exact rational 2×2 PSD (65.64s); each passed the fixture checks on first attempt.
- Lean failed with OSError [Errno 86] Bad CPU type at ~/.elan/bin/lean; a launcher/toolchain architecture failure, not evidence of inability to prove mathematics.
- HCC static review failed after about 129s. Exact cause is not established by the summary alone.
- comsol_probe PASS only indicated a successful diagnostic command, not proven COMSOL installation, license, or solver completion.

An AUTOPILOT 1.1 patch was prepared and tested offline (30/30 tests):
1. Lean executable architecture/version preflight; explicit isolated native Apple Silicon Lean 4.19.0 using Homebrew elan-init; existing ~/.elan and scientific project toolchains untouched.
2. Evidence-grounded HCC review of partial PUBLIC excerpts with network diagnostics, public cache fallback, optional local checkout, bounded retries and literal quote checks.
3. Atomic per-job reports and selective retry of failed tasks while preserving completed jobs/results.
4. Accurate COMSOL binary detection and no misleading PASS when no executable is found.

Evidence boundary: tests used a clean installation copy with mocked model and filesystem responses. Native Lean installation on the user's Mac, resumed HCC audit, and any COMSOL computation remain unverified. No HCC main branch code change or scientific discovery is asserted.


## AUTOPILOT 1.1 first completed queue — 2026-11-14

User-supplied Terminal logs and locally generated REPORT.md record all **8/8 queue items with status done / PASS** after repairing the Apple Silicon Lean runtime and resuming only two failed jobs. Previously completed jobs were preserved.

| Job | Model as reported | Result | Recorded elapsed |
| --- | --- | --- | ---: |
| doctor | — | PASS | 0.06s |
| fix / physics | qwen3.8:27b-mlx | PASS | 48.98s |
| fix / s3 | qwen3.8:27b-mlx | PASS | 39.41s |
| fix / psd | qwen3.8:27b-mlx | PASS | 65.64s |
| fix / lean | qwen3.8:27b-mlx | PASS | 43.5s for successful retry |
| comsol_probe | — | PASS | 0.13s |
| setup_review | qwen3.8:27b-mlx | PASS | 47.81s |
| hcc_review | qwen3.8:27b-mlx | PASS | 73.71s for successful retry |

Final report timestamp: `2026-11-14T20:43:37+00:00`. Background worker 81110 logged `AUTOPILOT STOP` and no longer runs; this is expected after all queued tasks are complete. Lean was diagnosed with native `/opt/homebrew/bin/lean` version 4.19.0 arm64; runtime setup succeeded. Reported Lean attempt count 5 is cumulative across original errors and retried work.

**Evidence boundaries:** this is a record of user-executed local supervisor results; the exact contents of `fix-lean-*.json` and `hcc_review-*.json` were not yet independently inspected here. The Lean PASS concerns the small test fixture, not a completed proof of a general BINDU-VECTRA theorem. An HCC review PASS is not a validation of cosmological claims. The COMSOL probe PASS is not evidence that licensed COMSOL can run a model or has performed a converged simulation. Reproducibility and scientific audit must inspect task result files and actual verification commands before upgrading the status of any claim.


## Evidence audit of the completed local AUTOPILOT queue — 2026-11-14

User supplied task-result JSON, independently compared with the released AI Agent Lab 1.1 implementation. The green 8/8 queue concerns successful **supervisor jobs**, not completed end-to-end scientific validation.

1. `fix / lean` result: `passed=true`, `exit_code=0`, `model=qwen3.8:27b-mlx`, output file SHA-256 `21c08bdf5774bd984378c19c6cdb27788329863a36a420329dfc646d50a14ab4`; task fixture in `agent_trials.py` is `theorem nat_add_zero_lab (n : Nat) : n + 0 = n := by sorry`. The compiler is a meaningful kernel gate for this **elementary theorem only**. In `autopilot.py` the `hidden_grade` Lean branch returns a literal success note and does not add independent hidden proof obligations.
2. `hcc_review` result: sampled `package.json`, `SCIENTIFIC_CONTRACT.md`, `VALIDATION.md`, `.github/workflows/core.yml` as 1608 + 2400 + 2400 + 2400 bytes of **public document excerpts**. Local model returned zero findings, zero verified quotes, and explicit limitations. `status='PARTIAL STATIC REVIEW — ... no code executed'`. Its PASS denotes successful scoped summarization, **not an executed security audit or scientific certification**.
3. `comsol_probe` result: stdout `NOT FOUND (provide --comsol path)`, no batch solver run. Its old PASS (pre-patch) was an erroneous probe-status interpretation. COMSOL existence, licensing and scientific simulation remain **unverified**; do not count this as an operational COMSOL validation.
4. Physics/S³/2x2 PSD tasks passed finite predefined and held-out test cases. They remain benchmark fixtures, not general discoveries.

Acceptance gate for next phase: actual HCC source checkout with pinned commit and executed validation tests; named theorem + kernel check + `#print axioms` for research Lean; verified COMSOL native executable and approved `.mph` batch run with independent residual/convergence checks; logs/hashes and permissions tracked per task.


## COMSOL 6.2 batch validation incident — 2026-11-14

A real licensed COMSOL 6.2.0.339 batch run on Apple M1 Max loaded a local training model, generated a tetrahedral mesh (16,395 elements; minimum element quality 0.05743), but **failed during stationary equation compilation**, before a valid solution was generated. The COMSOL log states `Error in multiphysics compilation. The source selection for the operator aveop1 must be nonempty.` The adjacent `.mph.status` ended in `Error`. COMSOL still saved an output `.mph` and the wrapper recorded exit code 0; the old bridge incorrectly interpreted this as `ok=true` after 19.5 seconds. The source model was not overwritten.

Root cause at wrapper level: its `ok` computation was simply `r.returncode == 0` and failed to inspect the model's status file and batch log. A separately packaged local COMSOL validator patch was developed and tested offline: it checks process code, log, status, and output artifact; evaluates earlier `.run.json` files in a non-destructive `audit` mode; emits a separate `*.verification.json`; and does not declare successful scientific validation from solver completion alone. Six patch regression tests plus nine original AI Lab tests passed on a clean copied installation. **The patch has not yet been installed on the user's Mac.**

No physical claim, valid stationary solution or mesh-convergence result is implied by this COMSOL run. Any automated COMSOL agent must treat `.mph.status = Error` and an error-bearing log as hard failures regardless of `.mph` existence or exit code.


### User-confirmed COMSOL false-positive fix installation (2026-11-14, ~22:20 CET)

The user installed the COMSOL bridge patch in AI Agent Lab on Apple Silicon. The installer backed up the previous `comsol_bridge.py` and ran **6/6 new validation tests successfully**. Running `python3 comsol_bridge.py audit --report runs/comsol/boolean_selections_start_solved_20261114_221337.run.json` returned `VERDICT: FAILED`, with both the explicit COMSOL log error and `.mph.status=Error` noted. A new `.verification.json` was written, original model and prior runs retained. The patch is **confirmed on the user's Mac**, but a fully solved independent physics example is not yet confirmed.

The original COMSOL input, `boolean_selections_start.mph`, is the officially published **start-state** of COMSOL's training exercise 'How to Use Boolean and Adjacent Selections'; its companion `boolean_selections_complete.mph` is offered on the same COMSOL Learning Center page: https://www.comsol.com/video-training/getting-started/boolean-adjacent-selections-comsol-multiphysics. This exercise provenance is material to interpreting the empty `aveop1` source selection. Compare starter versus completed geometry/selection setup before changing physics or declaring a solver bug.


### Completed tutorial model also fails at equation compilation (2026-11-14)

User ran licensed COMSOL 6.2.0.339 `Study 1` on the **official tutorial's completed** `boolean_selections_complete.mph`, via AI Lab validated `comsol_bridge.py batch --execute --study std1`. Evidence Gate returned `VERDICT: FAILED` due to `.mph.status=Error` and an explicit batch-log error. Tetrahedral mesh generation finished with 36,217 elements (minimum element quality 0.1302), followed by the same hard stop as the starter model: `Error in multiphysics compilation. The source selection for the operator aveop1 must be nonempty.` A separate warning said: `There is no feature constraining the pressure`, under `Turbulent Flow, k-ε`. The warning is not the immediate fatal exception, but pressure-reference consistency will need assessment before accepting a solution.

Therefore the problem cannot be attributed solely to using the tutorial `start` model. The `complete` tutorial file is a completed *selections exercise* and is not independently established to be a simulation-ready convergent model. Next steps: in a copied `.mph`, inspect `Component > Definitions > Nonlocal Couplings > Average 1 (aveop1)` source selection, trace named Boolean/Adjacent selection chain, rebuild geometry, verify nonempty chosen entity IDs; maintain semantic selection and avoid arbitrary 'All domains' substitutions. Audit COMSOL native result via status/log as well as output presence. Neither run produced a valid stationary solution.


### Codex diagnostic: root cause of COMSOL average-source failure (2026-11-14)

User shared a detailed local Codex terminal transcript of a **read-only source-model investigation** using COMSOL Java API and isolated diagnostic outputs at `runs/comsol/aveop1_diagnostic_20261114/`. Observed `aveop1` source selection: manual boundary selection with **0** entities. Available named selection `geom1_intsel1` (Water-Air Interface) contains **208** boundary entities. The model's saved history suggests `intsel1` had been deleted/recreated without rebinding the nonlocal Average coupling. A copied diagnostic model rebound `model.component("comp1").cpl("aveop1").selection().named("geom1_intsel1")`; a subsequent equation-compilation-only check logged `PATCHED_EQUATION_COMPILATION_PASSED`. **Not an end-to-end solver success:** other `spf` and `ht` inlet/outlet boundary features had empty selections, and `k-epsilon` pressure reference remained warning. Codex intentionally did **not** attempt a full solution. Original `.mph` was reported unchanged. These claims are grounded in the user-shared Codex output, not independently replayed here.

The actual model's physics and naming strongly correspond to COMSOL 6.2's official *Shell-and-Tube Heat Exchanger* tutorial, which documents named Boundary selections: `Inlet Water`→1, `Outlet Water`→339, `Inlet Air`→332, `Outlet Air`→89 (for its documented geometry). See https://doc.comsol.com/6.2/doc/com.comsol.help.models.heat.shell_and_tube_heat_exchanger/shell_and_tube_heat_exchanger.html . **Before use, verify these entity numbers still match the built local geometry** and reconnect both `spf` and `ht` boundary conditions semantically; do not insert arbitrary pressure constraints or declare a physical solution until all physics selections and solver diagnostics are validated.

Official documented illustrative targets for the tutorial include about 5.9 W/(m²·K) equivalent heat-transfer coefficient, tube-side pressure drop <40 Pa and shell-side about 13 Pa, under its published assumptions. Treat as approximate external sanity references, not exact acceptance thresholds or substitute for mesh-convergence tests.
