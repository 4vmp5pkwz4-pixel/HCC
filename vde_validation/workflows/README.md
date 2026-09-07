# How the VDE validation was run

These four workflow files are kept here as a RECORD, not as live CI.

They arrived on the `vde-class-validation-20260809` branch, where each triggered
on a push to that branch. The branch is gone and the runs are done — the results
are in `../VALIDATION_REPORT_20260809.md`, `../DESI_DR2_BAO_PILOT_POSTERIOR_20260809.md`
and `../DESI_DR2_BAO_PROFILE_LR_20260809.md`, each pinning the exact CLASS commit,
the classy version, the runner image and the artifact SHA-256.

They are not under `.github/workflows/` because this repository's CI policy, which
`scripts/verify-ci-policy.mjs` enforces, allows exactly two persistent workflows:
Pages plus the quick atlas validation, with the exhaustive audit manual. A
workflow that can never fire is not CI; it is documentation of a run, and it is
filed as such. To reproduce the validation, copy one back and dispatch it.
