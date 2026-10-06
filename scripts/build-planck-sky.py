#!/usr/bin/env python3
"""THE MEASURED CMB SKY — Planck 2018 SMICA (PR3), embedded in index.html beside the atlas's own realization.

Source: COM_CMB_IQU-smica_2048_R3.00_full.fits, Planck Legacy Archive via IRSA
(https://irsa.ipac.caltech.edu/data/Planck/release_3/all-sky-maps/maps/component-maps/cmb/), SHA-256 recorded.
The map is in K_CMB, Galactic HEALPix (Nside 2048, NESTED as distributed), 5' beam, monopole and dipole removed;
the file carries both the measured Stokes maps with their confidence mask (TMASK) and an inpainted copy
(I_STOKES_INP...) in which the masked Galactic plane is filled; the picture uses the inpainted copy, every statistic the
measured map outside the mask.

What is done, and nothing more:
  1. the temperature is projected to the SAME 2048 x 1024 equirectangular layout the atlas's realization uses
     (rows = Galactic colatitude from the north pole, columns = Galactic longitude from l = 0), 8-bit over
     -400 ... +400 muK, so the existing shader reads it unchanged; Q, U smoothed to 1 deg go to the same RGB
     (cos 2psi, sin 2psi, P) image layout;
  2. MEASURED ON THE MAP: the angular power spectrum outside the confidence mask (pseudo-C_l / f_sky, beam and
     pixel window divided out) against the atlas's own CAMB spectrum — band ratio over 30 <= l <= 1500;
  3. the COLD SPOT, found in the data: the minimum of the map smoothed with a 5 deg Gaussian, |b| > 20 deg,
     outside the mask;
  4. the low-l ALIGNMENT: for l = 2 and l = 3 the axis n that maximises the angular-momentum dispersion
     sum_m m^2 |a_lm(n)|^2 (de Oliveira-Costa et al. 2004), searched over all directions of an Nside-32 grid,
     and the angle between the two axes.

Needs: healpy, numpy, Pillow.  Run:  python3 scripts/build-planck-sky.py <smica.fits> [index.html]
"""
import base64, io, json, re, sys, os, hashlib
import numpy as np, healpy as hp
from PIL import Image

SRC = sys.argv[1]
INDEX = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'index.html')
h = hashlib.sha256()
with open(SRC, 'rb') as f:
    for chunk in iter(lambda: f.read(1 << 22), b''): h.update(chunk)
SHA = h.hexdigest()

from astropy.io import fits
with fits.open(SRC) as hd:                                             # the build refuses a truncated or damaged file
    hd.verify('exception'); hdr = hd[1].header
    assert hdr['ORDERING'] == 'NESTED' and hdr['NSIDE'] == 2048 and hdr['COORDSYS'] == 'GALACTIC' and hdr['TUNIT1'].strip() == 'K_CMB', 'unexpected header'
    assert os.path.getsize(SRC) >= hd[1]._data_offset + hd[1]._data_size, 'file shorter than its header declares'
# the measured fields (statistics, outside the confidence mask) and the inpainted ones (the full-sky picture)
T, Q, U, TMASK, Ti, Qi, Ui = hp.read_map(SRC, field=[0, 1, 2, 3, 5, 6, 7], nest=False)   # read_map reorders NESTED -> RING
NSIDE = hp.get_nside(T)
for a_ in (T, Q, U, Ti, Qi, Ui): a_ *= 1e6                             # K_CMB -> muK
mask = TMASK > 0.5; fsky = float(mask.mean())
assert NSIDE == 2048 and np.isfinite(T).all(), 'unexpected map'

