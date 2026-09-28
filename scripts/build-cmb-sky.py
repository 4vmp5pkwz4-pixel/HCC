#!/usr/bin/env python3
"""THE CMB SKY OF THIS ATLAS'S OWN COSMOLOGY — built offline, embedded in index.html.

What it does, and nothing more:
  1. runs CAMB (the Boltzmann code) for the atlas's cosmology — H0 = 68.43, Omega_m = 0.305,
     omega_b = 0.02237 (HCC_S3R), n_s = 0.9649, tau = 0.0544, one massive neutrino of 0.06 eV,
     A_s tuned until sigma_8 = 0.8111 (Planck 2018 VI) — and keeps the lensed TT, EE, TE, BB and the
     lensing potential to l = 2000, with the derived acoustic scale, z*, r*, r_drag and age;
  2. draws ONE full-sky realization of correlated T, Q, U with those spectra (healpy.synfast,
     Nside 1024, 5' beam — the Planck resolution), and measures it back (anafast) so the page can
     show that the map it paints has the spectrum it claims;
  3. writes the temperature as a 2048 x 1024 equirectangular 8-bit JPEG (-400 ... +400 muK),
     and the polarization, smoothed to 1 deg, as a 512 x 256 RGB JPEG of (cos 2psi, sin 2psi, P) —
     the page draws the Planck-style "drapery" from it by line-integral convolution on the GPU;
  4. embeds both, the spectra and the official Planck "parchment" colour table (Planck
     collaboration, via zonca/paperplots) between markers in index.html.

It is a REALIZATION with the exact spectrum, not the measured Planck sky: the measured maps are
not reachable from the build environment, and the page says so.

Needs: camb, healpy, numpy, Pillow.  Run:  python3 scripts/build-cmb-sky.py
"""
import base64, io, json, re, sys, os, hashlib, urllib.request
import numpy as np
import camb, healpy as hp
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, 'index.html')
LMAX = 2000
SEED = 20260928
PARCHMENT_URL = 'https://raw.githubusercontent.com/zonca/paperplots/master/data/Planck_Parchment_RGB.txt'

# ── 1 · CAMB for the atlas's cosmology ──────────────────────────────────────────
h = 0.6843; wm = 0.305 * h * h; wb = 0.02237; mnu = 0.06; wnu = mnu / 93.14; wc = wm - wb - wnu
def run(As):
    p = camb.set_params(H0=68.43, ombh2=wb, omch2=wc, mnu=mnu, omk=0, tau=0.0544, As=As, ns=0.9649,
                        lmax=LMAX + 500, lens_potential_accuracy=1, WantTransfer=True, kmax=10)
    p.set_matter_power(redshifts=[0.], kmax=10)
    return p, camb.get_results(p)
As = 2.1e-9
for _ in range(4):
    p, r = run(As); As *= (0.8111 / r.get_sigma8_0()) ** 2
p, r = run(As)
d = r.get_derived_params()
cl = r.get_cmb_power_spectra(p, CMB_unit='muK', raw_cl=False)
tot = cl['total'][:LMAX + 1]; pp = cl['lens_potential'][:LMAX + 1]
Dtt, Dee, Dbb, Dte = tot[:, 0], tot[:, 1], tot[:, 2], tot[:, 3]
Dpp = pp[:, 0]  # [l(l+1)]^2 C_l^phiphi / 2pi
ell = np.arange(LMAX + 1)

# ── 2 · one correlated realization, and its measured spectrum ──────────────────
def dl2cl(D):
    c = np.zeros_like(D); c[2:] = 2 * np.pi * D[2:] / (ell[2:] * (ell[2:] + 1)); return c
cls = [dl2cl(Dtt), dl2cl(Dee), dl2cl(Dbb), dl2cl(Dte)]
NSIDE = 1024; FWHM = np.radians(5 / 60)
np.random.seed(SEED)
T, Q, U = hp.synfast(cls, NSIDE, lmax=LMAX, new=True, pol=True, fwhm=FWHM)
bl = hp.gauss_beam(FWHM, lmax=LMAX)
meas = hp.anafast([T, Q, U], lmax=LMAX, pol=True)   # TT EE BB TE EB TB
Ctt_meas = meas[0] / np.maximum(bl ** 2, 1e-30)
sigmaT_theory = float(np.sqrt(np.sum((2 * ell[2:] + 1) * cls[0][2:] * bl[2:] ** 2) / (4 * np.pi)))
sigmaT_map = float(np.std(T))
# band-averaged ratio of measured to theory, 30 <= l <= 1500 (cosmic variance small there)
band = slice(30, 1501)
ratio = float(np.sum((2 * ell[band] + 1) * Ctt_meas[band]) / np.sum((2 * ell[band] + 1) * cls[0][band]))

# ── 3 · images ──────────────────────────────────────────────────────────────────
W, H = 2048, 1024
th = (np.arange(H) + 0.5) / H * np.pi
ph = (np.arange(W) + 0.5) / W * 2 * np.pi
TH, PH = np.meshgrid(th, ph, indexing='ij')
Tm = hp.get_interp_val(T, TH.ravel(), PH.ravel()).reshape(H, W)
RANGE = 400.0
img = np.clip(np.round((Tm + RANGE) / (2 * RANGE) * 255), 0, 255).astype(np.uint8)
buf = io.BytesIO(); Image.fromarray(img, 'L').save(buf, format='JPEG', quality=84, optimize=True)
t_b64 = base64.b64encode(buf.getvalue()).decode()

