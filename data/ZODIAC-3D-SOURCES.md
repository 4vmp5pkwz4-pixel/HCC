# The zodiac in three dimensions — sources, method and attribution

`data/zodiac-3d.json` is the catalogue the atlas embeds as `ZOD3D_STARS`,
`ZOD3D_FIGURES` and `ZOD3D_META` in `index.html`. It was generated once, offline,
by `scripts/build-zodiac-3d.py`; the atlas fetches nothing at run time.

## What it contains

528 stars: every catalogued star (V ≤ 5, plus every star of Stellarium's twelve
western zodiac figures) inside the IAU 1930 boundaries of the twelve zodiac
constellations and of Ophiuchus. Membership is decided by the boundaries (Roman 1987
lookup via astropy, stars propagated to J2000.0 first) and agrees with the
Bayer/Flamsteed designation for all 409 stars that carry one.

Each star has **one** self-consistent astrometric solution (position, proper motion,
parallax, reference epoch) from **one** source, chosen by a stated rule:

| star | adopted solution |
|---|---|
| V ≥ 5 with a Gaia DR3 solution | Gaia DR3 (epoch J2016.0) |
| V < 5, or no Gaia DR3 solution | SIMBAD 2018 compilation (Hipparcos new reduction; epoch J2000.0) |
| neither | Hipparcos (ESA 1997; epoch J1991.25) |
| BSC5-only "parallaxes" | not used — the star is directional only |

Radial velocities: SIMBAD 2018 where present, else Gaia DR3.

**Distance quality.** Neither source table carries parallax errors, so for the 228
stars both measure, the disagreement between the two independent compilations is
used as the error indicator and is drawn in the atlas:

- **A** — the two catalogues agree within 10 % (178 stars)
- **B** — single source, or agreement within 30 % (327)
- **C** — disagreement above 30 %, or a Hipparcos-era parallax below 1 mas (10);
  μ Sgr (0.09 mas) is placed at its lower bound of 917 pc, not at 11 kpc
- **D** — no parallax in any source; direction only (13)

## Method in the atlas

Positions are moved with the atlas clock by a port of ERFA `eraStarpv` /
`eraPvstar` / `eraStarpm` (light time solved at both epochs, relativistic Doppler
terms), checked by `docs/verify-the-zodiac-has-depth.cjs` against 370 golden values
computed by the ERFA C library (pyerfa 2.0.1.5) from −100 000 to +12 000, to better
than 1e-6 mas. The one departure from the C source is written into the code: ERFA's
`betsr != 0` guard drops the transverse-Doppler term at an observed radial velocity of
exactly zero; the algebraically identical continuous form is used.

## Sources and attribution

- **Gaia DR3** — ESA/Gaia/DPAC, CC BY-SA 3.0 IGO. Gaia Collaboration, Vallenari et al.
  (2023), A&A 674, A1. Carried here via **star-catalog-lite 1.2.0** (npm, MPL-2.0;
  TSC1 table SHA-256 `91587ffc17edde9c0736c0df821a5a9a97adda8bfe82ddfdae0d79e4f3312f40`),
  read with **js-ephemeris-lite 1.2.0** (MPL-2.0).
- **Hipparcos** — ESA (1997), The Hipparcos and Tycho Catalogues, ESA SP-1200.
- **SIMBAD** — this work has made use of the SIMBAD database, operated at CDS,
  Strasbourg, France (Wenger et al. 2000, A&AS 143, 9). The values were taken from the
  SIMBAD compilation of 4 January 2018 distributed as `sefstars.txt` with the Swiss
  Ephemeris (Astrodienst AG; distributed in **pyswisseph 2.10.3.2** under AGPL-3.0).
- **Constellation figures and IAU boundaries** — Stellarium western sky culture,
  Stellarium team, CC BY-SA; carried via
  **@found-in-space/stellarium-skycultures-western 0.3.0**. IAU boundaries from
  Delporte (1930), as edges by P. Barbier.
- **B−V colours** — HYG database v3 (D. Nash / astronexus), carried via
  **three-starmap 0.0.5** (MIT).
- **Constellation lookup** — astropy 8.0.1 (`get_constellation`, Roman 1987, PASP 99, 695).
- **Reference space motion** — ERFA via pyerfa 2.0.1.5 (BSD-3).

The figure data derived from Stellarium and the Gaia-derived values are shared under
the terms of their CC BY-SA licences; this notice preserves their attribution.