# ── 1 · images in the atlas's layout ────────────────────────────────────────────
W, H, RANGE = 2048, 1024, 400.0
th = (np.arange(H) + 0.5) / H * np.pi; ph = (np.arange(W) + 0.5) / W * 2 * np.pi
TH, PH = np.meshgrid(th, ph, indexing='ij')
Tm = hp.get_interp_val(Ti, TH.ravel(), PH.ravel()).reshape(H, W)   # the inpainted map: the Galactic plane filled, the mask image says where
img = np.clip(np.round((Tm + RANGE) / (2 * RANGE) * 255), 0, 255).astype(np.uint8)
buf = io.BytesIO(); Image.fromarray(img, 'L').save(buf, format='JPEG', quality=86, optimize=True); t_b64 = base64.b64encode(buf.getvalue()).decode()
Ts, Qs, Us = hp.smoothing([Ti, Qi, Ui], fwhm=np.radians(1.0), lmax=600, pol=True)
w2, h2 = 512, 256
TH2, PH2 = np.meshgrid((np.arange(h2) + 0.5) / h2 * np.pi, (np.arange(w2) + 0.5) / w2 * 2 * np.pi, indexing='ij')
q = hp.get_interp_val(Qs, TH2.ravel(), PH2.ravel()).reshape(h2, w2); u = hp.get_interp_val(Us, TH2.ravel(), PH2.ravel()).reshape(h2, w2)
P = np.hypot(q, u); Pmax = float(np.percentile(P, 99.5)); c2, s2 = q / np.maximum(P, 1e-12), u / np.maximum(P, 1e-12)
rgb = np.stack([np.round((c2 + 1) * 127.5), np.round((s2 + 1) * 127.5), np.round(np.clip(P / Pmax, 0, 1) * 255)], -1).astype(np.uint8)
buf2 = io.BytesIO(); Image.fromarray(rgb, 'RGB').save(buf2, format='JPEG', quality=92, optimize=True); p_b64 = base64.b64encode(buf2.getvalue()).decode()
mimg = np.round(hp.get_interp_val(TMASK.astype(float), TH2.ravel(), PH2.ravel()).reshape(h2, w2) * 255).astype(np.uint8)
buf3 = io.BytesIO(); Image.fromarray(mimg, 'L').save(buf3, format='PNG', optimize=True); m_b64 = base64.b64encode(buf3.getvalue()).decode()

# ── 2 · the spectrum, measured, against the atlas's CAMB ────────────────────────
LMAX = 1500
cl = hp.anafast(np.where(mask, T, 0.0), lmax=LMAX) / fsky
bl = hp.gauss_beam(np.radians(5 / 60), lmax=LMAX) * hp.pixwin(NSIDE, lmax=LMAX)
cl = cl / np.maximum(bl ** 2, 1e-30); ell = np.arange(LMAX + 1); Dl = ell * (ell + 1) * cl / (2 * np.pi)
src = open(INDEX, encoding='utf-8').read()
camb = json.loads(re.search(r'const CMB_CAMB=Object\.freeze\((\{.*?\})\);', src).group(1))
Dt = np.array(camb['spec']['TT'][:LMAX + 1]); band = slice(30, LMAX + 1)
ratio = float(np.sum((2 * ell[band] + 1) * Dl[band]) / np.sum((2 * ell[band] + 1) * Dt[band]))
bins = [(2, 29), (30, 99), (100, 299), (300, 699), (700, 1099), (1100, 1500)]
binned = [{'l': [a, b], 'measured': round(float(np.mean(Dl[a:b + 1])), 1), 'camb': round(float(np.mean(Dt[a:b + 1])), 1)} for a, b in bins]
Dl_out = [round(float(x), 2) for x in Dl[:LMAX + 1]]

# ── 3 · the Cold Spot, found ────────────────────────────────────────────────────
n64 = 256
Tsm = hp.ud_grade(hp.smoothing(np.where(mask, T, 0.0), fwhm=np.radians(5.0)), n64)
Msm = hp.ud_grade(hp.smoothing(mask.astype(float), fwhm=np.radians(5.0)), n64)
Tn = Tsm / np.maximum(Msm, 1e-6); thg, phg = hp.pix2ang(n64, np.arange(hp.nside2npix(n64))); bg = 90 - np.degrees(thg)
ok = (Msm > 0.9) & (np.abs(bg) > 20); i = np.argmin(np.where(ok, Tn, np.inf))
cold = {'l': round(float(np.degrees(phg[i])), 2), 'b': round(float(bg[i]), 2), 'muK': round(float(Tn[i]), 1), 'smoothDeg': 5.0}

