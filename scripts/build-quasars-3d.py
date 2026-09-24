#!/usr/bin/env python3
"""Quasars at their comoving distances, for the atlas's cosmic layer and its light census.

Source: the quasar catalogue that ships inside Stellarium 23.4 (Quasars plugin, compiled
into the binary as a Qt resource). It is drawn from Véron-Cetty & Véron (2010), "A
catalogue of quasars and active nuclei: 13th edition", A&A 518, A10, limited to V <= 18.
The resource is found in the binary by scanning its zlib streams for the catalogue
header, so no Qt tooling is needed and the result is checked by hash.

Kept: every entry with z > 0 whose catalogue absolute magnitude is M <= -23, the
Véron-Cetty & Véron definition of a quasar (fainter nuclei are Seyferts, which sit in
galaxies the galaxy catalogue already holds).

Computed here, the same way for every object:
  comoving distance   D_C = c/H0 * integral_0^z dz' / sqrt(Om (1+z')^3 + OL)
                       flat LCDM, H0 = 67.4, Om = 0.315 (Planck 2018; the atlas's own)
  luminosity distance D_L = (1+z) D_C
  absolute magnitude  M_V = V - 5 log10(D_L / 10 pc) - K,
                       K = -2.5 (1 + alpha) log10(1+z), alpha_nu = -0.5 (quasar power law)

Usage: python3 scripts/build-quasars-3d.py <stellarium binary: usr/bin/stellarium>
"""
import sys, zlib, re, json, math, hashlib, os

H0, OM = 67.4, 0.315
C = 299792.458
def comoving_mpc(z, n=400):
    if z <= 0: return 0.0
    h = z / n; s = 0.0
    for i in range(n + 1):
        w = 1 if i in (0, n) else (4 if i % 2 else 2)
        s += w / math.sqrt(OM * (1 + i * h) ** 3 + (1 - OM))
    return C / H0 * h / 3 * s
def hms(s):
    m = re.match(r'(\d+)h(\d+)m([\d.]+)s', s); h, mi, se = map(float, m.groups()); return (h + mi / 60 + se / 3600) * 15
def dms(s):
    m = re.match(r'([+-]?)(\d+)d(\d+)m([\d.]+)s', s); sg, d, mi, se = m.groups()
    v = float(d) + float(mi) / 60 + float(se) / 3600; return -v if sg == '-' else v

binpath = sys.argv[1]
b = open(binpath, 'rb').read()
binsha = hashlib.sha256(b).hexdigest()
res = None
for m in re.finditer(rb'\x78[\x9c\xda\x01\x5e]', b):
    try: out = zlib.decompressobj().decompress(b[m.start():m.start() + 4_000_000], 20_000_000)
    except Exception: continue
    if out.startswith(b'{') and b'"shortName": "A catalogue of quasars"' in out[:200]:
        res = out; break
assert res, 'quasar catalogue resource not found in the binary'
ressha = hashlib.sha256(res).hexdigest()
Q = json.loads(res.decode('utf8'))['quasars']
rows = []; dm = []
for name, v in Q.items():
    z, V, Mc = v.get('z', 0), v.get('Vmag'), v.get('Amag')
    if not (z and z > 0 and V is not None and Mc is not None and Mc <= -23): continue
    dc = comoving_mpc(z); dl = (1 + z) * dc
    K = -2.5 * (1 - 0.5) * math.log10(1 + z)
    Mv = V - 5 * math.log10(dl * 1e5) - K
    dm.append(Mv - Mc)
    rows.append([name, round(hms(v['RA']), 4), round(dms(v['DE']), 4), round(z, 4), round(V, 2), round(Mv, 2), round(Mc, 1), v.get('sclass', '') or ''])
rows.sort(key=lambda r: r[3])
dm.sort()
med = dm[len(dm) // 2]
print(f'quasars kept {len(rows)} of {len(Q)} · z {rows[0][3]}–{rows[-1][3]} · median(M_V − M_cat) {med:+.2f} mag')
block = ('/* QSO3D-DATA-BEGIN */\n'
         f'/* {len(rows)} quasars (catalogue M <= -23) from the Stellarium 23.4 Quasars plugin resource\n'
         f'   (Véron-Cetty & Véron 2010, 13th ed., V <= 18); binary SHA-256 {binsha}, resource SHA-256 {ressha}.\n'
         '   Row: name, RA°, Dec° (J2000), z, V, M_V (computed: Planck 2018 D_L, K for alpha_nu = -0.5), M (catalogue), class */\n'
         f'const QSO3D={{count:{len(rows)},binSha256:\'{binsha}\',resSha256:\'{ressha}\',H0:{H0},Om:{OM},rows:'
         + json.dumps(rows, separators=(',', ':'), ensure_ascii=False) + '};\n'
         '/* QSO3D-DATA-END */')
html = os.path.join(os.path.dirname(__file__), '..', 'index.html')
h = open(html, encoding='utf8').read()
a = h.find('/* QSO3D-DATA-BEGIN */'); z = h.find('/* QSO3D-DATA-END */')
assert a >= 0 and z > a, 'markers not found'
h = h[:a] + block + h[z + len('/* QSO3D-DATA-END */'):]
open(html, 'w', encoding='utf8').write(h)
print(f'block {len(block) // 1024} KiB')
