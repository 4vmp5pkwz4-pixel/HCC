/* ── ORIGIN OF phi · ZECKENDORF AUDIT ─────────────────────────────────────────
   The point of this file is NOT to derive phi.  It is to keep four different
   structures apart, because conflating any two of them produces a derivation of phi
   that is not one.

     A. the golden-mean CONSTRAINT      -> counts states, gives h_top = ln phi   THEOREM
     B. the inverse ZECKENDORF theorem  -> forces the weights a_n = F_{n+2}      THEOREM
     C. the exponent Delta              -> only Delta = 1 makes RADII add        THEOREM
     D. the full code vs a sparse ladder-> full code gives NO geometric ladder    THEOREM

   None of A-D is a physical derivation of R_{N+1}/R_N = phi.  Each is a statement about
   counting, about arithmetic, or about which exponent would be needed.  The physical
   operator whose eigenvalues obey the Fibonacci recursion is OPEN. */
const PHI=(1+Math.sqrt(5))/2;
const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);
const F=(()=>{const f=[0,1];for(let i=2;i<90;i++)f[i]=f[i-1]+f[i-2];return f;})();

/* ── A · the golden-mean constraint counts states, and its rate is ln phi ──── */
{
  /* words of length L over {0,1} with no two adjacent ones */
  const count=L=>{ let a=1,b=2; if(L===0)return 1; if(L===1)return 2;
    for(let i=2;i<=L;i++){ const c=a+b; a=b; b=c; } return b; };
  let bad=0;
  for(let L=0;L<=40;L++) if(count(L)!==F[L+2]) bad++;
  /* by brute enumeration for small L, so the recursion is not merely self-consistent */
  let brute=0;
  for(let L=0;L<=18;L++){ let n=0;
    for(let w=0;w<(1<<L);w++) if(!(w&(w<<1))) n++;
    if(n!==count(L)) brute++; }
  const A=[[1,1],[1,0]];
  const lamMax=(1+Math.sqrt(5))/2;                    // largest eigenvalue of A
  /* L = 4000 overflows a double: F_4000 is about 1e836 and the ratio becomes NaN.
     The limit is reached long before that -- at L = 300 the count is ~1e62, still
     exactly representable in the mantissa's leading digits for this purpose. */
  const hTop=Math.log(count(302)/count(300))/2;      // ln C_L / L in the limit
  ok('A · THEOREM: the golden-mean constraint z_n z_{n+1} = 0 admits C_L = F_{L+2} words of length L — checked by brute enumeration up to L = 18 as well as by the recursion — and the transfer matrix [[1,1],[1,0]] has largest eigenvalue phi, so the topological entropy is exactly ln phi',
    bad===0 && brute===0 && Math.abs(lamMax-PHI)<1e-15 && Math.abs(hTop-Math.log(PHI))<1e-9,
    `C_L = F_{L+2} for L = 0..40 · brute-forced to L = 18 · h_top = ${hTop.toFixed(12)} vs ln phi = ${Math.log(PHI).toFixed(12)}`);
  ok('… and what that does NOT say: ln phi here is the growth rate of a STATE COUNT. It is a property of a counting problem, not a ratio of physical radii, and nothing in it fixes R_{N+1}/R_N',
    true, 'entropy of an alphabet is not a length scale — recorded as a limitation, not a result');
}

/* ── B · the inverse Zeckendorf theorem forces the weights ─────────────────── */
{
  /* If every Q in N_0 has a UNIQUE representation as a sum of a_n over a binary word
     with no adjacent ones, then a_0 = 1, a_1 = 2 and a_{n+1} = a_n + a_{n-1}.
     The elementary proof runs through the largest representable number M_n. */
  const a=[1,2]; for(let i=2;i<40;i++) a[i]=a[i-1]+a[i-2];
  let bad=0; for(let i=0;i<40;i++) if(a[i]!==F[i+2]) bad++;
  /* M_n = largest representable with bits 0..n = sum of a_k over the alternating word */
  const M=n=>{ let s=0; for(let k=n;k>=0;k-=2) s+=a[k]; return s; };
  /* completeness: every Q in [0, M_n] must be representable exactly once */
  let holes=0, dupes=0;
  const N=14, seen=new Map();
  for(let w=0;w<(1<<(N+1));w++){
    if(w&(w<<1)) continue;
    let q=0; for(let k=0;k<=N;k++) if(w&(1<<k)) q+=a[k];
    seen.set(q,(seen.get(q)||0)+1);
  }
  for(const [q,c] of seen) if(c>1) dupes++;
  for(let q=0;q<=M(N);q++) if(!seen.has(q)) holes++;
  ok('B · THEOREM: uniqueness of the representation FORCES the weights — a_0 = 1, a_1 = 2, a_{n+1} = a_n + a_{n-1}, i.e. a_n = F_{n+2} — and with those weights every integer from 0 to M_14 is hit exactly once, with no gaps and no duplicates',
    bad===0 && holes===0 && dupes===0,
    `a_n = F_{n+2} for n = 0..39 · every Q in [0, ${M(N)}] represented exactly once · ${holes} gaps · ${dupes} duplicates`);
  /* bit order, stated explicitly, because it is the usual place this goes wrong */
  const decode=w=>{ let q=0; for(let k=0;k<32;k++) if(w&(1<<k)) q+=a[k]; return q; };
  ok('… with the bit order fixed in writing: the word is w_{L-1}...w_1 w_0 and the RIGHTMOST bit is z_0, so the word 001 means z_0 = 1 and Q = 1',
    decode(0b001)===1 && decode(0b010)===2 && decode(0b100)===3 && decode(0b101)===4,
    '001 -> 1 · 010 -> 2 · 100 -> 3 · 101 -> 4');
}

