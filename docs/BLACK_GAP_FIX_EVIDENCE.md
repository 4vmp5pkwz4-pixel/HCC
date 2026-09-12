# Solar → Observable black-gap fix evidence

- Reproduction invariant: current pre-fix value `26` is interpreted as 26 Gly, outside the allowed Local-Group seam range and 1300× the 0.020-Gly return seam.
- Fix: `solarObsOutGly = 0.026` (26 Mly).
- Hysteresis after fix: outward 26 Mly, inward 20 Mly; ratio 1.3.
- The one-shot CI run first required the pre-fix regression to fail, then applied the correction, required `docs/verify-scale-continuity.cjs` to pass, ran `scripts/validate.mjs`, removed its own repair machinery, and ran the full `npm test` source regression suite.
- One-shot workflow run: 34698668908, conclusion success.
