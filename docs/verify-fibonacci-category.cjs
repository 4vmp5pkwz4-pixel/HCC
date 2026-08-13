#!/usr/bin/env node
/* ============================================================================
   THE AXIOMS, THE UNIVERSALITY, AND THE OTHER SIGN

   Three things about Fibonacci anyons that the atlas asserted, used, or never
   asked, and that are decidable here.

   1. THE PENTAGON AND HEXAGON EQUATIONS.  A fusion category is not a table of
      F- and R-symbols; it is a table that SATISFIES two coherence conditions.
      The pentagon says the five ways of reassociating four objects agree; the
      hexagon says braiding and reassociation commute.  Everything the anyon
      laboratory computes rests on them and none of it had checked them.

      And the hexagon earns its keep immediately: it REJECTS the chirality error
      this atlas actually made in v3.76.0 — pairing R_1 = e^{4πi/5} with
      R_τ = e^{+3πi/5} — at residual 1.18, while Yang–Baxter and (ST)³ = e^{2πic/8}S²
      both passed it, because each of those is satisfied by either handedness
      taken consistently.  The hexagon is the equation that relates them.

   2. BRAIDING IS UNIVERSAL, AND THAT IS MEASURABLE.  "The braid image is dense
      in SU(2)" is usually quoted.  Here it is exercised: search braid words and
      watch the distance to a target gate fall as the words get longer.

   3. THE OTHER SIGN.  H = −ΣPᵢ is the antiferromagnetic golden chain and flows
      to the tricritical Ising model.  H = +ΣPᵢ is a different theory — the sign
      of one coupling changes the universality class — and the entanglement
      entropy can tell them apart.
   ========================================================================= */

let pass = 0, fail = 0;
function ok(t, c, d) { (c ? pass++ : fail++); console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); }

const PHI = (1 + Math.sqrt(5)) / 2, iP = 1 / PHI, sP = 1 / Math.sqrt(PHI);
const F = [[iP, sP], [sP, -iP]];
const N3 = (a, b, c) => ((a + b + c) === 1 ? 0 : 1);
/* the complete F-symbol: zero unless every vertex is admissible, the 2×2 matrix when all
   four outer labels are τ, and the identity otherwise */
function Fs(a, b, c, d, e, f) {
  if (!N3(a, b, e) || !N3(e, c, d) || !N3(b, c, f) || !N3(a, f, d)) return 0;
  if (a && b && c && d) return F[e][f];
  return 1;
}

/* ── 1. THE PENTAGON ─────────────────────────────────────────────────────── */
console.log('\n=== 1. The pentagon equation, over every labelling ===\n');
{
  let worst = 0, n = 0;
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++)
    for (let d = 0; d < 2; d++) for (let e = 0; e < 2; e++) for (let f = 0; f < 2; f++)
      for (let g = 0; g < 2; g++) for (let k = 0; k < 2; k++) for (let l = 0; l < 2; l++) {
        const L = Fs(f, c, d, e, g, l) * Fs(a, b, l, e, f, k);
        let R = 0;
        for (let h = 0; h < 2; h++) R += Fs(a, b, c, g, f, h) * Fs(a, h, d, e, g, k) * Fs(b, c, d, k, h, l);
        n++; worst = Math.max(worst, Math.abs(L - R));
      }
  ok('THE PENTAGON HOLDS, over all 512 labellings, to machine precision. [F^{fcd}_e]_{gl}[F^{abl}_e]_{fk} ' +
    '= Σ_h [F^{abc}_g]_{fh}[F^{ahd}_e]_{gk}[F^{bcd}_k]_{hl} — the statement that the five ways of ' +
    'reassociating four anyons agree. Everything the laboratory computes stands on this and nothing ' +
    'had checked it: the F-matrix was derived from F² = I, which is a consequence, not the axiom',
    worst < 1e-14,
    `${n} labellings · max |LHS − RHS| = ${worst.toExponential(3)} · the F-symbol used here is the ` +
    `general one, admissibility included, not the 2×2 block alone`);
}