/* ── C · the exponent, and why only Delta = 1 makes radii add ──────────────── */
{
  /* If Q_n = (R_n/l)^Delta = F_{n+2}, the EXACT recursion is on Q, not on R:
       (R_{n+1}/l)^Delta = (R_n/l)^Delta + (R_{n-1}/l)^Delta.
     Radii themselves add only when Delta = 1, and the ratio tends to phi^{1/Delta}. */
  let worstRec=0, rows=[];
  for(const D of [0.5,1,2,3]){
    const R=n=>Math.pow(F[n+2],1/D);
    let w=0;
    for(let n=1;n<=30;n++)
      w=Math.max(w,Math.abs(Math.pow(R(n+1),D)-Math.pow(R(n),D)-Math.pow(R(n-1),D))/Math.pow(R(n+1),D));
    worstRec=Math.max(worstRec,w);
    rows.push(`Delta=${D}: R_{n+1}/R_n -> ${(R(40)/R(39)).toFixed(9)} vs phi^{1/Delta} = ${Math.pow(PHI,1/D).toFixed(9)}`);
  }
  const addOK=D=>{ const R=n=>Math.pow(F[n+2],1/D);
    return Math.abs(R(20)-R(19)-R(18))/R(20)<1e-12; };
  ok('C · THEOREM: the Fibonacci recursion lives on the CHARGE, not on the radius. (R_{n+1}/l)^Delta = (R_n/l)^Delta + (R_{n-1}/l)^Delta holds for every Delta, but the radii themselves add ONLY at Delta = 1 — and the ratio tends to phi^{1/Delta}, so a golden LADDER of radii is a statement about Delta, which no part of this argument supplies',
    worstRec<1e-12 && addOK(1) && !addOK(2) && !addOK(0.5),
    `charge recursion exact to ${worstRec.toExponential(2)} for all Delta · radii add at Delta=1 and not at Delta=2 or 1/2 · ${rows.join(' · ')}`);

  /* generalised Cassini */
  /* CASSINI IS AN IDENTITY OF THE CHARGES, and that is precisely the content: it is
     the same statement for every Delta because Delta never enters it.  Checking it by
     round-tripping the radii through pow(F, 1/Delta) and back only measures the
     round trip -- 9.5e-6 at Delta = 3 -- so it is checked where it lives, on the
     integers, and the round trip is reported separately as what it is. */
  /* in BigInt, because F[n+3]*F[n+1] passes 2^53 around n = 30 and the "identity"
     would then be measuring the mantissa rather than the arithmetic */
  const FB=(()=>{const f=[0n,1n];for(let i=2;i<90;i++)f[i]=f[i-1]+f[i-2];return f;})();
  let cas=0n;
  for(let n=1;n<=60;n++){
    const d=FB[n+3]*FB[n+1]-FB[n+2]*FB[n+2]-(n%2?-1n:1n);
    if(d<0n?-d>cas:d>cas) cas=d<0n?-d:d; }
  let trip=0;
  for(const D of [1,2,3]){ const R=n=>Math.pow(F[n+2],1/D);
    for(let n=1;n<=25;n++){
      const lhs=Math.pow(R(n+1)*R(n-1),D)-Math.pow(R(n),2*D);
      trip=Math.max(trip,Math.abs(lhs-Math.pow(-1,n))); } }
  ok('… and the generalised Cassini identity is an invariant of the CHARGE sequence, which is exactly why it survives the exponent unchanged: Delta never appears in it. Checked on the integers where it lives — exact to n = 60 — while the float round trip through pow(F,1/Delta) and back is reported separately, because that number measures the round trip and not the identity',
    cas===0n && trip<1e-4,
    `exact on the charges to n = 60 (residual ${cas}) · float round trip through the radii at Delta in {1,2,3} costs ${trip.toExponential(2)}, which is the round trip and not the identity`);
}

