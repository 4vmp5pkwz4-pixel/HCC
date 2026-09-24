#!/usr/bin/env python3
"""The galaxies and the Galaxy's own clusters and nebulae at their catalogued distances,
embedded in index.html between  /* DSO3D-DATA-BEGIN */ and /* DSO3D-DATA-END */.

Source: the Stellarium 23.4 deep-sky catalogue (Ubuntu noble package stellarium-data
23.4-2build3, usr/share/stellarium/nebulae/default/catalog.dat, format 3.20), a
QDataStream of 94 660 objects compiled by the Stellarium team from NGC/IC, Messier, PGC,
UGC, Abell and other catalogues, with redshifts and distances from NED and HyperLEDA.
The catalogue's own distance (kpc) is used as given; beyond ~10 Mpc it is mostly a
Hubble-flow distance from the redshift, and the atlas says so on every card.

Usage: python3 scripts/build-dso-3d.py <catalog.dat> [index.html]"""
import gzip, struct, sys, json, math, hashlib, base64, os
src=sys.argv[1]; html=sys.argv[2] if len(sys.argv)>2 else os.path.join(os.path.dirname(__file__),'..','index.html')
raw=open(src,'rb').read(); sha=hashlib.sha256(raw).hexdigest()
b=gzip.decompress(raw) if raw[:2]==b'\x1f\x8b' else raw
o=0
def qs():
    global o
    n=struct.unpack('>I',b[o:o+4])[0]; o+=4
    if n==0xFFFFFFFF: return None
    s=b[o:o+n].decode('utf-16-be'); o+=n; return s
def u32():
    global o; v=struct.unpack('>I',b[o:o+4])[0]; o+=4; return v
def d():
    global o; v=struct.unpack('>d',b[o:o+8])[0]; o+=8; return v
ver=qs(); qs()
assert ver=='3.20', ver
LAYOUT='uuuuuuuuuuuuuusuusssssssuuuuu'
NAMES=['NGC','IC','M','C','B','Sh2','VdB','RCW','LDN','LBN','Cr','Mel','PGC','UGC','Ced','Arp','VV','PK','PNG','SNRG','ACO','HCG','ESO','VdBH','DWB','Tr','St','Ru','VdBHa']
recs=[]
while o<len(b):
    r={'nb':u32(),'ra':d(),'dec':d(),'b':d(),'v':d(),'ot':u32(),'mt':qs(),'maj':d(),'min':d(),'pa':u32(),'z':d(),'ze':d(),'plx':d(),'plxe':d(),'dist':d(),'diste':d()}
    for t,nm in zip(LAYOUT,NAMES): r[nm]=u32() if t=='u' else qs()
    recs.append(r)
assert o==len(b), 'catalogue did not parse to its last byte'
def morph_class(r):
    t=r['ot']; m=(r['mt'] or '').strip()
    if t in (1,2): return 4                       # active / radio galaxy
    if t==3: return 5                             # interacting pair or group
    if m.startswith(('E','cD','S0','SA0','SB0','dE','dSph')): return 0
    if m.startswith(('I','dI','Im','IB','IA','dIrr','BCD','Sm','SBm','SABm','SAm')) or 'm' in m[-2:]: return 3
    if any(k in m for k in ('a','ab','b')) and not any(k in m for k in ('c','d')): return 1
    if m.startswith(('S','SA','SB','SAB')): return 2
    return 6                                      # no morphology given
def name(r):
    for k,p in (('M','M'),('NGC','NGC '),('IC','IC '),('UGC','UGC '),('PGC','PGC ')):
        if r[k]: return p+str(r[k])
    for k in ('ESO','Ced','PK','PNG'):
        if r[k]: return k+' '+r[k]
    return 'DSO '+str(r['nb'])
# Distances the catalogue gets wrong or leaves out, for galaxies of the Local Group and a
# few landmarks, replaced by the published measurement (kpc). Each one must be found, or
# the build stops.
MC12='McConnachie (2012), AJ 144, 4 — tip of the red-giant branch / variables'
FIX_BY_NAME={
 'NGC 292':(62.44,'Graczyk et al. (2020), ApJ 904, 13 — eclipsing binaries','Small Magellanic Cloud'),
 'PGC 17223':(49.59,'Pietrzyński et al. (2019), Nature 567, 200 — eclipsing binaries','Large Magellanic Cloud'),
 'PGC 4689212':(26.0,MC12,'Sagittarius Dwarf Spheroidal'),
 'UGC 9749':(76.0,MC12,'Ursa Minor Dwarf'),
 'UGC 5470':(254.0,MC12,'Leo I'),
 'UGC 6253':(233.0,MC12,'Leo II'),
 'PGC 143':(933.0,MC12,'Wolf–Lundmark–Melotte'),
 'UGC 5364':(798.0,MC12,'Leo A'),
 'UGC 5373':(1426.0,MC12,'Sextans B'),
 'IC 10':(794.0,MC12,None),
 'UGC 12613':(920.0,MC12,'Pegasus Dwarf Irregular'),
 'PGC 65367':(1072.0,MC12,'Aquarius Dwarf'),
 'NGC 6822':(459.0,MC12,"Barnard's Galaxy"),
 'IC 1613':(755.0,MC12,None),
 'NGC 3109':(1300.0,MC12,None),
 'NGC 147':(676.0,MC12,None),
 'PGC 3792':(769.0,MC12,'LGS 3'),
 'PGC 2807155':(762.0,MC12,'Cassiopeia Dwarf'),
 'NGC 1569':(3360.0,'Grocholski et al. (2008), ApJ 686, L79 — tip of the red-giant branch',None),
 'NGC 5128':(3800.0,'Harris, Rejkuba & Harris (2010), PASA 27, 457 — mean of the modern distances','Centaurus A'),
 'M87':(16500.0,'Mei et al. (2007), ApJ 655, 144 — surface-brightness fluctuations','Virgo A'),
}
COMMON={'M31':'Andromeda Galaxy','M33':'Triangulum Galaxy','M81':"Bode's Galaxy",'M82':'Cigar Galaxy','M101':'Pinwheel Galaxy',
 'M104':'Sombrero Galaxy','M51':'Whirlpool Galaxy','M64':'Black Eye Galaxy','M83':'Southern Pinwheel Galaxy','PGC 29653':'Sextans A',
 'PGC 63287':'Sagittarius Dwarf Irregular','PGC 19441':'Carina Dwarf','UGC 10822':'Draco Dwarf','PGC 3589':'Sculptor Dwarf',
 'PGC 88608':'Sextans Dwarf','PGC 10074':'Fornax Dwarf','PGC 69519':'Tucana Dwarf','PGC 3097691':'Cetus Dwarf','PGC 29194':'Antlia Dwarf'}
