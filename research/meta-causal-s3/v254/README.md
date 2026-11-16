# META–CAUSAL / S³ v254 | audited character sectors and quantum-action identifiability

Research monograph (non-peer-reviewed); no new confirmed fundamental laws or cosmological topology observation.

## Contents

- `META_CAUSAL_S3_254_PRD.tex`, `.pdf`: **254 consecutive results**, 12 legacy audited propositions; originals 1–244 preserved in one continuous LaTeX source; additions 245–254.
- `EXTENSION_245_254.tex`: stand-alone textual section containing exactly 10 additional results; requires context and macros of full paper for compilation.
- `SCIENTIFIC_AUDIT_RU.md`: complete change register, proofs scope and caveats.
- `verify_245_254.py`, `VERIFICATION_245_254.json`: 16,449 deterministic numerical and integer-count checks.
- `make_figures_245_254.py`, `figure_twisted_lens_multiplicity.pdf` and `figure_action_calibration.pdf`: visual controls.
- `provenance/ORIGINAL_V244_ARCHIVE_UNCHANGED.zip`: the user-provided original complete archive, unchanged.
- `provenance/PLANCK_ACTION_FOUNDATIONS_ORIGINAL.tex`, `provenance/PLANCK_ACTION_SCIENTIFIC_AUDIT_RU_ORIGINAL.md`: independent previous research on ℏ, unchanged.
- `provenance/REGRESSION_V244.log`, `provenance/REGRESSION_HBAR.log`: actual re-execution logs.

## Reproduce

```bash
python verify_245_254.py
python make_figures_245_254.py
pdflatex -interaction=nonstopmode -halt-on-error META_CAUSAL_S3_254_PRD.tex
pdflatex -interaction=nonstopmode -halt-on-error META_CAUSAL_S3_254_PRD.tex
sha256sum -c SHA256SUMS.txt
```

Dependencies: Python >=3.10; NumPy; Matplotlib for figures; REVTeX 4.2 and standard LaTeX packages for PDF. No CAMB/Einstein–Boltzmann solver, external CMB datasets or quantum hardware were used.

**Audit principle:** mathematical statements about chosen models are not statements that nature has been shown to adopt them. All authorship and submission approval pending human review.
