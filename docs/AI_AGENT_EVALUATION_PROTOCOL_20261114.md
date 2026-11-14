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
