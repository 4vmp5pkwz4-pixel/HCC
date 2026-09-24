# The Earth, and the sky from where you stand: sources and method

## The Earth's surface (`HCC_EARTH`)

The Earth is drawn with the NASA public-domain global mosaics that ship in the
**three-globe 2.45.2** package (MIT), under `example/`. The atlas loads them from the pinned
URL `https://cdn.jsdelivr.net/npm/three-globe@2.45.2/example/`. Nothing loads until the Earth
is more than about ten pixels across on screen, or until someone stands on it. The plain
sphere stays as the fallback, and it is still used if the network is off.

| map | file | size | SHA-256 |
|---|---|---|---|
| day: Blue Marble with bathymetry | `img/earth-blue-marble.jpg` | 4096×2048 | `228deba2e4b600146bdcb6cfa359b8ead6aacc2b1c13550a29cd82824cfa1c01` |
| night: city lights | `img/earth-night.jpg` | 4096×2048 | `355ab23dd1323315b393d7b91dd2d7ee223a1cbaaba2b48dc72ba90d371ced24` |
| ocean mask (for the glint) | `img/earth-water.png` | 1600×800 | `3a8132db56aac4e64e7fcbf2928ee970c075ac6a96b38798d0bb8be82836a4d3` |
| relief | `img/earth-topology.png` | 2048×1024 | `839b12da2e4dd346b256cebae72e10c479a102c8980a22084c41275e4b9a0e12` |
| clouds: one global snapshot, in alpha | `clouds/clouds.png` | 4096×2048 | `35c46d8b29651a99e482401f33ed752bf4625837435fb3a89bb0032f72b88a3a` |

One shader draws the surface:

- **Day side**: the Blue Marble, lit by the Sun from where the Sun is.
- **Terminator**: a narrow reddening, for the long path of the light through air.
- **Night side**: city lights only.
- **Oceans**: a sun glint and a Fresnel sheen, from the ocean mask.
- **Land**: relief from the slope of the height map.
- **Clouds**: they shade the ground beneath them, and cast shadows offset along the sunbeam.

The clouds are a single snapshot, not the weather of the moment. Phones in safe mode skip
the 5 MB cloud map.

**Orientation.** The mesh turns by the IAU angle W = 190.147° + 360.9856235°·d about the
precessing pole. In this frame, W puts the prime meridian on local −Z, with east towards
−X. A plain equirectangular map puts Greenwich on +X, which would be 90° wrong, so the
texture coordinate is shifted by u − 0.25.

`docs/verify-the-earth-stands-true.cjs` checks this over 2 015 vertices of a three.js
sphere. At every vertex, the longitude the map shows is the longitude the atlas reads there,
to 10⁻¹³°. In the running atlas, the sub-solar point comes out where the Sun's right
ascension and the sidereal time put it: at 2026-11-17 09:15 UTC it is −19.26° / 37.56° E,
against −19.26° / 37.39° E computed independently.

## Standing on the Earth (`HCC_SKY_HERE`)

- **Place.**
  - The latitude and longitude come from the device (GNSS), or are typed in.
  - The place is fixed in the Earth's own frame, so it turns with the Earth.
  - The eye stands at the geocentric latitude, 1.5 m above the ground.
  - The globe's own facets are not drawn under your feet. At 1 AU from the origin a float32
    position has steps of 17.8 km, and the ground near the eye broke into spikes along the
    horizon. The ground is drawn by the sky dome instead, below the horizon lowered by the
    dip for the eye's height (0.40° at 150 m). The dome and the Earth are placed through
    `modelViewMatrix`, which three.js forms in float64 on the CPU.
- **Up.** "Up" is the geodetic vertical of WGS84 (f = 1/298.257223563). At 45° it leans
  0.192° from the radius.
- **North.** North is the Earth's precessed pole projected onto the horizon.
- **Horizon.** The true horizon and the four cardinal points are drawn around the eye.
- **Phone orientation.** The phone's attitude is the W3C device orientation:
  - (alpha, beta, gamma) is converted to Euler YXZ, rotated −90° about x, and the
    screen's own rotation is taken out;
  - the result is expressed in the east–up–north frame of the place;
  - it is smoothed over 70 ms, whatever the frame rate.
- **Compass sources.**
  - Android's absolute orientation is used directly.
  - iOS gives a relative alpha and a separate compass heading. The offset between them is
    tracked on the circle.
  - Without a compass, the readout says so: north is then only where the phone pointed when
    it started.
  - A sideways drag trims the heading by hand.
- **True north.** A compass reads magnetic north. The heading is turned to true north by the
  magnetic declination at the place: its size and sign come from the model below, and its
  direction east-positive. The readout shows the declination.
- **Time.** While the phone is pointing, the clock runs in real time, so the sky is the sky
  of that second.
- **Refraction.** Refraction is **not** applied to the drawn sky. Its size (Sæmundsson) at
  the centre of the view is shown instead: about 35′ at the horizon, and under 1′ above 45°.

## Day, twilight and night

When you stand on the Earth, the sky is lit by the Sun wherever the Sun is.

**Limiting magnitude.** The Sun's altitude sets the naked-eye limiting magnitude, from the
standard twilight sequence:

| Sun's altitude | stage | limiting magnitude |
|---|---|---|
| above +10° | daylight | −3.5 (only Venus, the Moon and the Sun) |
| 0° | sunset | −2 |
| −6° | end of civil twilight | 2 |
| −12° | end of nautical twilight | 5 |
| −18° | end of astronomical twilight | 6.5 |

Every star layer is dimmed by 6.5 minus this limit, through one uniform in the shared star
shader.

**The dome.** A dome drawn about the eye does three things:
- above the horizon, it covers what the sky outshines, and leaves the Sun and the Moon open;
- below the horizon, it is the ground;
- during twilight, the horizon on the Sun's side turns orange.

**Clock.** Landing drops the clock to real time, one second per second, so the sky turns at
15° an hour. Leaving restores the rate you flew with, unless you changed it while standing.

The readout gives:
- the Sun's altitude;
- the twilight stage;
- the limiting magnitude.

## The World Magnetic Model 2025 (`hccWMM`)

The model is the WMM2025 main field and secular variation to degree and order 12
(NOAA/NCEI and the British Geological Survey), valid 2025.0–2030.0. The coefficients and the
spherical-harmonic synthesis are ported from **magvar 2.2.0** (MIT, `src/WMMCOF2025.js`,
`src/magvar.js`).

The port reproduces the first official WMM2025 test value: at 80° N, 0° E, sea level, 2025.0
it gives X = 6521.6, Y = 145.9 and Z = 54791.5 nT, the same as NOAA to 0.1 nT. It gives
these declinations at 2026.7:

- London: +1.24°
- Moscow: +12.14°
- San Francisco: +12.84°

NOAA's test-value file could not be fetched from the build environment (the proxy refused
`www.ncei.noaa.gov`). The reference value above is the one the magvar package reproduces
from that file.
