#!/usr/bin/env python3
"""THE REAL LOCAL WEB — the structure of the nearby universe from measured redshifts, embedded in index.html.

Source: the same catalogue as the atlas's deep sky (scripts/build-dso-3d.py): the Stellarium 23.4 deep-sky
catalogue (Ubuntu noble package stellarium-data 23.4-2build3, nebulae/default/catalog.dat), compiled from
NGC/IC/PGC/UGC and others with redshifts from NED/HyperLEDA. Every galaxy with a measured redshift
0.0015 < z < 0.08 is kept (17 300).

The catalogue is a COMPILATION: magnitude limited to different depths over the sky (the north is 3-4x denser
and a quarter deeper than the south). A selection function fitted to such a sample is fragile, so the contrast
is taken the robust way, against the catalogue's own large-scale average — a BAND-PASS:
      delta(x) = n_8(x) / n_40(x)
with n_s the galaxy counts Gaussian-smoothed at s Mpc (8/h Mpc as in Einasto et al. 2007; 40 Mpc for the
background), each divided by the equally smoothed mask. Whatever the selection does on scales above 40 Mpc
divides out; what is lost, by construction, is contrast on scales above ~40 Mpc — the largest superclusters
are seen as their dense cores. Every step is checked by docs/verify-the-real-local-web.cjs:
  1. comoving distance from z in the atlas's flat LCDM (H0 = 68.43, Om = 0.305) — REDSHIFT SPACE, so the rich
     clusters keep their "fingers of god"; J2000 equatorial Cartesian coordinates;
  2. the mask: |b| >= 10 deg, and the SHOT-NOISE criterion — a cell is kept only where the 8/h kernel is
     expected (from n_40) to hold at least 8 galaxies — which sets the reach in each direction;
  3. superclusters: connected regions with delta > 3 holding at least 20 galaxies and 1500 Mpc^3, centroid
     inside the reach; voids: MAXIMAL EMPTY SPHERES — local maxima of the distance to the nearest cell with
     delta >= 0.6, at least 9 Mpc in radius, at least 80% inside the mask, AND — independently of the grid —
     holding in the raw galaxies fewer than half of what the same radial shell in the same direction predicts;
     taken largest first without overlapping (in the spirit of Hoyle & Vogeley's VoidFinder); each named when its centroid falls within the
     published extent of a known structure;
  4. the contrast at the catalogued centres of eight rich clusters is recorded (all must be overdense);
  5. the contrast is written as a 64^3 uint8 volume of log10(1 + delta), and the galaxies as int16 triples
     (0.01 Mpc) with their contrast.

Usage: python3 scripts/build-local-web.py <catalog.dat> [index.html]      (needs numpy, scipy)
"""
import gzip, struct, sys, json, math, hashlib, base64, os
import numpy as np
from scipy import ndimage

src = sys.argv[1]
INDEX = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', 'index.html')
raw = open(src, 'rb').read(); SHA = hashlib.sha256(raw).hexdigest()
b = gzip.decompress(raw) if raw[:2] == b'\x1f\x8b' else raw
o = 0
def qs():
    global o
    n = struct.unpack('>I', b[o:o + 4])[0]; o += 4
    if n == 0xFFFFFFFF: return None
    s = b[o:o + n].decode('utf-16-be'); o += n; return s
def u32():
    global o; v = struct.unpack('>I', b[o:o + 4])[0]; o += 4; return v
def d():
    global o; v = struct.unpack('>d', b[o:o + 8])[0]; o += 8; return v
ver = qs(); qs(); assert ver == '3.20', ver
LAYOUT = 'uuuuuuuuuuuuuusuusssssssuuuuu'
NAMES = ['NGC','IC','M','C','B','Sh2','VdB','RCW','LDN','LBN','Cr','Mel','PGC','UGC','Ced','Arp','VV','PK','PNG','SNRG','ACO','HCG','ESO','VdBH','DWB','Tr','St','Ru','VdBHa']
recs = []
while o < len(b):
    r = {'nb':u32(),'ra':d(),'dec':d(),'b':d(),'v':d(),'ot':u32(),'mt':qs(),'maj':d(),'min':d(),'pa':u32(),'z':d(),'ze':d(),'plx':d(),'plxe':d(),'dist':d(),'diste':d()}
    for t, nm in zip(LAYOUT, NAMES): r[nm] = u32() if t == 'u' else qs()
    recs.append(r)
assert o == len(b)
G = [r for r in recs if 0.0015 < r['z'] < 0.08 and r['ot'] in (0,1,2,3,4,5,6,7)]
ra = np.array([r['ra'] for r in G]); de = np.array([r['dec'] for r in G]); z = np.array([r['z'] for r in G])

