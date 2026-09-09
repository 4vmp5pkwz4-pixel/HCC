# Scientific workspace and forecast evidence

The user requests a published improvement to scientific logic, predictive accuracy, interface organisation and agent capabilities. Build on Atlas 4.172.0 and preserve all existing laboratories and the Galactic Butterfly explorer.

## Design

Keep the existing visual Atlas and its scientific catalogues. Turn `agent.html` into a lightweight research workspace with instrument search, exact contracts, a scaling explorer, a holdout forecast audit and direct machine-readable entry points. Use the existing gold/ink palette, restrained typography, responsive grids, keyboard controls and explicit evidence labels.

The pure `core/prediction/forecast-audit.mjs` module evaluates supplied predictions on a declared chronological holdout. Inputs identify the model, dataset source, units, data kind, training cutoff, prediction issue time and target time. Refuse malformed numbers, inconsistent intervals, duplicate forecast targets at the same origin and temporal leakage. Report MAE, RMSE, signed bias, baseline skill, interval coverage and interval score; group by exact forecast horizon. Synthetic examples remain synthetic. Supplied timestamps are declarations, not proof that predictions were registered before observations.

Fix the reach module's coercion of missing values into zero. Keep law-based ratios as conditional model scenarios, with explicit domain/uncertainty limitations. Never call perturbation endpoints confidence intervals.

Publish a versioned static ESM SDK, JSON input schema, discovery descriptor and agent instructions. The SDK loads matching manifest/reach/version identities, searches/describes instruments, computes scaling scenarios and audits forecasts without WebGL or a backend. Add the same audit as a server kernel so HTTP and MCP use the identical arithmetic. Static Pages discovery must explicitly say that the compute server is self-hosted and not available at the public Pages origin.

## Scope and verification

No new dependencies, automated heavy workflows, speculative scientific claims or unrelated refactoring. Preserve main's current CI policy. Test hand-computable metrics, future-data rejection, null handling, zero-error baselines, large finite errors, interval penalties, SDK version mismatches, path-safe static discovery and core registration. Run current source/release gates and generated-artifact checks before PR and merge. Confirm the actual deployment identity after merge.
