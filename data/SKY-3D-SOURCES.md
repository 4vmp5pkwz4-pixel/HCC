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

## 4. The local universe, galaxy by galaxy (`DSO3D_GAL`, `DSO3D_LOCAL`)

The giant structures of the Solar world were drawn only as volumes. What fills them is
now drawn too: **4 341 galaxies** at their catalogued distances out to 333 Mpc, in their
real directions. With them the Local Group, the Virgo and Fornax clusters, the Great
Attractor, Perseus–Pisces and Coma appear because the galaxies are where they are, not
because a shape was placed there. `docs/verify-the-giant-structures-are-made-of-galaxies.cjs`
measures this against the same cone pointed in 400 other directions: within 6° of M87 at
12–25 Mpc there are 73 times as many galaxies as in an average cone, and within 2° of the
centre of Coma at 85–125 Mpc there are 127 times as many.

Each galaxy is an 8-byte record: RA (u16), Dec (i16), log₁₀(d/kpc)+2 (u16, ×8000, so
0.029 % in distance), V (u8, ×10) and a morphology class. A galaxy is drawn as a soft
disc of its own size, taken as 30 kpc·√(L/L₋₂₁), when that disc is resolved, and as a
point otherwise. The brightness of a point falls as L/d², relative to the galaxies at the
distance the camera is looking at.

- **Beyond ~10 Mpc** most distances come from the redshift through the Hubble law. A card
  gives the redshift when the catalogue has one.
- **Twenty-one distances** that the catalogue has wrong or does not give are replaced by
  the published measurement, and each card names it. These are the Magellanic Clouds
  (Pietrzyński et al. 2019; Graczyk et al. 2020), eighteen Local Group dwarfs
  (McConnachie 2012), NGC 1569 (Grocholski et al. 2008), Centaurus A (Harris et al. 2010)
  and M87 (Mei et al. 2007). The catalogue had put NGC 6822 at 1.25 Mpc instead of 459 kpc
  and IC 1613 at 1.61 Mpc instead of 755 kpc. It had no distance for the SMC, Leo I,
  Leo II or WLM.
- **The placeholder shell is left out.** In the catalogue, 49 489 galaxies have no redshift
  (z = 99, its "unknown"), no distance uncertainty, and a distance between 30 and 42 Mpc. That
  puts 92 % of its galaxies with a distance on one sphere, 36 ± 4 Mpc about the Sun. This is a fill value, not a
  measurement.
  - Every galaxy with a real distance outside that band has a redshift it agrees with: the
    median d/D_C(z) is 1.00 for z > 0.01.
  - The φ-ladder periodogram (section 6) exposed the shell. Those galaxies gave R ≈ 0.82 at
    every period, which is possible only if nearly all of them share one distance.
  - The 108 galaxies without a redshift elsewhere carry individual distances, most of them in
    the Local Volume, and stay.
- **Left out.** IC 359 is left out because the catalogue puts it at 0.1 kpc, inside the
  Galaxy. For the same reason, no cluster or nebula nearer than 10 pc is drawn.
- **Designations.** Every object carries all the designations the catalogue gives it. They are
  searched by the palette and sent to the photo archives:
  - M, NGC, IC and Caldwell;
  - Melotte, Collinder, Trumpler, Stock and Ruprecht;
  - Barnard, Sh 2, LBN, LDN, vdB and RCW;
  - Abell, HCG, UGC, PGC, PN G and SNR G.

  Fifty famous nebulae and clusters also carry the name photographs are filed under, such as
  Hyades, Cave Nebula and Omega Centauri. No object is left as a bare "DSO" number.
- **M31** is not drawn a second time. Its point would stand on the M31 model the atlas
  already has, and a pick on it opens that model's card.

Around and inside the Milky Way stand its own **637 clusters and nebulae** with catalogued
distances. They include all 127 globular clusters, forming a halo from 2.2 to 82.6 kpc.
They are shown at galactic scale.

When the galaxies are on, the uncertainty volumes of the structures step back. A volume
the camera is inside is not drawn as a wireframe: from within, its cage would cover the
whole view and show nothing about the structure. Its label still says where it is.
Controls has a switch for the layer: *Galaxies and nebulae · real 3D*.

- **Source**: the Stellarium 23.4 deep-sky catalogue, format 3.20, from the same package
  as above: `usr/share/stellarium/nebulae/default/catalog.dat`, SHA-256
  `6629ddf3ad04586339caf1f0cc4a590006d53a527b8821ba163b7fb2387371dc`. Its redshifts and
  distances are compiled from NED and HyperLEDA. Stellarium is © the Stellarium team,
  GPL-2.0+. Only the measured numbers are taken.
- **Rebuild**: `python3 scripts/build-dso-3d.py <stellarium-data>/usr/share/stellarium/nebulae/default/catalog.dat`

## 5. The quasars, the light census and the light field (`QSO3D`, `HCC_LIGHT`)

