# HCC 4.153.0 — Multiphase Solar Control

Cycles becomes a precision control plane for the same Solar System state, not a second clock.

- Adds a deterministic multi-constraint phase solver with circular residuals, weighted RMS, previous/nearest/next search, strict model-validity windows and no false exact coincidences.
- The selected Cycles pair becomes the primary A/B phase axes; any additional finite cycle can be captured into the same solve.
- Adds an optional geocentric planetary-longitude constraint driven by the existing Solar `planetEcl` ephemeris for Sun, Mercury, Venus, Mars, Jupiter, Saturn, Uranus and Neptune.
- The planetary overlay explicitly refuses precision outside its declared 1800–2050 range with `MODEL_LIMITED`; mean-cycle searches may still use deep-time windows up to 1 Gyr.
- Live Solar Link commits a chosen candidate only through the authoritative AtlasTime epoch gateway. Preview mode does not move global time; APPLY RESULT is explicit.
- The Cycles panel reports candidate epoch, RMS, worst circular residual and per-constraint residuals, plus the current Solar geocentric configuration.
- `OPEN SOLAR · SAME STATE` changes only the view, so Solar, Antikythera, Saros, phase space and all other absolute-epoch instruments see the exact same Atlas state.

No second Solar state, render loop or physical clock is introduced.