fixed=[]
for r in recs:
    f=FIX_BY_NAME.get(name(r)) if r['ot'] in (0,1,2,3) else None
    if f:
        fixed.append((name(r),r['dist'],f[0])); r['dist']=f[0]; r['dsrc']=f[1]
        if f[2]: COMMON[name(r)]=f[2]
assert len(fixed)==len(FIX_BY_NAME), ('a corrected galaxy was not found', len(fixed))
# no galaxy lies within 20 kpc of the Sun (the nearest, the Sagittarius dwarf, is at 26 kpc);
# a catalogue distance under that is an error, and the galaxy is left out rather than drawn inside the Galaxy
bad=[name(r) for r in recs if r['ot'] in (0,1,2,3) and 0<r['dist']<20]
gal=[r for r in recs if r['ot'] in (0,1,2,3) and r['dist']>=20 and (r['v']<50 or r['b']<50)]
gal.sort(key=lambda r:r['dist'])
buf=bytearray()
for r in gal:
    ra=int(round(r['ra']/(2*math.pi)*65536))%65536
    de=int(round(r['dec']/(math.pi/2)*32767))
    ld=int(round((math.log10(r['dist'])+2)*8000)); assert 0<=ld<65536, r['dist']
    mag=r['v'] if r['v']<50 else r['b']-0.8          # B → V for a typical galaxy colour
    buf+=struct.pack('<HhHBB',ra,de,ld,max(0,min(255,int(round(mag*10)))),morph_class(r))
# the ones worth naming on a card: Messier, NGC, IC, and anything within 3 Mpc
names={}
for i,r in enumerate(gal):
    if r['M'] or r['NGC'] or r['IC'] or r['dist']<3000 or name(r) in COMMON:
        names[i]=[name(r),(r['mt'] or '').strip(),round(r['z'],6) if 0<r['z']<50 else None,COMMON.get(name(r)),r.get('dsrc')]
# the Galaxy's own objects: clusters and nebulae with a distance
KIND={7:'globular',6:'open',5:'cluster',11:'planetary',12:'dark',13:'reflection',15:'emission',16:'cluster+nebula',17:'HII',18:'SNR',19:'ISM'}
local=[]
for r in recs:
    if r['ot'] in KIND and r['dist']>=0.01 and r['dist']<200:     # under 10 pc is a catalogue error (IC 1871 at 0)
        local.append([name(r),KIND[r['ot']],round(math.degrees(r['ra']),4),round(math.degrees(r['dec']),4),round(r['dist'],4),
                      round(r['v'],2) if r['v']<50 else None, r['M'] or 0])
block=('/* DSO3D-DATA-BEGIN */\n'
 f'/* {len(gal)} galaxies and {len(local)} clusters and nebulae of the Galaxy, from the Stellarium 23.4 deep-sky\n'
 f'   catalogue (format {ver}; SHA-256 of catalog.dat {sha}). Galaxy records, 8 bytes, little-endian:\n'
 '   RA u16 (2^16 per turn) · Dec i16 (32767 per quarter turn) · log10(d/kpc)+2 u16 ×8000 · V u8 ×10 · class u8\n'
 '   (0 E/S0 · 1 early spiral · 2 late spiral · 3 irregular/dwarf · 4 active · 5 interacting · 6 unclassified) */\n'
 f'const DSO3D_GAL={{count:{len(gal)},sha256:\'{sha}\',b64:\'{base64.b64encode(bytes(buf)).decode()}\'}};\n'
 f'const DSO3D_GAL_NAMES={json.dumps(names,separators=(",",":"),ensure_ascii=False)};\n'
 f'const DSO3D_LOCAL={json.dumps(local,separators=(",",":"),ensure_ascii=False)};\n'
 '/* DSO3D-DATA-END */')
h=open(html,encoding='utf8').read()
a=h.find('/* DSO3D-DATA-BEGIN */'); z=h.find('/* DSO3D-DATA-END */')
assert a>=0 and z>a, 'markers not found'
h=h[:a]+block+h[z+len('/* DSO3D-DATA-END */'):]
open(html,'w',encoding='utf8').write(h)
print('corrected:',fixed); print('left out (distance under 20 kpc):',bad)
print(f'galaxies {len(gal)} · named {len(names)} · local objects {len(local)} · block {len(block)//1024} KiB · {sha[:12]}')
