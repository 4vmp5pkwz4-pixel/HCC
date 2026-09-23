#!/usr/bin/env python3
"""
THE WHOLE SKY IN THREE DIMENSIONS — every other constellation, the catalogue the atlas
embeds, and how it was made. The companion of scripts/build-zodiac-3d.py: the SAME
sources, the SAME source-choice rule, the SAME cross-check and quality classes, applied
to every IAU constellation the Sun's path does not cross.

Run once, offline, from the four published packages named below; the atlas does
not fetch anything at run time. Every number in data/zodiac-3d.json can be traced
to one of these, and the source of every field is recorded per star.

  star-catalog-lite 1.2.0  (npm)   TSC1 table: Gaia DR3 + Hipparcos (ESA 1997) +
                                   BSC5, with per-star reference epochs; carries every
                                   star of Stellarium's twelve western zodiac figures.
                                   SHA-256 of data/stars-bright-v5.tsc1:
                                   91587ffc17edde9c0736c0df821a5a9a97adda8bfe82ddfdae0d79e4f3312f40
  js-ephemeris-lite 1.2.0  (npm)   the reader for that table (parseTsc1Catalog)
  pyswisseph 2.10.3.2      (PyPI)  libswe/sefstars.txt: SIMBAD compilation of 4 Jan 2018,
                                   ICRS J2000 with proper motion, radial velocity and
                                   parallax — the INDEPENDENT source for the cross-check
  @found-in-space/stellarium-skycultures-western 0.3.0 (npm)
                                   Stellarium western figures (lines by HIP number) and
                                   the IAU 1930 boundaries (B1875)
  three-starmap 0.0.5      (npm)   HYG v3 B−V colour index, by HR number
  astropy 8.0.1 (PyPI)             get_constellation — Roman (1987) boundary lookup
  pyerfa 2.0.1.5 (PyPI)            eraStarpm, for membership epoch and golden values

The CDS services (SIMBAD, VizieR) and the Gaia archive were not reachable from the
build environment, which is why the sources are packaged copies and why the
cross-check matters: two compilations built independently are compared star by star.
"""
import json, math, re, sys, collections
import numpy as np
from astropy.coordinates import SkyCoord, get_constellation
import astropy.units as u
import erfa

ROOT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/cat'
OUT  = sys.argv[2] if len(sys.argv) > 2 else 'data/sky-3d.json'
ZOD  = ['Ari','Tau','Gem','Cnc','Leo','Vir','Lib','Sco','Sgr','Cap','Aqr','Psc']
ECL  = ZOD + ['Oph']            # the Sun's path crosses Ophiuchus; it is carried and labelled as such
BRIGHT_V = 5.0                  # Gaia DR3 bright-star regime: prefer the Hipparcos-era solution below it
HIP_FLOOR_MAS = 1.0             # a Hipparcos-era parallax below this is not a measured distance

GREEK = dict(alp='α',bet='β',gam='γ',del_='δ',eps='ε',zet='ζ',eta='η',the='θ',iot='ι',kap='κ',lam='λ',
             mu='μ',nu='ν',xi='ξ',omi='ο',pi='π',rho='ρ',sig='σ',tau='τ',ups='υ',phi='φ',chi='χ',psi='ψ',ome='ω')
GREEK_FULL = dict(alpha='alp',beta='bet',gamma='gam',delta='del_',epsilon='eps',zeta='zet',eta='eta',theta='the',
                  iota='iot',kappa='kap',lambda_='lam',mu='mu',nu='nu',xi='xi',omicron='omi',pi='pi',rho='rho',
                  sigma='sig',tau='tau',upsilon='ups',phi='phi',chi='chi',psi='psi',omega='ome')

T   = json.load(open(f'{ROOT}/tsc1.json'))
man = json.load(open(f'{ROOT}/stw/package/dist/manifest.json'))
hyg = {s['hr']: s['ci'] for s in json.load(open(f'{ROOT}/ts/data/visibleStarsFormatted.json'))
       if s.get('hr') and s.get('ci') is not None}

def rad_pm(pmra_mas, dec):      # μα* (mas/yr, includes cos δ) → dα/dt (rad/yr), the form ERFA wants
    return math.radians((pmra_mas or 0)/3.6e6)/math.cos(dec)

