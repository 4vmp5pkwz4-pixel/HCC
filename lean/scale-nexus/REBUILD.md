# Clean rebuild record — Scale Nexus Lean library (Frontier II, item 19)

**Pinned versions**
- Lean 4.19.0, commit 6caaee842e94
- Lake 5.0.0-6caaee8
- Mathlib v4.19.0, rev c44e0c8ee63ca166450922a373c7409c5d26b00b (`lake-manifest.json`)

**Procedure** (`build.log` is this run's log)
1. A new directory holding only `lakefile.toml`, `lean-toolchain`, the `.lean` sources and `lake-manifest.json`.
2. `lake update`, then `lake exe cache get`.
3. `rm -rf .lake/build`, then `lake build`.
4. `lake env lean Audit.lean > axioms.txt` and `lake env lean Fixtures.lean`. Both exit 0.

**Audit**
- 42 theorems: 29 in `ScaleNexus.lean`, 13 in `Frontier.lean`.
- Every theorem depends only on `propext`, `Classical.choice` and `Quot.sound`.
- No `sorry`, no `admit`, no `axiom` declaration in any source.

**Fixtures.** `Fixtures.lean` prints the 60 exact rational fixtures. They equal `fixtures.json` element for element, and the JavaScript kernel is checked against them in `docs/verify-the-scale-nexus.mjs`.

**Olean hashes (sha256)**

| Build | ScaleNexus.olean | Frontier.olean |
|---|---|---|
| development build | 88f6b87f…a37067d | 8fec991a…bd5262 |
| first clean rebuild, new directory, same sources | 88f6b87f…a37067d (identical) | 8fec991a…bd5262 (identical) |
| final clean rebuild (module docstring of ScaleNexus.lean updated: `#print axioms` moved to Audit.lean) | e7f47689682ad996d04a7fc80e8a433536ea3dc7d8477766561d26c3e9b35d27 | 8fec991a70fa0ab5c9e6ac3a46529cf66beeeae8b1d5adf9e54a76b0efbd5262 (identical) |

- Identical sources gave identical oleans across builds. The one change of hash follows the one change of source text: a docstring, which Lean stores in the olean.
- The rebuilds were made by the same agent on the same machine type. **An independent rebuild by a reviewer on other hardware is part of G7 and has not been done.**