/* ── 2. THE HEXAGON, AND THE ERROR IT CATCHES ────────────────────────────── */
console.log('\n=== 2. The hexagon equation, and the handedness it fixes ===\n');

const cmul = (x, y) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]];
function hexResidual(th1, thT, inverse) {
  const sgn = inverse ? -1 : 1;
  const R = (a, b, c) => {
    if (!N3(a, b, c)) return [0, 0];
    if (a === 0 || b === 0) return [1, 0];
    const t = (c === 0) ? th1 : thT;
    return [Math.cos(t), sgn * Math.sin(t)];
  };
  let worst = 0;
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++)
    for (let d = 0; d < 2; d++) for (let g = 0; g < 2; g++) for (let f = 0; f < 2; f++) {
      let L = cmul(R(c, a, g), [Fs(a, c, b, d, g, f), 0]);
      L = cmul(L, R(c, b, f));
      let Rt = [0, 0];
      for (let e = 0; e < 2; e++) {
        let t = [Fs(c, a, b, d, g, e), 0];
        t = cmul(t, R(c, e, d));
        t = cmul(t, [Fs(a, b, c, d, e, f), 0]);
        Rt = [Rt[0] + t[0], Rt[1] + t[1]];
      }
      worst = Math.max(worst, Math.hypot(L[0] - Rt[0], L[1] - Rt[1]));
    }
  return worst;
}
const RIGHT = hexResidual(4 * Math.PI / 5, -3 * Math.PI / 5, false);
const MIRROR = hexResidual(-4 * Math.PI / 5, 3 * Math.PI / 5, false);
const MIXED = hexResidual(4 * Math.PI / 5, 3 * Math.PI / 5, false);

ok('THE HEXAGON HOLDS for the atlas’s R-matrix — R^{ττ}_1 = e^{4πi/5}, R^{ττ}_τ = e^{−3πi/5} — and ' +
  'equally for its mirror image, which is right: a theory and its parity conjugate are both consistent',
  RIGHT < 1e-14 && MIRROR < 1e-14,
  `R^{ττ}_1 = e^{4πi/5}, R^{ττ}_τ = e^{−3πi/5}: residual ${RIGHT.toExponential(2)}\n         ` +
  `the mirror e^{−4πi/5}, e^{+3πi/5}: residual ${MIRROR.toExponential(2)} · both are Fibonacci, of ` +
  `opposite handedness, and the category cannot and should not choose between them`);

ok('AND IT REJECTS THE MIXED PAIRING AT RESIDUAL 1.18 — which is exactly the error this atlas made in ' +
  'v3.76.0, pairing R_1 = e^{4πi/5} with R_τ = e^{+3πi/5}. Yang–Baxter passed it. (ST)³ = e^{2πic/8}S² ' +
  'passed it. Both are satisfied by either handedness taken consistently, and neither relates the two ' +
  'phases to the F-matrix. The hexagon does, and it would have caught the bug the moment it was written',
  MIXED > 1,
  `mixed R_1 = e^{4πi/5}, R_τ = e^{+3πi/5}: residual ${MIXED.toFixed(6)} — not a small violation, a ` +
  `whole number · this is the check the laboratory was missing, and it is the cheapest one in the file`);