def at_j2000(ra_deg, de_deg, pmra, pmde, plx, rv, ep):
    ra=math.radians(ra_deg); de=math.radians(de_deg)
    r = erfa.starpm(ra, de, rad_pm(pmra,de), math.radians((pmde or 0)/3.6e6), (plx or 0)/1000.0,
                    rv or 0.0, *erfa.epj2jd(ep), *erfa.epj2jd(2000.0))
    return math.degrees(r[0]), math.degrees(r[1])

# ── 1. the SIMBAD-2018 compilation, every ICRS row ────────────────────────────────
S = []
for line in open(f'{ROOT}/pyswisseph-2.10.3.2/libswe/sefstars.txt', encoding='latin-1'):
    if line.startswith('#') or not line.strip(): continue
    f = [x.strip() for x in line.split(',')]
    if len(f) < 14 or f[2] != 'ICRS': continue
    try:
        ra = (float(f[3])+float(f[4])/60+float(f[5])/3600)*15
        sg = -1 if f[6].startswith('-') else 1
        de = sg*(abs(float(f[6]))+float(f[7])/60+float(f[8])/3600)
        pmra, pmde, rv, plx, mag = [float(x) for x in f[9:14]]
    except ValueError: continue
    S.append(dict(name=f[0], nom=f[1], ra=ra, de=de, pmra=pmra, pmde=pmde, rv=rv, plx=plx, mag=mag))
Sra = np.radians([s['ra'] for s in S]); Sde = np.radians([s['de'] for s in S])

# ── 2. membership: position at J2000.0 → B1875 IAU boundaries (Roman 1987) ─────────
T = [r for r in T if not (r['flags'] & 64)]          # special directions (Galactic Centre) are not stars
for r in T:
    r['ra2000'], r['de2000'] = at_j2000(r['rightAscensionDeg'], r['declinationDeg'],
        r['properMotionRaMasPerYear'], r['properMotionDecMasPerYear'], r['parallaxMas'],
        r['radialVelocityKmPerSecond'], r['referenceEpoch'])
con = get_constellation(SkyCoord([r['ra2000'] for r in T]*u.deg, [r['de2000'] for r in T]*u.deg,
                                 frame='icrs'), short_name=True)
for r, c in zip(T, con): r['iau'] = str(c)
sel = [r for r in T if r['iau'] not in ECL]

# ── 3. the figures ─────────────────────────────────────────────────────────────────
fig0 = {c['iau']: c['lines'] for c in man['constellations'] if c.get('iau') and c['iau'] not in ECL}
have = {r['hipId'] for r in sel}
# a figure segment is drawn only between two stars this catalogue can place; the
# segments it cannot are COUNTED and published rather than drawn to a guessed point
fig = {}; dropped = collections.Counter()
for k, L in fig0.items():
    keep = []
    for poly in L:
        run = []
        for h in poly:
            if h in have: run.append(h)
            else:
                dropped[k] += 1
                if len(run) >= 2: keep.append(run)
                run = []
        if len(run) >= 2: keep.append(run)
    fig[k] = keep
figHip = {h for L in fig.values() for poly in L for h in poly}

# ── 4. per-star source choice, cross-check and quality ─────────────────────────────
def simbad_match(r):
    a = math.radians(r['ra2000']); d = math.radians(r['de2000'])
    c = np.sin(d)*np.sin(Sde)+np.cos(d)*np.cos(Sde)*np.cos(Sra-a)
    i = int(np.argmax(c)); sep = math.degrees(math.acos(min(1.0, c[i])))*3600
    if sep >= 5: return None
    # every traditional spelling the compilation lists at this same position is kept:
    # the file carries no mark saying which one the IAU adopted, and picking one by a
    # rule nobody can check would be a claim the data does not make
    same = [S[j]['name'].strip() for j in np.where(c >= c[i] - 1e-15)[0]]
    hit = dict(S[i]); hit['aka'] = [re.sub(r'\s+', ' ', n) for n in dict.fromkeys(same) if n and not re.search(r'\d', n)]
    return hit

