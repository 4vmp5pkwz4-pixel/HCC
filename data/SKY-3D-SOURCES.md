# The whole sky in three dimensions — sources, method and attribution

The Solar world used to draw its sky as 72 000 random points on a shell 462–660 AU
from the Sun. That put stars **inside the Oort cloud**, which begins at about 2 000 AU,
while the nearest real star, Proxima Centauri, is 268 000 AU away. Those points are
gone, and so are the 10 000 random speckles and 430 random dust clouds of the Milky Way
panorama. What replaces them is below. It is generated offline and embedded in
`index.html`, and the atlas fetches nothing at run time.

## 1. Every star to V = 7 (`HCC_SKY_HIP`, `HCC_SKY_HIP_NAMES`)

The embedded catalogue has **15 544 Hipparcos stars**, every one to V = 7. It was written by
`scripts/embed-sky.mjs` into `index.html` as fixed-width records of 30 bytes:

- HIP number (u32)
- RA (u32, 2³²/360°) and Dec (i32, ×10⁷), both ICRS at J2000
- V (i16, ×100) and B−V (i16, ×1000)
- ϖ (u32, 0.01 mas), in the catalogue's own unit
- σϖ (u16, µas)
- μα\* and μδ (i32 each, 0.01 mas/yr)

No value is rounded beyond its source.

| star | drawn as |
|---|---|
| ϖ/σϖ ≥ 5 (**15 223** stars) | placed at d = 1/ϖ; moves in a straight line at its measured proper motion |
| ϖ/σϖ < 5 (**321** stars) | **no distance**; a direction on the sky at infinity, still moved by its proper motion |

The radial velocity is not in this catalogue. It is taken as zero, and every card says
that this is an assumption: over ±50 000 yr the direction stays right, but the distance
drifts by v_r·t. The zodiac and the 75 other constellation figures carry their own
cross-checked distances and radial velocities (see `ZODIAC-3D-SOURCES.md`, and
`sky-3d.json`, made by `scripts/build-sky-3d.py`). Those stars are drawn by their own
layers and masked in this one, and they reappear here if their layer is switched off.

The nearest placed star is α Centauri A at 1.347 pc, which is 277 940 AU. No star is
nearer than the Oort cloud's outer edge at 100 000 AU. `docs/verify-no-star-in-the-oort-cloud.cjs`
computes this from the embedded bytes. It also checks eight distances against their
published parallaxes (within 0.1 %) and runs six mutation tests. The atlas repeats the
check about itself at boot.

## 2. The sky at infinity

Everything that is only a direction rides with the camera, so it is always at infinity.
That covers the 321 stars without a distance, the Milky Way panorama and the ecliptic.
It fades out between 0.05 and 0.5 pc from the Sun. Beyond that range, a direction
measured from the Sun is no longer the direction seen from the camera.

## 3. The Milky Way as observed

The panorama is the integral of the disc (`hccGalacticBrightness`), weighted by the
**observed isophotes**: five levels with their holes, so it includes the Great Rift
through Cygnus and Aquila and the Coalsack beside Crux. The isophotes come from
d3-celestial `mw.json`. They are scan-filled column by column in galactic coordinates
(IAU J2000 north galactic pole), then smoothed with a Gaussian of σ = 1°.

## Sources and attribution

- **Hipparcos**: ESA (1997), *The Hipparcos and Tycho Catalogues*, ESA SP-1200, and
  F. van Leeuwen (2007), *Hipparcos, the New Reduction of the Raw Data*.
- **Gaia DR2** parallaxes, where the Stellarium catalogue adopts them for Hipparcos
  stars: Gaia Collaboration, Brown et al. (2018), A&A 616, A1. ESA/Gaia/DPAC,
  CC BY-SA 3.0 IGO.
- **ϖ, σϖ, μ as adopted**: the Stellarium 23.4 star catalogue, from the Ubuntu 24.04
  package `stellarium-data 23.4-2build3`
  (`.deb` SHA-256 `be57a3583ba3916397d4e7722f29a37def471205ad6ed69d844d9bd591aa3699`),
  `usr/share/stellarium/stars/default/`. Stellarium is © the Stellarium team, GPL-2.0+.
  Only the measured numbers are taken, and those are ESA's. File hashes:
  - `stars_0_0v0_8.cat` `c97a940c0a97b648851c7dd7080fec5d2961bba2f32fbb533172f1abdca9a50e`
  - `stars_1_0v0_8.cat` `311eb7d96d9ca0a9e5d4b2ae9824d3a46ffb5ac3a2c56fc3693dbe5f4cf5723a`
  - `stars_2_0v0_8.cat` `4edd2e6930562a1edbc6ec1fe2e361a373c00d066b27f90f0596f3177e64bb3a`
  - `hip_plx_err.dat` `389d622b492f9225c810f9729954bc49b39014279387c77fc2a2faf77428bed0`
  - `hip_pm.dat` `98dae1e054f271bc9ee13f90c165a21e4f686320b5975a72e77693e879051464`

  The parallax of a star is the last word of its 28-byte Star1 record, in 0.01 mas. The
  HIP number is the low 24 bits of the first word. `embed-sky.mjs` checks the zone file
  header and that the zone counts add up to the file length before reading any record.
- **J2000 positions, V, B−V, names, isophotes**: **d3-celestial 0.7.35** (npm), © Olaf
  Frohn, BSD-3-Clause (`.tgz` SHA-256
  `490796718c201e15f38c324bda5458fc4de22519313093bf261b628185eaae81`):
  - `stars.8.json` `e3ec6cde89bae0dde064d91c1edb9ec53c3c40d5c12fdf5d30f9a4de5dbc2143`
  - `starnames.json` `044a73db97f45c51e194db64e2555dc295be57897bf9da90bc3781dcd17ba216`
  - `constellations.json` `11e14f1ee19b71bff5ca8af3f6e6a20596c4609dd86d43c9a796054fce88030c`
  - `mw.json` `aee221a7a0e879418e685de00c3e68fbdfac5667c0a8aab74929ef9cf4aab4fb`

  The positions were confirmed to be J2000 by comparing them with the Hipparcos J1991.25
  positions of seven high-proper-motion stars (61 Cyg A, Groombridge 1830, Sirius,
  Procyon, 40 Eri, …). The offsets are the proper motion times 8.75 yr, to a few per cent.
- **Star and constellation names in Russian and German**: d3-celestial `starnames.json`
  and `constellations.json`, merged into the dictionary as
  `data/i18n/1000-star-and-constellation-names.json`. A name that a reviewed shard
  already translates keeps that translation.

Rebuild:

```
node scripts/embed-sky.mjs <d3-celestial>/data <stellarium-data>/usr/share/stellarium/stars/default
node scripts/build-i18n.mjs
```

The CDS archive (`cdsarc.cds.unistra.fr`), which would have given the Hipparcos new
reduction directly, is not reachable from the build environment. The Stellarium
catalogue carries the same numbers, and its values for the reference stars above match
the published ones.
