# Predictive Reach Observatory — Design

## Goal
Turn the Atlas's already measured sensitivity, transfer and reach layers into a single auditable intervention instrument that answers: if a declared control changes, which distant observables change, by how much, through which typed route, and where the forecast must be refused.

## Scientific premise
The Atlas already measures 484 declared inputs across 113 instruments, 113 cross-laboratory routes, and composes 511 reach chains. These measurements are local and many composed exponents are not valid global power laws. The observatory must expose that information without upgrading numerical proximity or a local derivative into calibrated empirical prediction.

## Core semantics
For a control ratio r=x1/x0 and a chain with exponent a whose `power_law` verdict is exactly `true`, the deterministic scaling response is

    y1 / y0 = r^a.

This is a conditional model response, not a confidence interval and not evidence that the chain describes nature. For a symmetric fractional intervention d, the two endpoint ratios are `(1-d)^a` and `(1+d)^a`, sorted numerically.

A chain with `power_law === false` is `LOCAL_ONLY`: its measured exponent may be displayed diagnostically, but no finite intervention ratio is forecast. A chain with `power_law == null` is `UNJUDGED`: no scaling forecast is emitted.

## Numerical-control firewall
The repository currently does not type physical controls separately from numerical controls. Therefore the observatory must never silently call an untyped input a physical intervention. A small explicit registry classifies controls whose numerical role is known (beginning with `ns.step`); all other controls are reported as `PHYSICAL_OR_MODEL` rather than `physical`. This naming is deliberate: a model parameter is not automatically an independently manipulable physical variable.

## Architecture
Create a pure module `core/prediction/reach-forecast.mjs` containing all forecast arithmetic and fail-closed validation. The browser layer loads `api/reach.json`, checks version/build coherence against the page release identity, and presents the pure result through a managed global panel. No forecast operation mutates Atlas state, AtlasTime, laboratory state, or the integration bus.

Expose a read-only browser API `globalThis.HCC_PREDICTIVE_OBSERVATORY` with `status()`, `controls()`, `chains(control)`, and `forecast(control, delta)`.

## UI
Add `Predictive Observatory` to the More tools menu and unified panel deck. The panel contains:
- control selector;
- fractional intervention slider/input;
- counts for `SCALING_LAW`, `LOCAL_ONLY`, and `UNJUDGED`;
- destination cards grouped by reached laboratory;
- exact route, depth, exponent, near/far R² and drift;
- predicted response ratio only for accepted scaling laws;
- explicit refusal reason otherwise;
- JSON export carrying release identity and source artifact identity.

Add a `Predictive Reach` action to each laboratory Prediction & Validation Contract so a local laboratory can open the global instrument without inventing a new forecast path.

## Precision rules
- Never extrapolate a rejected or unjudged chain.
- Never label endpoint ratios as probability, confidence, posterior, or uncertainty bounds.
- Preserve `why`, `near_r2`, `far_r2`, `far_drift`, `holds_on`, and chain depth in every result.
- Reject non-finite exponents, non-positive intervention ratios, malformed artifacts, and version/build mismatches.
- Keep the observatory preview-only.

## Verification
A dedicated verifier must prove:
1. exponent arithmetic for positive, negative and zero exponents;
2. endpoint sorting for negative exponents;
3. rejected/unjudged chains never emit a forecast ratio;
4. malformed and version-mismatched artifacts fail closed;
5. the known `ns.step` control is not labelled a physical forecast;
6. the production browser contains the panel, API and Prediction Workbench entry point;
7. no `setAtlasEpoch`, `state.epochDays`, integration-bus mutation or state assignment occurs in the observatory fragment.

## Release
Version: `4.155.0`
Build: `predictive-reach-observatory-2026.09.06.1`
