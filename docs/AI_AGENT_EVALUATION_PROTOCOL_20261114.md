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