# ── 1 · distances, coordinates ──────────────────────────────────────────────────
H0, Om, C = 68.43, 0.305, 299792.458
zz = np.linspace(0, 0.1, 4001); Ez = np.sqrt(Om * (1 + zz) ** 3 + 1 - Om)
Dc = np.concatenate([[0], np.cumsum((1 / Ez[1:] + 1 / Ez[:-1]) / 2 * np.diff(zz))]) * C / H0
D = np.interp(z, zz, Dc)
P = np.stack([D * np.cos(de) * np.cos(ra), D * np.cos(de) * np.sin(ra), D * np.sin(de)], 1)
RG = np.array([[-0.0548755604,-0.8734370902,-0.4838350155],[0.4941094279,-0.4448296300,0.7469822445],[-0.8676661490,-0.1980763734,0.4559837762]])
U = P / np.maximum(D, 1e-9)[:, None]; gb = np.degrees(np.arcsin(np.clip(U @ RG[2], -1, 1)))

# ── 2 · the band-pass contrast and its mask ─────────────────────────────────────
SIG = 8.0 / (H0 / 100); BIG = 40.0; CELL = 3.0; ZOA = 10.0; NMIN = 8.0; RMAX = 180.0
N = int(2 * RMAX / CELL); grid = np.zeros((N, N, N)); sel = (D > 3) & (D < RMAX)
ix = np.clip(((P[sel] + RMAX) / CELL).astype(int), 0, N - 1)
np.add.at(grid, (ix[:, 0], ix[:, 1], ix[:, 2]), 1.0)
g1 = np.arange(N) * CELL - RMAX + CELL / 2; X3, Y3, Z3 = np.meshgrid(g1, g1, g1, indexing='ij'); R = np.sqrt(X3 ** 2 + Y3 ** 2 + Z3 ** 2)
V = np.stack([X3, Y3, Z3], -1) / np.maximum(R, 1e-9)[..., None]; GB = np.degrees(np.arcsin(np.clip(V @ RG[2], -1, 1)))
mask = ((R < RMAX) & (R > 3) & (np.abs(GB) >= ZOA)).astype(float)
sm = lambda a_, s_: ndimage.gaussian_filter(a_, s_ / CELL, mode='constant')
ms, mb = sm(mask, SIG), sm(mask, BIG)
n8 = sm(grid, SIG) / np.maximum(ms, 1e-9); n40 = sm(grid, BIG) / np.maximum(mb, 1e-9)
KCELLS = (2 * np.pi) ** 1.5 * SIG ** 3 / CELL ** 3
valid = (mask > 0) & (ms > 0.5) & (mb > 0.3) & (n40 * KCELLS >= NMIN)
dens = np.where(valid, n8 / np.maximum(n40, 1e-12), 0.0)
reach = float(R[valid].max())

# ── 4 · superclusters and voids ─────────────────────────────────────────────────
KNOWN = [  # name, RA, Dec, D (Mpc), published extent radius (Mpc) — for NAMING only
    ('Perseus–Pisces Supercluster', 40.0, 38.0, 73.0, 40.0), ('Coma Supercluster', 190.0, 25.0, 100.0, 35.0),
    ('CfA2 Great Wall', 205.0, 29.0, 118.0, 45.0), ('Hercules Supercluster', 241.0, 17.0, 150.0, 35.0),
    ('Leo Supercluster', 165.0, 25.0, 140.0, 30.0), ('Virgo (Local) Supercluster', 186.6, 12.7, 17.0, 20.0),
    ('Hydra–Centaurus Supercluster', 180.0, -35.0, 45.0, 30.0), ('Pavo–Indus Supercluster', 315.0, -60.0, 70.0, 25.0),
    ('Pisces–Cetus Supercluster', 15.0, -10.0, 230.0, 60.0), ('Local Void', 285.0, 15.0, 25.0, 30.0), ('Sculptor Void', 5.0, -30.0, 45.0, 30.0)]
def radec(p):
    r = float(np.linalg.norm(p)); v = p / max(r, 1e-9)
    return math.degrees(math.atan2(v[1], v[0])) % 360, math.degrees(math.asin(v[2])), r
def xyz(a, dd, r):
    a, dd = math.radians(a), math.radians(dd); return np.array([r * math.cos(dd) * math.cos(a), r * math.cos(dd) * math.sin(a), r * math.sin(dd)])
def name_of(c, kinds):
    best = None
    for nm, a, dd, r, ext in KNOWN:
        if ('Void' in nm) != (kinds == 'void'): continue
        dist = float(np.linalg.norm(c - xyz(a, dd, r)))
        if dist <= ext and (best is None or dist < best[1]): best = (nm, dist)
    return best[0] if best else None