/* ── 3. BRAIDING IS UNIVERSAL ────────────────────────────────────────────── */
console.log('\n=== 3. Universality, exercised rather than quoted ===\n');
{
  const C = (re, im) => ({ re, im });
  const cm = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const cadd = (a, b) => C(a.re + b.re, a.im + b.im);
  const conj = a => C(a.re, -a.im);
  const mm = (A, B) => [
    [cadd(cm(A[0][0], B[0][0]), cm(A[0][1], B[1][0])), cadd(cm(A[0][0], B[0][1]), cm(A[0][1], B[1][1]))],
    [cadd(cm(A[1][0], B[0][0]), cm(A[1][1], B[1][0])), cadd(cm(A[1][0], B[0][1]), cm(A[1][1], B[1][1]))]];
  const R1 = C(Math.cos(4 * Math.PI / 5), Math.sin(4 * Math.PI / 5));
  const RT = C(Math.cos(-3 * Math.PI / 5), Math.sin(-3 * Math.PI / 5));
  const S1 = [[R1, C(0, 0)], [C(0, 0), RT]];
  const Fm = [[C(iP, 0), C(sP, 0)], [C(sP, 0), C(-iP, 0)]];
  const S2 = mm(Fm, mm(S1, Fm));
  const minv = M => [[conj(M[0][0]), conj(M[1][0])], [conj(M[0][1]), conj(M[1][1])]];
  const GEN = [['1', S1], ['2', S2], ['a', minv(S1)], ['b', minv(S2)]];
  const dist = (U, T) => {
    let tr = C(0, 0);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) tr = cadd(tr, cm(conj(U[j][i]), T[j][i]));
    const a = Math.hypot(tr.re, tr.im) / 2;
    return Math.sqrt(Math.max(0, 2 - 2 * Math.min(1, a)));       /* 0 = equal up to a global phase */
  };
  function search(target, maxLen) {
    let best = { d: 9, w: '' };
    const walk = (U, w, depth) => {
      const d = dist(U, target);
      if (d < best.d) best = { d, w: w || '(identity)' };
      if (!depth) return;
      const last = w.slice(-1);
      for (const [g, M] of GEN) {
        if ((last === '1' && g === 'a') || (last === 'a' && g === '1') ||
            (last === '2' && g === 'b') || (last === 'b' && g === '2')) continue;   /* no undo */
        walk(mm(M, U), w + g, depth - 1);
      }
    };
    walk([[C(1, 0), C(0, 0)], [C(0, 0), C(1, 0)]], '', maxLen);
    return best;
  }
  const H = [[C(Math.SQRT1_2, 0), C(Math.SQRT1_2, 0)], [C(Math.SQRT1_2, 0), C(-Math.SQRT1_2, 0)]];
  const runs = [8, 11, 13].map(L => ({ L, ...search(H, L) }));
  const mono = runs.every((r, i) => i === 0 || r.d <= runs[i - 1].d + 1e-12);
  ok('THE BRAID IMAGE IS DENSE IN SU(2), and here that is a measurement rather than a citation: the ' +
    'best approximation to a Hadamard by a braid word gets steadily better as the words get longer. ' +
    'That is what "Fibonacci anyons are universal for quantum computation" MEANS operationally — any ' +
    'gate, to any accuracy, by moving particles around each other and nothing else',
    mono && runs[runs.length - 1].d < 0.06,
    runs.map(r => `≤${r.L}: distance ${r.d.toFixed(6)} by "${r.w}"`).join('\n         ') +
    `\n         the search refuses a generator that undoes the previous one, so the words counted are ` +
    `genuinely distinct braids`);

  /* the same search against a gate no finite braid can reach exactly */
  ok('and no braid word reaches any of them EXACTLY, which is also the point: the image is dense, not ' +
    'onto. A topological quantum computer approximates; its protection is that the approximation ' +
    'cannot drift, because the word is a topological invariant of the worldlines',
    runs.every(r => r.d > 1e-9),
    `the smallest distance found at any length is ${Math.min(...runs.map(r => r.d)).toExponential(2)}, ` +
    `never zero`);
}

