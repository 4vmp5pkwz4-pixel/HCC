# Scientific Agent Workspace Implementation Plan

**Goal:** Publish a useful scientific work surface and an honest, reproducible forecast evaluation contract for humans and agents.

**Architecture:** Reuse the manifest and visual Atlas. Share pure ESM arithmetic between the static SDK, the workspace and a registered server laboratory.

**Tech Stack:** Native JavaScript modules, HTML/CSS, node:test; existing Node HTTP/MCP server.

**Spec:** `docs/superpowers/specs/2026-09-08-scientific-agent-workspace-design.md`

## Global constraints

- Preserve every existing laboratory, the 4.172.0 Galactic Butterfly work and the fast/manual CI policy.
- No new dependencies. Missing evidence remains missing. Static Pages must not advertise a live compute backend.
- Data and predictions supplied for evaluation are not independently authenticated observations.

## Tasks

1. Add `test/forecast-audit.test.mjs` with hand-computable metric fixtures, chronological leakage and malformed numeric inputs. Run it against the absent contract and confirm failure. Implement `auditForecast` in `core/prediction/forecast-audit.mjs`; register `prediction.holdout_audit` using the same function and test its outputs. Add null-exponent and null-evidence regressions before fixing `reach-forecast.mjs`.
2. Add `api/agent-client.mjs`: `connectAtlas(baseURL)` fetches `version.json`, `api/manifest.json` and `api/reach.json`, refuses HTTP/schema/identity mismatches and returns `discover`, `search`, `describe`, `forecast`, `audit`. Test with a local HTTP fixture. Publish the input schema from the module and a static discovery JSON with relative paths. Update the generator so regeneration preserves the discovery contract.
3. Replace `agent.html` presentation with `assets/scientific-workspace.mjs` and CSS. Show the searchable manifest, selected instrument contract, conditional scaling results, editable forecast audit input, sourced methods and JSON export. Provide an explicitly synthetic example. Add a visible workspace entry to `index.html` and preserve headless access and all existing routes.
4. Update release identity to 4.173.0, regenerate API metadata and validate source/release contracts, pure-module tests and core tests. Review the diff, commit on the isolated feature branch, create and merge a PR, then verify Pages deployment and the served version.

Verification commands: `node --test test/forecast-audit.test.mjs test/agent-client.test.mjs`; `node docs/verify-predictive-reach-observatory.cjs`; `npm run test:release`; `node test/run-tests.mjs`; `node scripts/extract-kernels.mjs --check`; `git diff --check`.