# ── 4 · the quadrupole and octopole axes ────────────────────────────────────────
alm = hp.map2alm(Ti, lmax=3)                                            # the low multipoles need the full sky: the inpainted map, as Planck does
def axis(l):
    nd = 32; best = (-1, None)
    for p in range(hp.nside2npix(nd)):
        t, f = hp.pix2ang(nd, p)
        if t > np.pi / 2: continue                       # an axis, not a direction: one hemisphere suffices
        a = alm.copy(); hp.rotate_alm(a, -f, -t, 0.0)     # bring n to the pole
        s = sum(m * m * abs(a[hp.Alm.getidx(3, l, m)]) ** 2 for m in range(1, l + 1))
        if s > best[0]: best = (s, (t, f))
    t, f = best[1]; return {'l': round(float(np.degrees(f)) % 360, 1), 'b': round(90 - float(np.degrees(t)), 1)}
a2, a3 = axis(2), axis(3)
v = lambda A: hp.ang2vec(np.radians(90 - A['b']), np.radians(A['l']))
sep = float(np.degrees(np.arccos(abs(np.clip(np.dot(v(a2), v(a3)), -1, 1)))))
C2 = float(np.sum(np.abs(alm[[hp.Alm.getidx(3, 2, m) for m in range(3)]]) ** 2 * np.array([1, 2, 2])) / 5)

meta = {'generated': 'scripts/build-planck-sky.py', 'source': 'Planck 2018 PR3 SMICA, COM_CMB_IQU-smica_2048_R3.00_full.fits (Planck Legacy Archive via IRSA)',
        'sha256': SHA, 'nside': NSIDE, 'frame': 'Galactic', 'unit': 'muK_CMB', 'beamArcmin': 5, 'fsky': round(fsky, 4), 'rangeMuK': RANGE,
        'width': W, 'height': H, 'polSmoothDeg': 1.0, 'polMaxMuK': round(Pmax, 3), 'sigmaT': round(float(np.std(T[mask])), 2),
        'bandRatio30to1500': round(ratio, 4), 'binned': binned, 'coldSpot': cold, 'axisL2': a2, 'axisL3': a3, 'axisSeparationDeg': round(sep, 1),
        'D2muK2': round(2 * 3 * C2 / (2 * np.pi), 1),
        'jpegSha256': hashlib.sha256(base64.b64decode(t_b64)).hexdigest(), 'polJpegSha256': hashlib.sha256(base64.b64decode(p_b64)).hexdigest()}
tag = '<script type="application/json" id="hcc-planck-sky">' + json.dumps({'t': t_b64, 'p': p_b64, 'm': m_b64, 'dl': Dl_out}, separators=(',', ':')) + '</script>'
line = 'const PLANCK_SKY_META=Object.freeze(' + json.dumps(meta, separators=(',', ':')) + ');'
def put(src, begin, end, body, anchor):
    pat = re.compile(re.escape(begin) + r'.*?' + re.escape(end), re.S); new = begin + '\n' + body + '\n' + end
    if pat.search(src): return pat.sub(lambda m: new, src, count=1)
    assert src.count(anchor) == 1, anchor; return src.replace(anchor, new + '\n' + anchor)
src = put(src, '<!-- PLANCK_SKY:BEGIN -->', '<!-- PLANCK_SKY:END -->', tag, '<!-- CMB_SKY:BEGIN -->')
src = put(src, '/* PLANCK_SKY_META:BEGIN */', '/* PLANCK_SKY_META:END */', line, '/* CMB_CAMB:BEGIN */')
open(INDEX, 'w', encoding='utf-8').write(src)
print(json.dumps(meta, indent=1)); print('embedded', len(tag) // 1024, 'KB')