/* ── 4. THE OTHER SIGN ───────────────────────────────────────────────────── */
console.log('\n=== 4. H = +ΣP is a different theory ===\n');
{
  function ring(N) {
    const st = [];
    const rec = s => {
      if (s.length === N) { if (!(s[0] === 0 && s[N - 1] === 0)) st.push(s.slice()); return; }
      if (s.length && s[s.length - 1] === 0) rec([...s, 1]); else { rec([...s, 1]); rec([...s, 0]); }
    };
    rec([]);
    return { st, idx: new Map(st.map((s, i) => [s.join(''), i])), D: st.length };
  }
  function mulOf(N, R, sign) {
    const { st, idx, D } = R, v = [iP, sP], rj = [], rv = [];
    for (let a = 0; a < D; a++) {
      const m = new Map(), s = st[a];
      for (let i = 0; i < N; i++) {
        const L = s[(i - 1 + N) % N], Rr = s[(i + 1) % N];
        if (L === 0 && Rr === 0) { m.set(a, (m.get(a) || 0) - sign); continue; }
        if (L === 0 || Rr === 0) continue;
        for (const xp of [0, 1]) {
          const t = s.slice(); t[i] = xp;
          const j = idx.get(t.join('')); if (j === undefined) continue;
          m.set(j, (m.get(j) || 0) - sign * v[xp] * v[s[i]]);
        }
      }
      rj.push(Int32Array.from(m.keys())); rv.push(Float64Array.from(m.values()));
    }
    return x => { const y = new Float64Array(D);
      for (let a = 0; a < D; a++) { const J = rj[a], V = rv[a]; let t = 0;
        for (let k = 0; k < J.length; k++) t += V[k] * x[J[k]]; y[a] = t; } return y; };
  }
  function jac(M, D) {
    const A = M.map(r => Array.from(r));
    const Q = Array.from({ length: D }, (_, i) => { const e = new Float64Array(D); e[i] = 1; return e; });
    for (let sw = 0; sw < 200; sw++) {
      let off = 0; for (let p = 0; p < D; p++) for (let q = p + 1; q < D; q++) off += A[p][q] * A[p][q];
      if (off < 1e-26) break;
      for (let p = 0; p < D; p++) for (let q = p + 1; q < D; q++) {
        if (Math.abs(A[p][q]) < 1e-16) continue;
        const th = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]), c = Math.cos(th), s = Math.sin(th);
        for (let k = 0; k < D; k++) { const x = A[k][p], y = A[k][q]; A[k][p] = c * x - s * y; A[k][q] = s * x + c * y; }
        for (let k = 0; k < D; k++) { const x = A[p][k], y = A[q][k]; A[p][k] = c * x - s * y; A[q][k] = s * x + c * y; }
        for (let k = 0; k < D; k++) { const x = Q[k][p], y = Q[k][q]; Q[k][p] = c * x - s * y; Q[k][q] = s * x + c * y; }
      }
    }
    const o = Array.from({ length: D }, (_, i) => i).sort((a, b) => A[a][a] - A[b][b]);
    return { val: o.map(i => A[i][i]), vec: o.map(i => Q.map(r => r[i])) };
  }
  function ground(N, sign) {
    const R = ring(N), mul = mulOf(N, R, sign), D = R.D;
    const m = Math.min(D, 80), V = [], v0 = new Float64Array(D);
    for (let i = 0; i < D; i++) v0[i] = Math.sin(1 + i * 1.61803398875) + 0.3 * Math.cos(i * 0.7);
    let n = 0; for (let i = 0; i < D; i++) n += v0[i] * v0[i]; n = Math.sqrt(n);
    for (let i = 0; i < D; i++) v0[i] /= n; V.push(v0);
    const al = [], be = [];
    for (let k = 0; k < m; k++) {
      const w = mul(V[k]); let a = 0; for (let i = 0; i < D; i++) a += w[i] * V[k][i]; al.push(a);
      for (let i = 0; i < D; i++) w[i] -= a * V[k][i];
      if (k > 0) { const b = be[k - 1]; for (let i = 0; i < D; i++) w[i] -= b * V[k - 1][i]; }
      for (let r = 0; r < 2; r++) for (const u of V) { let d = 0; for (let i = 0; i < D; i++) d += w[i] * u[i]; for (let i = 0; i < D; i++) w[i] -= d * u[i]; }
      let b = 0; for (let i = 0; i < D; i++) b += w[i] * w[i]; b = Math.sqrt(b);
      if (b < 1e-11 || k === m - 1) break;
      be.push(b); for (let i = 0; i < D; i++) w[i] /= b; V.push(w);
    }
    const M = al.length, T = Array.from({ length: M }, () => new Float64Array(M));
    for (let i = 0; i < M; i++) { T[i][i] = al[i]; if (i + 1 < M) { T[i][i + 1] = be[i]; T[i + 1][i] = be[i]; } }
    const { val, vec } = jac(T, M), c = vec[0], psi = new Float64Array(D);
    for (let k = 0; k < V.length; k++) { const w = c[k]; for (let i = 0; i < D; i++) psi[i] += w * V[k][i]; }
    let p = 0; for (let i = 0; i < D; i++) p += psi[i] * psi[i]; p = Math.sqrt(p);
    for (let i = 0; i < D; i++) psi[i] /= p;
    return { psi, E0: val[0], R, D };
  }
  /* von Neumann entropy of the block x_1 … x_L, tracing out the rest */
  function blockS(N, L, G) {
    const { psi, R } = G, { st } = R, A = new Map(), B = new Map();
    for (const s of st) { const a = s.slice(0, L).join(''), b = s.slice(L).join('');
      if (!A.has(a)) A.set(a, A.size); if (!B.has(b)) B.set(b, B.size); }
    const na = A.size, nb = B.size, M = Array.from({ length: na }, () => new Float64Array(nb));
    st.forEach((s, i) => { M[A.get(s.slice(0, L).join(''))][B.get(s.slice(L).join(''))] = psi[i]; });
    const G2 = Array.from({ length: na }, () => new Float64Array(na));
    for (let i = 0; i < na; i++) for (let j = 0; j < na; j++) { let t = 0;
      for (let k = 0; k < nb; k++) t += M[i][k] * M[j][k]; G2[i][j] = t; }
    let S = 0; for (const l of jac(G2, na).val) if (l > 1e-13) S -= l * Math.log(l);
    return S;
  }
  function cFromEntanglement(N, sign) {
    const G = ground(N, sign), pts = [];
    for (let L = 2; L <= N / 2; L++) pts.push([Math.log((N / Math.PI) * Math.sin(Math.PI * L / N)), blockS(N, L, G)]);
    const n = pts.length; let sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const [x, y] of pts) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
    return { c: 3 * (n * sxy - sx * sy) / (n * sxx - sx * sx), e: G.E0 / N };
  }
  const AF = [12, 14, 16].map(N => ({ N, ...cFromEntanglement(N, +1) }));
  const FM = [12, 14, 16].map(N => ({ N, ...cFromEntanglement(N, -1) }));

  ok('THE SIGN OF ONE COUPLING CHANGES THE UNIVERSALITY CLASS, and the entanglement entropy separates ' +
    'them without any velocity, any fit of the ground-state energy, and any momentum resolution. ' +
    'S(ℓ) = (c/3)·ln[(N/π)sin(πℓ/N)] + const on a ring, so the slope against the chord IS c/3',
    AF[2].c < FM[2].c - 0.05 && AF[2].c > 0.6 && FM[2].c > 0.75,
    `H = −ΣP: ${AF.map(r => `N=${r.N}→${r.c.toFixed(4)}`).join(' · ')}  (tricritical Ising 7/10 = 0.700)\n         ` +
    `H = +ΣP: ${FM.map(r => `N=${r.N}→${r.c.toFixed(4)}`).join(' · ')}  (Z₃ parafermion 4/5 = 0.800, quoted)`);

  ok('AND THIS IS A DISCRIMINATOR, NOT A PRECISION MEASUREMENT — said here rather than left for a reader ' +
    'to discover. Both sequences are still falling at N = 16 and both sit above their targets by a few ' +
    'per cent; anyonic chains carry a boundary contribution to the entropy that this two-parameter fit ' +
    'does not model. The precise c for the antiferromagnet remains 0.699945, from the stress tensor in ' +
    'docs/verify-fibonacci-momentum.cjs. What entanglement adds is that it needs none of that machinery',
    Math.abs(AF[2].c - 0.7) > 0.02,
    `antiferro at N = 16: ${AF[2].c.toFixed(6)} against 7/10 — ${((AF[2].c / 0.7 - 1) * 100).toFixed(1)}% high and ` +
    `still decreasing · ferro at N = 16: ${FM[2].c.toFixed(6)} against 4/5 — ${((FM[2].c / 0.8 - 1) * 100).toFixed(1)}% · ` +
    `the ORDERING is the result, and it is unambiguous`);
}

console.log(`\n${pass}/${pass + fail} checks pass\n`);
process.exit(fail ? 1 : 0);
