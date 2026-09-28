# The CMB sky on the last-scattering wall — sources, method and attribution

The wall at the end of the Observable map is **one full-sky realization** of the temperature and
polarization anisotropy of this atlas's own cosmology. It is generated offline by
`scripts/build-cmb-sky.py` and embedded in `index.html`; the atlas fetches nothing at run time.

## Method

1. **Spectra — CAMB** (Lewis, Challinor & Lasenby 2000; `pip install camb`, version recorded in
   `CMB_CAMB.meta.camb`). Flat ΛCDM with the atlas's H₀ = 68.43, Ω_m = 0.305, ω_b = 0.02237
   (`HCC_S3R`), one massive neutrino of 0.06 eV, τ = 0.0544, nₛ = 0.9649 and A_s tuned until
   σ₈ = 0.8111 (Planck 2018 VI). Lensed TT, EE, TE, BB and the lensing potential are kept to ℓ = 2000,
   with θ*, z*, r*, r_drag and the age. CAMB's age (13.7072 Gyr) agrees with the atlas's own published
   integral (13.7079 Gyr) to 0.001 Gyr.
2. **Sky — healpy** (Zonca et al. 2019; Górski et al. 2005). `synfast` draws correlated T, Q, U at
   Nside 1024 with a 5′ Gaussian beam (seed 20260928); `anafast` measures it back. Its rms is
   109.27 μK against 109.33 μK from the spectrum, and its band power over 30 ≤ ℓ ≤ 1500 is 0.9997 of the
   theory.
3. **Images.** Temperature: 2048 × 1024 equirectangular, 8 bit over −400…+400 μK (JPEG). Polarization:
   smoothed to 1°, 512 × 256 RGB of (cos 2ψ, sin 2ψ, P) (JPEG). SHA-256 of both are recorded and
   checked.
4. **Colour.** The Planck collaboration's "parchment" table (256 entries), from
   `zonca/paperplots/data/Planck_Parchment_RGB.txt`, over ±300 μK. The "colour it was" mode integrates
   Planck's law through the CIE 1931 2° observer (analytic fit of Wyman, Sloan & Shirley 2013) at
   T₀(1+z*) = 2973 K. The polarization "drapery" is a line-integral convolution done on the GPU.

## What it is not

It is **not** the measured Planck sky. The measured maps are not reachable from the build environment.
What is exact is the spectrum, and so the statistics, of the sky drawn: every acoustic peak, the
damping tail, EE out of phase with TT, and TE changing sign between them.

Checked by `docs/verify-the-cmb-sky.cjs`.
