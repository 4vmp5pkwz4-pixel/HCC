# The real local web — sources, method and attribution

The Observable world's layer "The REAL local web" is **found**, not listed. It is generated offline by
`scripts/build-local-web.py` and embedded in `index.html`; the atlas fetches nothing at run time.

## Source

The Stellarium 23.4 deep-sky catalogue — Ubuntu noble package `stellarium-data 23.4-2build3`,
`usr/share/stellarium/nebulae/default/catalog.dat` (the same file as `scripts/build-dso-3d.py`; SHA-256
recorded in `LOCAL_WEB_META.sha256`). It was compiled by the Stellarium team from NGC/IC, PGC, UGC and
other catalogues, with redshifts from NED and HyperLEDA. Every galaxy with a measured redshift
0.0015 < z < 0.08 is used: **17 300**.

## Method

1. Comoving distance from z in the atlas's flat ΛCDM (H₀ = 68.43, Ω_m = 0.305) — **redshift space**
   (rich clusters keep their "fingers of god"); J2000 equatorial Cartesian coordinates.
2. The catalogue is a compilation, magnitude-limited to different depths over the sky (the north is 3–4×
   denser and about a quarter deeper). A selection function fitted to it proved fragile, so the contrast
   is a **band-pass**, δ = n₈/n₄₀: the counts Gaussian-smoothed at 8/h Mpc (Einasto et al. 2007) over the same
   counts at 40 Mpc, each divided by the equally smoothed mask. Contrast on scales above ~40 Mpc is
   suppressed by construction.
3. Mask: |b| ≥ 10°, and shot noise — a cell is kept only where the 8/h kernel is expected to hold at least
   8 galaxies. That sets the reach, 179 Mpc.
4. **Superclusters**: connected regions with δ > 3 holding ≥ 20 galaxies and ≥ 1500 Mpc³. **Voids**: maximal
   empty spheres (walls at δ ≥ 0.6, radius ≥ 9 Mpc, ≥ 80% inside the mask), in the spirit of Hoyle & Vogeley's
   VoidFinder. They are kept only if the **raw** galaxies inside number fewer than half of what the same
   radial shell in the same direction (a 35° cone) predicts. Names are attached only afterwards, when a
   centre falls within a published extent.

## What came out

With no name consulted, the build found:

- the Local (Virgo) Supercluster;
- Perseus–Pisces, 8° and 4% from where the atlas had placed it by hand;
- Coma;
- Pavo–Indus, 14° away;
- two unnamed superclusters;
- 14 voids of 9–28 Mpc radius.

At the catalogued centres of Coma, Perseus, Virgo, Centaurus, Hercules, Hydra and Fornax the contrast is
above 1. Norma lies behind the Milky Way and is masked.

Checked by `docs/verify-the-real-local-web.cjs`.
