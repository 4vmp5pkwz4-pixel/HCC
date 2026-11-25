# The HCC Scale Nexus handoff, as received (25 November 2026)

These files are the handoff archive `HCC_SCALE_NEXUS_20261125.zip`, kept byte for byte so that every claim in
`docs/scale-nexus/REPORT.md` can be checked against what was handed over. `SHA256SUMS.txt` is the archive's own list; it
verifies the files here (run `sha256sum -c SHA256SUMS.txt` in this directory, ignoring the `index.html` line).

- `kernel.js`, `catalog.js`, `tests/kernel.test.js` — the reference kernel, its 11 seed entries and its test. Run
  `node tests/kernel.test.js` here: 15 079 assertions pass. The native kernel of the atlas (SNX-MATH in index.html) is
  checked against this one in `docs/verify-the-scale-nexus.mjs`.
- `lean/` — the Lean candidate. It did not compile as handed over: four definitions needed `noncomputable`. The fixed
  and extended version is `lean/scale-nexus/` at the repository root.
- `RESEARCH_RU.md`, `ARCHITECT_PROMPT_RU.md`, `README.md`, `benchmarks.txt`, `test-report.txt`, `browser-report.txt` — the
  research notes, the mission and the reports of the preparation environment.
- The prototype page `index.html` is not kept here: the in-atlas laboratory `scalenexus` supersedes it, and a second
  `index.html` in the tree would be mistaken for the atlas.
- `package.json` (added here) marks the handoff files as CommonJS, since the repository root is an ES-module package.