/* ── D · a full code is not a sparse ladder ────────────────────────────────── */
{
  /* The full Zeckendorf code realises EVERY charge Q = 0,1,2,3,...  If a threshold is
     proportional to Q, consecutive thresholds approach ratio one — arithmetic, not
     geometric.  A geometric phi-ladder needs a SPARSE primitive spectrum q_n = F_{n+2},
     which is a different object and has no derivation here. */
  const ratios=[];
  for(const Q of [10,100,1000,10000]) ratios.push((Q+1)/Q);
  const sparse=[]; for(let n=1;n<=8;n++) sparse.push(F[n+3]/F[n+2]);
  ok('D · THEOREM: the FULL code and a SPARSE ladder are different objects. The full code realises every charge, so thresholds proportional to Q have ratio (Q+1)/Q -> 1 — arithmetic spacing, no geometric ladder. Only a sparse PRIMITIVE spectrum q_n = F_{n+2} has ratios tending to phi, and no physical operator with that spectrum is derived anywhere in this construction',
    Math.abs(ratios[3]-1)<1e-3 && Math.abs(sparse[7]-PHI)<1e-3,
    `full code: ${ratios.map(r=>r.toFixed(4)).join(', ')} -> 1 · sparse ladder: ${sparse.slice(-3).map(r=>r.toFixed(6)).join(', ')} -> phi`);
}

/* ── the three DIFFERENT tests for phi, and their different frequencies ─────── */
{
  /* Binet transient: F_n = (phi^n - psi^n)/sqrt5 with psi = -1/phi, so the relative
     correction is (-1)^n phi^{-2n}.  With Q = (R/l)^Delta = F_{n+2} the log-frequency is
     omega_Z = pi*Delta/ln phi, and the amplitude dies as R^{-2Delta}.
     True discrete scale invariance with ratio lambda gives omega_DSI = 2 pi/ln lambda.
     At Delta = 1 and lambda = phi these differ by exactly a factor of two, so a test
     tuned to one has NO power against the other. */
  const lnphi=Math.log(PHI);
  const omegaZ=D=>Math.PI*D/lnphi, omegaDSI=lam=>2*Math.PI/Math.log(lam);
  /* measure the Binet frequency directly off the sequence rather than trusting Binet */
  const D=1, resid=[];
  for(let n=2;n<=26;n++){
    const q=F[n+2], approx=Math.pow(PHI,n+2)/Math.sqrt(5);
    resid.push([Math.log(Math.pow(q,1/D)), (q-approx)/approx]);
  }
  /* the residual must alternate in sign every step, i.e. have period 2 in n, i.e.
     period 2*ln(phi)/Delta in ln R  ->  frequency pi*Delta/ln phi */
  let alt=0; for(let i=1;i<resid.length;i++) if(resid[i][1]*resid[i-1][1]<0) alt++;
  const decay=Math.abs(resid[resid.length-1][1])/Math.abs(resid[0][1]);
  ok('THREE DIFFERENT TESTS, THREE DIFFERENT FREQUENCIES. The Binet transient alternates every step — frequency omega_Z = pi*Delta/ln phi = 6.5285028 at Delta = 1 — and its amplitude dies as phi^{-2n}, so it has power only on the first few rungs. True discrete scale invariance at ratio phi sits at omega_DSI = 2 pi/ln phi = 13.0570056, exactly twice as fast. A test tuned to one has no power against the other, and the atlas must not present them as one hypothesis',
    alt===resid.length-1 && decay<1e-8 &&
    Math.abs(omegaZ(1)-Math.PI/lnphi)<1e-15 && Math.abs(omegaDSI(PHI)-2*Math.PI/lnphi)<1e-15 &&
    Math.abs(omegaDSI(PHI)-2*omegaZ(1))<1e-12,
    `omega_Z(Delta=1) = ${omegaZ(1).toFixed(6)} · omega_DSI(phi) = ${omegaDSI(PHI).toFixed(6)} = 2 x omega_Z · Binet residual alternates at every one of ${alt} steps and decays by ${decay.toExponential(2)} over n = 2..26`);
  ok('… and the amplitude law is what removes the Binet test from cosmology: it falls as phi^{-2n}, so by the tenth rung it is 1e-4 of the signal and by the fortieth it is below double precision. It is a first-rungs test and nothing else',
    Math.pow(PHI,-2*10)<2e-4 && Math.pow(PHI,-2*40)<1e-16,
    `relative amplitude: n=5 ${Math.pow(PHI,-10).toExponential(2)} · n=10 ${Math.pow(PHI,-20).toExponential(2)} · n=40 ${Math.pow(PHI,-80).toExponential(2)}`);
}

/* ── the standing conclusion ───────────────────────────────────────────────── */
ok('OPEN, and recorded as OPEN: none of A, B, C or D derives R_{N+1}/R_N = phi. A counts states, B fixes weights given uniqueness, C says only Delta = 1 would let radii add, D says the full code gives no geometric ladder at all. What is missing is a physical operator whose spectrum is the sparse primitive sequence q_n = F_{n+2}, and this file does not supply one',
  true, 'status: OPEN — the ladder R_N = l_P phi^N remains a structural ansatz');

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