**The quasars.** 5 959 quasars are drawn in the cosmic layer at their comoving distances, out
to z = 4.5. Each has its own card: redshift, comoving distance, light-travel time and
luminosity.
- **Source.** The catalogue shipped inside Stellarium 23.4, drawn from Véron-Cetty & Véron
  (2010), *A catalogue of quasars and active nuclei, 13th ed.*, A&A 518, A10, limited to
  V ≤ 18. `scripts/build-quasars-3d.py` extracts it from the Stellarium binary. It scans the
  binary's zlib streams for the Qt resource, so no Qt tooling is needed. Hashes:
  - `.deb` `stellarium_23.4-2build3_amd64.deb`:
    `6cf830b585b32d729d3dc4fdf6601553fefebcad7cb1135c7c39dc09eca459cf`
  - the resource: `baf0ea0f234b142cea52f18127d830e86c4327145d36acce3cac01abb4f9e6e2`
- **Selection.** Only entries with catalogue M ≤ −23 are kept, the catalogue's own definition
  of a quasar. The fainter nuclei are Seyferts, whose light sits in galaxies the galaxy
  catalogue already holds.
- **Cosmology.** Flat ΛCDM with H₀ = 67.4 and Ωm = 0.315, the same model as the rest of the
  cosmic layer. This gives D_C(z = 1) = 3401 Mpc and a light-travel time of 7.95 Gyr.
- **Absolute magnitudes.** M_V is recomputed for every quasar, V − 5 log₁₀(D_L/10 pc) − K,
  with K for α_ν = −0.5. The card shows the catalogue's own M beside it. The median offset
  is −0.47 mag: the catalogue's M is a B-band value in its own cosmology, and for quasars
  B − V ≈ 0.3.

**The light census.** The census asks: inside a sphere of radius R about us, what share of
the light comes from galaxies and what share from quasars? It gives three answers, and the
first is the fair one.

1. **The 1/Vmax luminosity density** (Schmidt 1968). Each source is weighted by the volume
   inside R in which its own list would still have caught it. The galaxy list with measured
   distances is complete to V ≈ 12: its counts rise with the Euclidean slope up to there
   and flatten by 13. The quasar list is complete to V ≈ 17.5. This gives an unbiased
   luminosity density for each class.
   - Galaxies: ≈ 2.2 × 10⁸ L☉ Mpc⁻³ in V.
   - Quasars: 0.16 % of the local light inside 100 Mpc, 0.064 % inside 200 Mpc and 0.032 %
     inside 333 Mpc.

   Both lists are compilations, not all-sky surveys, so both densities are lower bounds.
2. **Volume-limited.** Only sources bright enough that both lists would see them anywhere
   inside R. That is the luminous end, where quasars weigh far more: 19 % above M = −23.0 at
   100 Mpc and 44 % above −24.5 at 200 Mpc. This answer is shown only when both classes
   have such a source.
3. **The catalogue totals.** These favour whichever list reaches fainter.

Inside a region 50 million light years across there is no quasar, and all the light is
starlight: 106 galaxies. The nearest quasar is 97 Mpc away, or 317 million light years.

**The light field.** The light field is a sphere 200 million light years across, centred on
us, sampled on a grid of 48 cells a side. It holds the V-band light of the 273 galaxies with
M ≤ −20.43. Those galaxies are bright enough to be seen from anywhere in the sphere, so the
field does not fade with distance merely because the catalogue does. The field is
smoothed with a Gaussian of 2.4 Mpc, and cells above three times the mean are drawn as a
glow. The glow is the large-scale distribution of the light itself: the Local Sheet, the
Virgo cluster, the Fornax–Eridanus cloud and the filaments between them.

The census and the field are checked by `docs/verify-the-light-has-its-sources.cjs`, which
recomputes them from the embedded catalogues and runs three mutations.

## 6. The measured universe on the φ-ladder (`HCC_PHI_CENSUS`)

The golden ladder N = ln(d / ℓ_P) / ln φ was tested on 113 literature scales and found to be
a coordinate, not a law. Here every distance from the Sun that this atlas has measured is
placed on it: 26 160 in all, on rungs 245 to 292.
- 15 223 Hipparcos stars (ϖ/σϖ ≥ 5);
- 637 clusters and nebulae;
- 4 341 galaxies;
- 5 959 quasars.

**The census.** The census shows how many objects, and how much V-band light, lie on each
rung. Each φ-shell card in the FBS3R world now says what the atlas has measured at that
distance.

**The periodogram.** With tens of thousands of values, a naive Rayleigh test is the wrong
question. The smooth run of numbers with distance leaks into every period, so the naive test
calls φ "significant" (p = 1 × 10⁻⁴), and √e and 2 as well. The question is asked instead the
way a spectrum is read: R at ln φ is ranked among 421 periods from 0.30 to 0.72.
- φ does not stand out. Its rank p is 0.28 overall.
- It stays unremarkable within each class: stars 0.71, clusters 0.77, galaxies 0.33,
  quasars 0.44.
- The measured distances do not sit on the golden rungs. The ladder stays a coordinate.

**What the periodogram exposed.** The periodogram is also what exposed the catalogue's fill
value. Before the placeholder shell was removed, the galaxies gave R ≈ 0.82 at every period,
which is possible only if nearly all of them share one distance (section 4). The check is
`docs/verify-the-measured-universe-on-the-ladder.cjs`.

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