SRC = {1:'Gaia DR3', 2:'Hipparcos (ESA 1997)', 3:'BSC5', 4:'manual'}
def names(r):
    bayer = None; flam = None; proper = None
    for a in r['aliases']:
        m = re.fullmatch(r'(\d*)([a-z]+?)(\d?)_([a-z]{3})', a)
        if m and m.group(4) == r['iau'].lower():
            g = m.group(2); g = GREEK_FULL.get(g + ('_' if g=='lambda' else ''), g)
            key = 'del_' if g in ('del','delta') else g
            if key in GREEK: bayer = GREEK[key] + (m.group(3) and {'1':'¹','2':'²','3':'³'}[m.group(3)] or '')
            if m.group(1): flam = m.group(1)
        m2 = re.fullmatch(r'(\d+)_([a-z]{3})', a)
        if m2 and m2.group(2) == r['iau'].lower(): flam = m2.group(1)
    dn = r['displayName'].strip()
    m3 = re.fullmatch(r'(\d*)\s*([A-Z][a-z]{1,2})?\s*(\d?)\s*([A-Z][a-z]{2})', dn)
    if m3 and m3.group(4).lower() == r['iau'].lower():
        if m3.group(1) and not flam: flam = m3.group(1)
        g = (m3.group(2) or '').lower()
        key = {'del':'del_','ksi':'xi','ome':'ome','omi':'omi'}.get(g, g)
        if key in GREEK and not bayer:
            bayer = GREEK[key] + ({'1':'¹','2':'²','3':'³'}.get(m3.group(3), ''))
    if not re.search(r'\d|\s[A-Z][a-z]{2}$', dn) and not dn.startswith(('HR','HIP','HD')): proper = dn
    return proper, bayer, flam

# IAU-style proper names: the traditional-name field of the SIMBAD compilation is
# the one place a name is ATTACHED to a measured position, so it wins; a TSC1 alias
# is used only when it is one plain word and not a Chinese-asterism transliteration.
NOT_NAMES = {'net','horn','tail','heart','room','girl','wings','well','ghost','ox','star','neck','root',
             'emptiness','rooftop','basket','dipper','willow','hairy','head','three','mane'}
def proper_name(r, s):
    if s and s['name'].strip() and not re.search(r'\d', s['name']):
        return re.sub(r'\s+', ' ', s['name'].strip())
    for a in r['aliases']:
        if re.fullmatch(r'[a-z]{4,}', a) and a not in NOT_NAMES and a not in GREEK_FULL and a != r['iau'].lower():
            return a.capitalize()
    return None