def regions(sel_mask, kind, minvol):
    lab, nl = ndimage.label(sel_mask); out = []
    for L in range(1, nl + 1):
        cells = np.argwhere(lab == L); vol = len(cells) * CELL ** 3
        if vol < minvol: continue
        pts = cells * CELL - RMAX + CELL / 2; dv = dens[lab == L]
        wts = dv if kind == 'sc' else np.maximum(1e-3, 1 - dv)
        c = np.average(pts, axis=0, weights=wts); a, dd, r = radec(c)
        if kind == 'sc' and r > reach - SIG: continue
        cov = np.cov((pts - c).T, aweights=wts); ev = np.sort(np.linalg.eigvalsh(cov))[::-1]
        ngal = int(np.sum(lab[ix[:, 0], ix[:, 1], ix[:, 2]] == L))
        if kind == 'sc' and ngal < 20: continue                      # a region few galaxies stand in is noise, not the sky
        out.append({'ra': round(a, 2), 'dec': round(dd, 2), 'dMpc': round(r, 1), 'volMpc3': int(vol), 'reffMpc': round((3 * vol / (4 * math.pi)) ** (1 / 3), 1),
                    'axesMpc': [round(2 * math.sqrt(max(e, 0)) * 1.0, 1) for e in ev], 'peak' if kind == 'sc' else 'minDelta': round(float(dv.max() if kind == 'sc' else dv.min()), 2),
                    'nGal': ngal, 'name': name_of(c, 'sc' if kind == 'sc' else 'void')})
    return sorted(out, key=lambda s: -s['volMpc3'])
superclusters = regions(valid & (dens > 3), 'sc', 1500)
CONE = math.radians(35.0)
def raw_ratio(c, r):
    dc = float(np.linalg.norm(c)); u = c / dc; dist = np.linalg.norm(P - c, axis=1); inside = dist < r
    cosang = (P @ u) / np.maximum(D, 1e-9); shellcone = (~inside) & (np.abs(D - dc) < r) & (cosang > math.cos(CONE))
    vsh = 2 / 3 * math.pi * (1 - math.cos(CONE)) * ((dc + r) ** 3 - max(0.0, dc - r) ** 3) - 4 / 3 * math.pi * r ** 3
    return float(inside.sum() / max(1e-9, shellcone.sum() * (4 / 3 * math.pi * r ** 3) / max(vsh, 1.0)))
# voids: maximal empty spheres — the distance from each cell to the nearest cell dense enough to be a wall
WALL = 0.6; RVMIN = 9.0; INMIN = 0.8
edt = ndimage.distance_transform_edt(~(valid & (dens >= WALL)) & True) * CELL
peak = (edt == ndimage.maximum_filter(edt, size=5)) & valid & (dens < WALL) & (edt >= RVMIN)
cand = sorted(((float(edt[tuple(c)]), c) for c in np.argwhere(peak)), key=lambda t: -t[0])
voids = []
for rad, c in cand:
    ctr = c * CELL - RMAX + CELL / 2
    if any(np.linalg.norm(ctr - v['_c']) < rad + v['reffMpc'] * 0.5 for v in voids): continue
    ball = (np.sum((np.stack([X3, Y3, Z3], -1) - ctr) ** 2, -1) <= rad * rad)
    inside = float(valid[ball].mean())
    if inside < INMIN: continue
    a_, d_, r_ = radec(ctr)
    ng = int(np.sum(np.linalg.norm(P[sel] - ctr, axis=1) < rad))
    # the second, independent criterion: in the RAW galaxies, fewer than half of what the same radial shell in the
    # same direction (35 deg cone, the sphere excluded) predicts for its volume — a band-pass artefact fails it
    q = raw_ratio(ctr, rad)
    if q >= 0.5: continue
    voids.append({'_c': ctr, 'ra': round(a_, 2), 'dec': round(d_, 2), 'dMpc': round(r_, 1), 'reffMpc': round(rad, 1), 'volMpc3': int(4 / 3 * math.pi * rad ** 3),
                  'meanDelta': round(float(dens[ball & valid].mean()), 3), 'inMask': round(inside, 3), 'rawRatio': round(q, 3), 'nGal': ng, 'name': name_of(ctr, 'void')})
    if len(voids) >= 24: break
for v in voids: v.pop('_c')

