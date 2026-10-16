# Planck's constant: quantum-action origin, topology, identifiability

Independent research memo (17 Oct 2026) accompanying the META–CAUSAL / S³ program. **Not peer reviewed. Not a numerical derivation of ħ.**

## Files
- `PLANCK_ACTION_FOUNDATIONS.pdf` — full English manuscript, mathematical statements, proofs, references and figures.
- `PLANCK_ACTION_FOUNDATIONS.tex` — editable LaTeX source.
- `SCIENTIFIC_AUDIT_RU.md` — Russian mathematical and scientific audit.
- `verify_hbar_foundations.py` — executable checks of finite identities, lens-projector selection, and covariance identifiability.
- `verification_results.json` — machine-readable test results.
- `make_figures.py` and `figures/*.pdf` — reproducible vector figures.
- `SHA256SUMS.txt` — hashes for the release.

## Reproduce
```bash
python -m pip install -r requirements.txt
python verify_hbar_foundations.py
python make_figures.py
pdflatex -interaction=nonstopmode PLANCK_ACTION_FOUNDATIONS.tex
pdflatex -interaction=nonstopmode PLANCK_ACTION_FOUNDATIONS.tex
```

## Scope / critical caveats
1. SI fixes the numerical value of h exactly; this is a metrological definition, not a derivation.
2. Regular Weyl representations exist for all positive ħ.
3. Canonical cotangent phase spaces are exact-symplectic; lens-space twists cannot fix ħ.
4. Covariance `N + ħ*A*K` makes ħ unidentifiable with an unknown A.
5. An independently normalized quantum-to-classical action ratio and a new testable prediction are needed for physical progress.

No GitHub main branch or previous physics manuscript is modified by this research memo.