out = []
for r in sel:
    s = simbad_match(r)
    V = r['magnitude'] if r['magnitude'] is not None else (s['mag'] if s else 99)
    g = dict(src=r['astrometrySource'], ra=r['rightAscensionDeg'], de=r['declinationDeg'],
             pmra=r['properMotionRaMasPerYear'] or 0.0, pmde=r['properMotionDecMasPerYear'] or 0.0,
             plx=r['parallaxMas'] or 0.0, ep=r['referenceEpoch'])
    sim = s and dict(src='SIMBAD 2018', ra=s['ra'], de=s['de'], pmra=s['pmra'], pmde=s['pmde'],
                     plx=s['plx'], ep=2000.0)
    # THE RULE, stated once: a self-consistent 5-parameter solution from ONE source
    tsc_ok = g['plx'] > 0 and g['src'] in (1, 2)
    sim_ok = bool(sim) and sim['plx'] > 0
    if g['src'] == 1 and V >= BRIGHT_V and tsc_ok: pick = 'tsc'
    elif sim_ok:                                    pick = 'sim'
    elif tsc_ok:                                    pick = 'tsc'
    else:                                           pick = None
    A = (sim if pick == 'sim' else g) if pick else g
    srcName = (SRC.get(A['src']) if pick == 'tsc' or not pick else 'SIMBAD 2018 compilation')
    rv = None; rvSrc = None
    if s and s['rv'] != 0:                              rv, rvSrc = s['rv'], 'SIMBAD 2018'
    elif r['radialVelocityKmPerSecond'] is not None:    rv, rvSrc = r['radialVelocityKmPerSecond'], SRC.get(r['astrometrySource'])
    # the cross-check: the OTHER source's distance, when both have a parallax
    other = None
    if tsc_ok and sim_ok:
        other = (g if pick == 'sim' else sim)['plx']
    plx = A['plx'] if pick else 0.0
    dis = abs(plx-other)/max(plx, other) if other else None
    hipEra = pick == 'sim' or (pick == 'tsc' and A['src'] == 2)
    if not pick or plx <= 0:                  q = 'D'
    elif hipEra and plx < HIP_FLOOR_MAS:      q = 'C'
    elif dis is not None and dis > 0.30:      q = 'C'
    elif dis is not None and dis <= 0.10:     q = 'A'
    else:                                     q = 'B'
    proper, bayer, flam = names(r)
    proper = proper_name(r, s) or proper
    # what is drawn along the line of sight: the two independent distances when both
    # exist, and an OPEN lower bound when the parallax is below the Hipparcos-era floor
    dAdopt = 1000.0/plx if plx > 0 else None
    if q == 'C' and hipEra and plx < HIP_FLOOR_MAS:
        span = dict(lo=1000.0/(plx+HIP_FLOOR_MAS), hi=None, why='parallax below the Hipparcos-era floor')
    elif other:
        span = dict(lo=min(dAdopt, 1000.0/other), hi=max(dAdopt, 1000.0/other), why='the two independent sources')
    else:
        span = None
    out.append(dict(
        hip=r['hipId'] or None, hr=r['hrId'] or None, gaia=r['gaiaDr3SourceId'] if r['gaiaDr3SourceId'] != '0' else None,
        con=r['iau'], zod=False, name=proper, bayer=bayer, flam=flam,
        V=round(V, 3), bv=hyg.get(r['hrId']) if r['hrId'] else None,
        ra=A['ra'], de=A['de'], pmra=A['pmra'], pmde=A['pmde'], plx=plx, ep=A['ep'],
        hd=r['hdId'] or None, aka=(s['aka'] if s else []),
        rv=rv, rvSrc=rvSrc, src=srcName if pick else 'none', otherPlx=other, disagree=dis, q=q, span=span,
        fig=(r['hipId'] in figHip)))

# ── 5. round ONCE, here, so the embedded table IS this file ─────────────────────────
# 1e-9° is 3.6 µas; the golden values below are computed from the rounded numbers, so
# the atlas's copy and the reference computation see identical inputs.
R = dict(ra=9, de=9, pmra=4, pmde=4, plx=5, rv=3, otherPlx=5, V=3, bv=3)
for st in out:
    for k, n in R.items():
        if st.get(k) is not None: st[k] = round(float(st[k]), n)
    if st['span']:
        st['span'] = dict(lo=round(st['span']['lo'], 4), hi=(round(st['span']['hi'], 4) if st['span']['hi'] else None),
                          why=st['span']['why'])
    if st['disagree'] is not None: st['disagree'] = round(st['disagree'], 5)

# ── 6. golden values from the reference implementation ─────────────────────────────
golden = []
for i, st in enumerate(out):
    if st['q'] == 'D' or i % 7: continue
    de = math.radians(st['de'])
    for ep in (-100000.0, -3000.0, 2000.0, 2026.7, 12000.0):
        res = erfa.starpm(math.radians(st['ra']), de, rad_pm(st['pmra'], de), math.radians(st['pmde']/3.6e6),
                          st['plx']/1000.0, st['rv'] or 0.0, *erfa.epj2jd(st['ep']), *erfa.epj2jd(ep))
        golden.append(dict(i=i, epoch=ep, ra=res[0], de=res[1], plx=res[4]*1000.0, rv=res[5]))

figOut = {k: v for k, v in fig.items()}
meta = dict(generated='scripts/build-sky-3d.py', droppedFigureVertices=dict(dropped), rule=dict(brightV=BRIGHT_V, hipFloorMas=HIP_FLOOR_MAS),
            counts=dict(collections.Counter(s['con'] for s in out)),
            quality=dict(collections.Counter(s['q'] for s in out)),
            sources=dict(collections.Counter(s['src'] for s in out)),
            crossChecked=sum(1 for s in out if s['disagree'] is not None),
            medianDisagreement=float(np.median([s['disagree'] for s in out if s['disagree'] is not None])))
json.dump(dict(meta=meta, stars=out, figures=figOut, golden=golden), open(OUT, 'w'), ensure_ascii=False, indent=0)
print(json.dumps(meta, ensure_ascii=False, indent=1))
