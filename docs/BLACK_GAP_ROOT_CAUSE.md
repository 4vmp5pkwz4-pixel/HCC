# Solar → Observable black-gap regression

Root cause: `SCALE_SEAMS.solarObsOutGly` is expressed in gigalightyears, but v4.235 stored `26`, i.e. 26 Gly = 26,000 Mly. The reverse seam is `0.020` Gly = 20 Mly. That created an unintended factor-1300 scale corridor after Solar/local cosmic geometry had become visually negligible but before Observable mode was allowed to take ownership.

The intended outward seam is 26 Mly = `0.026` Gly. Together with the 20 Mly reverse seam this yields a narrow hysteresis band (20–26 Mly), avoiding oscillation while keeping scene ownership continuous.

Regression contract lives in `docs/verify-scale-continuity.cjs` and rejects any Solar/Observable seam outside 0.001–0.1 Gly or with an outward/inward ratio >= 2.