# density at the catalogued centres of well-known rich clusters (redshift-space distance): all should be overdense
PROBES = [('Coma cluster (A1656)', 194.95, 27.98, 0.0231), ('Perseus cluster (A426)', 49.95, 41.51, 0.0179), ('Virgo cluster', 187.7, 12.4, 0.0036),
          ('Centaurus cluster (A3526)', 192.2, -41.3, 0.0114), ('Norma cluster (A3627)', 243.6, -60.9, 0.0157), ('Hercules cluster (A2151)', 241.2, 17.7, 0.0366),
          ('Hydra cluster (A1060)', 159.2, -27.5, 0.0126), ('Fornax cluster', 54.6, -35.5, 0.0046)]
probes = []
for nm, a, dd, zc in PROBES:
    pp = xyz(a, dd, float(np.interp(zc, zz, Dc))); ijk = ((pp + RMAX) / CELL - 0.5)
    val = float(ndimage.map_coordinates(np.where(valid, dens, np.nan), ijk[:, None], order=1)[0]) if np.all((ijk >= 0) & (ijk < N - 1)) else float('nan')
    probes.append({'name': nm, 'ra': a, 'dec': dd, 'z': zc, 'dMpc': round(float(np.linalg.norm(pp)), 1), 'density': None if not np.isfinite(val) else round(val, 2)})

# ── 5 · the volume and the galaxies ─────────────────────────────────────────────
M = 64; zoom = M / N
vol = ndimage.zoom(np.where(valid, dens, 0.0), zoom, order=1)
vmask = ndimage.zoom(valid.astype(float), zoom, order=0) > 0.5
lv = np.log10(1 + np.clip(vol, 0, 200)); LMAX = float(np.log10(1 + 15))
q = np.where(vmask, np.clip(np.round(lv / LMAX * 254) + 1, 1, 255), 0).astype(np.uint8)   # 0 = outside the reach
gi = (D > 1) & (D < reach)
Pg = np.round(P[gi] * 100).astype(np.int16)
dg = ndimage.map_coordinates(np.where(valid, dens, 0.0), ((P[gi] + RMAX) / CELL - 0.5).T, order=1)
qg = np.clip(np.round(np.log10(1 + np.clip(dg, 0, 200)) / LMAX * 255), 0, 255).astype(np.uint8)
blob = {'vol': base64.b64encode(q.tobytes(order='C')).decode(), 'gal': base64.b64encode(Pg.tobytes()).decode(), 'gd': base64.b64encode(qg.tobytes()).decode()}
meta = {'generated': 'scripts/build-local-web.py', 'source': 'Stellarium 23.4 catalog.dat (stellarium-data 23.4-2build3), redshifts from NED/HyperLEDA', 'sha256': SHA,
        'nWithZ': int(len(G)), 'validFraction100': round(float(valid[R < 100].mean()), 4), 'nInReach': int(gi.sum()), 'H0': H0, 'Om': Om, 'zoaDeg': ZOA, 'smoothMpc': round(SIG, 3), 'cellMpc': CELL, 'nMin': NMIN,
        'reachMpc': round(reach, 2), 'boxHalfMpc': RMAX, 'volN': M, 'volLogMax': round(LMAX, 6),
        'bigMpc': BIG, 'wallDelta': WALL, 'voidMinMpc': RVMIN, 'voidInMask': INMIN, 'thresholdSC': 3, 'frameNote': 'J2000 equatorial Cartesian, x toward RA 0 Dec 0, z toward Dec +90; redshift space',
        'volSha256': hashlib.sha256(q.tobytes(order='C')).hexdigest(), 'superclusters': superclusters, 'voids': voids, 'probes': probes}
line = 'const LOCAL_WEB_META=Object.freeze(' + json.dumps(meta, separators=(',', ':'), ensure_ascii=False) + ');'
tag = '<script type="application/json" id="hcc-local-web">' + json.dumps(blob, separators=(',', ':')) + '</script>'
src_html = open(INDEX, encoding='utf-8').read()
import re
def put(s, begin, end, body):
    pat = re.compile(re.escape(begin) + r'.*?' + re.escape(end), re.S)
    if not pat.search(s): raise SystemExit('marker not found: ' + begin)
    return pat.sub(lambda m: begin + '\n' + body + '\n' + end, s, count=1)
src_html = put(src_html, '/* LOCAL_WEB:BEGIN */', '/* LOCAL_WEB:END */', line)
src_html = put(src_html, '<!-- LOCAL_WEB:BEGIN -->', '<!-- LOCAL_WEB:END -->', tag)
open(INDEX, 'w', encoding='utf-8').write(src_html)
print('galaxies', len(G), 'in reach', int(gi.sum()), 'reach', round(reach, 1), 'Mpc; superclusters', len(superclusters), 'voids', len(voids))
for s in superclusters[:12]: print('  SC', s)
for s in voids[:10]: print('  V ', s)
for p_ in probes: print('  P ', p_)
print('embedded', sum(len(v) for v in blob.values()) // 1024, 'KB')