Qs, Us = hp.smoothing([T, Q, U], fwhm=np.radians(1.0), lmax=600, pol=True)[1:]
w2, h2 = 512, 256
th2 = (np.arange(h2) + 0.5) / h2 * np.pi; ph2 = (np.arange(w2) + 0.5) / w2 * 2 * np.pi
TH2, PH2 = np.meshgrid(th2, ph2, indexing='ij')
q = hp.get_interp_val(Qs, TH2.ravel(), PH2.ravel()).reshape(h2, w2)
u = hp.get_interp_val(Us, TH2.ravel(), PH2.ravel()).reshape(h2, w2)
P = np.hypot(q, u); Pmax = float(np.percentile(P, 99.5))
c2, s2 = q / np.maximum(P, 1e-12), u / np.maximum(P, 1e-12)
rgb = np.stack([np.round((c2 + 1) * 127.5), np.round((s2 + 1) * 127.5), np.round(np.clip(P / Pmax, 0, 1) * 255)], -1).astype(np.uint8)
buf2 = io.BytesIO(); Image.fromarray(rgb, 'RGB').save(buf2, format='JPEG', quality=92, optimize=True)
p_b64 = base64.b64encode(buf2.getvalue()).decode()

# ── 4 · the Planck colour table ─────────────────────────────────────────────────
txt = urllib.request.urlopen(PARCHMENT_URL, timeout=30).read().decode()
cmap = [[int(v) for v in line.split()] for line in txt.strip().splitlines()]
assert len(cmap) == 256

# ── embed ───────────────────────────────────────────────────────────────────────
r4 = lambda a: [float('%.4g' % x) for x in a]
derived = {k: float('%.7g' % d[k]) for k in ['thetastar', 'zstar', 'rstar', 'zdrag', 'rdrag', 'age', 'DAstar', 'kd']}
peaks = [int(l) for l in range(30, LMAX - 1) if Dtt[l] > Dtt[l - 1] and Dtt[l] > Dtt[l + 1]]
meta = {'generated': 'scripts/build-cmb-sky.py', 'camb': camb.__version__, 'healpy': hp.__version__,
        'params': {'H0': 68.43, 'ombh2': wb, 'omch2': float('%.8g' % wc), 'mnu': mnu, 'tau': 0.0544, 'ns': 0.9649,
                   'As': float('%.6g' % As), 'sigma8': float('%.6g' % r.get_sigma8_0())},
        'derived': derived, 'peaksTT': peaks,
        'sky': {'seed': SEED, 'nside': NSIDE, 'fwhmArcmin': 5, 'lmax': LMAX, 'rangeMuK': RANGE, 'width': W, 'height': H,
                'sigmaTTheory': round(sigmaT_theory, 3), 'sigmaTMap': round(sigmaT_map, 3), 'bandRatio30to1500': round(ratio, 5),
                'polSmoothDeg': 1.0, 'polMaxMuK': round(Pmax, 3),
                'jpegSha256': hashlib.sha256(base64.b64decode(t_b64)).hexdigest(), 'polJpegSha256': hashlib.sha256(base64.b64decode(p_b64)).hexdigest()},
        'colormap': 'Planck Parchment RGB (Planck collaboration; zonca/paperplots/data/Planck_Parchment_RGB.txt)'}
spec = {'lmax': LMAX, 'TT': r4(Dtt), 'EE': r4(Dee), 'TE': r4(Dte), 'BB': r4(Dbb), 'PP': r4(Dpp * 1e7)}
line_js = 'const CMB_CAMB=Object.freeze(' + json.dumps({'meta': meta, 'spec': spec}, separators=(',', ':')) + ');'
line_cm = 'const CMB_PLANCK_CMAP=Object.freeze(' + json.dumps(cmap, separators=(',', ':')) + ');'
tag = '<script type="application/json" id="hcc-cmb-sky">' + json.dumps({'t': t_b64, 'p': p_b64}, separators=(',', ':')) + '</script>'

src = open(INDEX, encoding='utf-8').read()
def put(src, begin, end, body):
    pat = re.compile(re.escape(begin) + r'.*?' + re.escape(end), re.S)
    new = begin + '\n' + body + '\n' + end
    if pat.search(src): return pat.sub(lambda m: new, src, count=1)
    raise SystemExit('marker not found: ' + begin)
src = put(src, '/* CMB_CAMB:BEGIN */', '/* CMB_CAMB:END */', line_js + '\n' + line_cm)
src = put(src, '<!-- CMB_SKY:BEGIN -->', '<!-- CMB_SKY:END -->', tag)
open(INDEX, 'w', encoding='utf-8').write(src)
print(json.dumps(meta['sky']), json.dumps(derived), peaks[:7])
print('embedded', len(t_b64) // 1024, 'KB temperature,', len(p_b64) // 1024, 'KB polarization,', len(line_js) // 1024, 'KB spectra')
