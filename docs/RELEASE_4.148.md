# 4.148.0 — Observer distances agree across the atlas

Build: `observer-distance-consistency-2026.09.05.1`.

The observer laboratory now sends angular-diameter distance, `D_A`, to the
Einstein-ring source-distance input. It previously sent luminosity distance,
`D_L`. Both use Mpc, but they answer different physical questions. Photometry
continues to receive `D_L`.

At source redshift one, `D_L = 4 D_A`. Substituting `D_L` for `D_A` in the
thin-lens Einstein-angle formula makes the angle too small by a factor of two
when the mass, lens distance and lens-to-source distance are held fixed.

## Changes

- Distance ports declare `quantity_kind` in the browser API and generated
  manifest. Link declaration and candidate discovery reject incompatible kinds,
  including an unspecified kind connected to a specified one. Unit conversion
  remains available between ports with the same kind. Existing links whose two
  endpoints are unspecified retain their previous behavior.
- The three active distance markers, turnover marker and comparison family now
  share the curves' coordinate frame and matter-density depth. The extra parent
  translation on the markers has been removed. The live values use the same
  numerical integration settings as the API.
- The observer controls contain a compact, localized readout for `D_C`, `D_A`
  and `D_L`, explaining which quantity controls geometry and which controls
  brightness. Distance duality is displayed alongside the values.
- The manifest gate fails when its browser cannot run, instead of returning a
  successful check without inspecting the page. Browser dependencies are
  installed before that gate. Dependency versions are locked for development
  and CI; GitHub Pages does not require a new build system.

## Regression checks

`node docs/verify-observer-distances.cjs` exercises the actual production API and
quantity bus: correct delivery, provenance, kind declarations, refused invalid
links, retained unit conversion, candidate discovery, an independent analytic
Einstein–de Sitter distance and distance duality over the declared redshift range.

`node docs/verify-observer-scene.mjs` executes the production scene using real
Three.js transforms without a GPU. It compares marker positions against sampled
curve vertices, the turnover and the comparison family's frame at three values
of matter density. Both suites are release gates.

## Scientific scope

The displayed curves, readout and API use the existing flat matter-plus-Lambda
cosmology with a fixed radiation-density term. Curvature is not supported.
Distance duality is an internal identity check, not an independent observational
validation of the cosmological model. The simple flat readout should not be
interpreted as a complete high-redshift cosmology.

Only the source distance is coupled automatically to the lens laboratory.
`D_lens` and `D_lens_source` remain independent user inputs. This release does
not derive all three angular-diameter distances from a pair of redshifts;
users must choose a physically consistent lens geometry. Lens-to-source
angular-diameter distance is not obtained by subtracting the two observer
angular-diameter distances.

This correction does not establish the atlas's separate speculative claims,
including a derivation of `N_phi = 292`.

Definitions and lensing-distance convention: David W. Hogg,
[Distance Measures in Cosmology](https://arxiv.org/abs/astro-ph/9905116),
[angular-diameter distance](https://ned.ipac.caltech.edu/level5/Hogg/Hogg6.html),
[luminosity distance](https://ned.ipac.caltech.edu/level5/Hogg/Hogg7.html).
