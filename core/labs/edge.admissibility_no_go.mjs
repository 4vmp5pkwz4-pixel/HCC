import { defineLab } from '../contract.mjs';
import { STATUS } from '../status.mjs';
import { PHI_R, edgeRdiag, edgeNaiveRoot, edgeRootWith, edgeZetaEff, edgeZetaFromSpecies,
         edgePval, edgeKL, edgeEisenstein, EDGE_ZETA0_SCALAR, EDGE_LNDET_UNIT } from '../atlas/extracted.mjs';

/* CONDITIONAL, and the headline is a NO-GO that belongs to the manuscript rather than to
   this atlas. The recursion operator R is offered as the thing whose spectrum should select
   the closed shell 292. Implemented as written, the naive gap balance has its root near
   NINE for every O(1) APS constant; to move it to 292 the constant would have to be about
   1e61, which is the answer smuggled in as an input.

   An atlas that implemented R and quietly displayed 292 would be doing the exact opposite of
   what the paper asked for. So this laboratory reports the refuted root as an output and
   never returns 292 as a result of anything. */
export default defineLab({
  id: 'edge.admissibility_no_go',
  title: 'The recursion operator ℛ and the edge Hamiltonian — a registry, not a selector',
  status: STATUS.CONDITIONAL,
  model_id: 'edge.recursion',
  equation_ids: ['edge.R_diag', 'edge.gap_balance', 'edge.determinant_slope', 'edge.admissibility',
                 'edge.kronecker', 'edge.species'],
  summary: 'R = Proj_Bradlow ∘ APS_eta ∘ Hopf_red ∘ Fus_phi, implemented as written. The fusion term ' +
    'N ln phi is LINEAR in N while the Hopf density ln(N^2) is LOGARITHMIC, so no O(1) constant could ' +
    'ever reach 292 — the failure is structural, not numerical, and naming that is the result.',
  formulas: [
    'R_diag(l) = phi^l * (2l+1) * exp(-C_APS/(l+1)) * [l(l+1) <= q]',
    'naive gap balance:  N ln phi = ln(N^2 + C_APS)      =>  N ~ 9.286, NOT 292',
    'C_APS needed for 292:  exp(292 ln phi) - 292^2  ~  1e61',
    'with a determinant slope:  N ln phi = ln(N^2 + C) + kappa N,  kappa = -2 zeta_eff(0) ln phi',
    "zeta_eff(0) that would put the root at 292:  -1/2 + ln(N^2+C)/(2 N ln phi) = -0.4596",
    "ln det'(-Delta) on the unit S^2 = 1/2 - 4 zeta_R'(-1)",
    'Kronecker: log(sqrt(y) |eta(tau)|^2), SL2(Z)-INVARIANT, hence ONE number once tau is fixed'
  ],
  assumptions: [
    'the APS defect is O(1) and enters as C/(l+1), as declared',
    'the Bradlow projector truncates at l(l+1) > q — a PROJECTOR, not a weight',
    'the admissibility kernel is a sum of positive squares with every lambda -> infinity, which makes it ' +
      'a projector and not an energy: a configuration is admissible exactly when every term vanishes'
  ],
  domain_of_validity: [
    '0 <= l_max <= 64, 1 <= q <= 1e6, 0.01 <= C_APS <= 100',
    'four admissibility terms are arithmetic and are checked; the Bradlow energy functional, the ' +
      'higher-derivative constraints, the trace-free locality operator and the quantum-covariance algebra are NOT',
    'Z_edge(q) = Z_grav · Z_DEM · Z_string · Z_val is a DECLARED FACTORISATION here, never a computed number'
  ],
  falsifiers: [
    'the naive root moves away from ~9.286 for an O(1) APS constant',
    'the C_APS required to reach 292 turns out to be O(1) rather than ~1e61',
    'the supplied species content produces a positive root, which its slope overshooting ln phi forbids',
    'the admissibility kernel accepts a configuration in which any checked term is nonzero'
  ],
  verifiers: ['docs/verify-edge-operator.cjs (12/12)', 'docs/verify-gate-independence.cjs (9/9)'],
  open_problems: [
    'edge.determinants — primed functional determinants with tachyonic edge masses are not implemented',
    'edge.harish_chandra — the Harish-Chandra edge oscillator character is not implemented',
    'edge.so4_volume — the SO(4) edge volume factor is not implemented',
    'edge.kronecker — the Kronecker-limit modular functional is not implemented',
    'edge.H_boundary_q — H_{∂,q} does not exist as a fully specified operator; ℛ is a registry, not a selector'
  ],
  cost_hint: 'fast',
  inputs: [
    { name: 'l_max', type: 'number', unit: 'edge level', default: 24, min: 0, max: 64, doc: 'finite cutoff of the edge-character tower' },
    { name: 'q', type: 'number', unit: 'boundary degrees of freedom', default: 400, min: 1, max: 1e6, doc: 'the capacity sector the Bradlow projector truncates against' },
    { name: 'C_APS', type: 'number', unit: 'dimensionless', default: 1, min: 0.01, max: 100, doc: 'the O(1) APS defect constant of the naive closure' },
    { name: 'tau_lP2', type: 'number', unit: 'dimensionless', default: Math.PI, min: 0, max: 100, doc: 'tau·lP^2; the Planck-cell term forces it to pi' },
    { name: 'tau_im', type: 'number', unit: 'dimensionless', default: 1, min: 0.5, max: 40, doc: 'imaginary part of the modular parameter; no tau(N) is declared anywhere, which is why this term cannot move the root' },
    { name: 'k_CS', type: 'number', unit: 'level', default: 800, min: 0, max: 1e7, doc: 'boundary Chern–Simons level; the lock is k_CS = 2q' },
    { name: 'zeta_eff', type: 'number', unit: 'dimensionless', default: -0.4596, min: -4, max: 0,
      doc: 'the effective zeta(0) of the edge determinant sector. This is the ONE number the missing determinants have to supply; -2/3 is a single massless scalar' },
    { name: 'D_val', type: 'number', unit: 'dimensionless', default: -2, min: -6, max: 4, doc: 'an eigenvalue of the valuation operator; the annihilator demands P_val(D) = 0' }
  ],
  outputs: [
    { name: 'n_naive', unit: 'rung', doc: 'root of the naive gap balance — the REFUTED value, reported because the manuscript reports it' },
    { name: 'n_shell', unit: 'rung', doc: 'the closed shell the paper claims, quoted for comparison and NOT produced by this operator' },
    { name: 'C_needed', unit: 'dimensionless', doc: 'the APS constant the naive balance would need to reach 292 — about 1e61, the answer smuggled in as an input' },
    { name: 'n_with_determinant', unit: 'rung', doc: 'the root once a determinant slope is included; null when the slope overshoots ln phi and no positive root exists' },
    { name: 'kappa', unit: 'per rung', doc: 'the determinant slope -2 zeta_eff(0) ln phi actually supplied' },
    { name: 'zeta_eff_needed', unit: 'dimensionless', doc: 'the zeta_eff(0) that would put the root exactly at 292 — a falsifiable target, not a result' },
    { name: 'scalar_fraction', unit: 'dimensionless', doc: 'that target in units of one massless scalar — neither nothing nor one field' },
    { name: 'zeta_eff_species', unit: 'dimensionless', doc: 'zeta_eff(0) from the literature-fixed edge species content with the full l = 1 vector kernel (6 modes): -8/3' },
    { name: 'zeta_eff_species_killing', unit: 'dimensionless', doc: 'the same with the vector kernel read as Killing vectors alone (3 modes): -7/6' },
    { name: 'n_from_species', unit: 'rung', doc: 'the root the supplied species content actually gives — null, because its slope overshoots ln phi' },
    { name: 'species_verdict', type: 'string', unit: null, doc: 'what the supplied species content decides, in words' },
    { name: 'spectral_radius', unit: null, doc: 'largest diagonal entry of R at this cutoff; the operator is diagonal, so this is an eigenvalue and not a bound' },
    { name: 'levels_kept', unit: 'count', doc: 'how many levels survive the Bradlow projector at this q' },
    { name: 'bradlow_cut', unit: 'edge level', doc: 'the level where l(l+1) > q truncates the tower' },
    { name: 'admissible', unit: null, doc: '1 when every checked admissibility term vanishes, 0 otherwise' },
    { name: 'violations', type: 'string', unit: null, doc: 'which admissibility conditions failed, by name' },
    { name: 'P_val', unit: null, doc: 'P_val(D) itself; zero exactly on {1,0,-1,-2,-3}' },
    { name: 'lndet_unit_S2', unit: null, doc: "ln det'(-Delta) on the unit two-sphere, exact" },
    { name: 'kronecker', unit: null, doc: 'the SL2(Z)-invariant Kronecker term at the declared tau; ONE number once tau is fixed, so it shifts the intercept and cannot move the root' },
    { name: 'E2', unit: null, doc: 'E2(tau), quasi-modular, the other argument of F_KL' },
    { name: 'Z_edge_computed', type: 'boolean', unit: null, doc: 'false, always: Z_edge is a declared factorisation and no number is produced for it' },
    { name: 'selects_292', type: 'boolean', unit: null, doc: 'false: the operator as written is a REGISTRY consistent with rung 292, not a selector that produces it' }
  ],
  evaluate(i) {
    const L = Math.floor(i.l_max), spec = [];
    for (let l = 0; l <= L; l++) spec.push(edgeRdiag(l, i.q, i.C_APS));
    const kept = spec.filter(x => x > 0).length;
    let cut = spec.findIndex(x => x === 0); if (cut < 0) cut = L + 1;
    const bad = [];
    if (Math.abs(i.tau_lP2 - Math.PI) > 1e-9 * Math.PI) bad.push(`tau*lP^2 = ${i.tau_lP2} != pi`);
    if (Math.abs(i.k_CS - 2 * i.q) > 1e-9) bad.push(`k_CS = ${i.k_CS} != 2q = ${2 * i.q}`);
    if (Math.abs(edgePval(i.D_val)) > 1e-12) bad.push(`P_val(${i.D_val}) = ${edgePval(i.D_val)} != 0`);
    const kappa = -2 * i.zeta_eff * Math.log(PHI_R);
    const kSpecies = -2 * edgeZetaFromSpecies(6) * Math.log(PHI_R);
    return {
      outputs: {
        n_naive: edgeNaiveRoot(i.C_APS), n_shell: 292,
        C_needed: Math.exp(292 * Math.log(PHI_R)) - 292 * 292,
        n_with_determinant: edgeRootWith(kappa, i.C_APS),
        kappa,
        zeta_eff_needed: edgeZetaEff(292, i.C_APS),
        scalar_fraction: edgeZetaEff(292, i.C_APS) / EDGE_ZETA0_SCALAR,
        zeta_eff_species: edgeZetaFromSpecies(6),
        zeta_eff_species_killing: edgeZetaFromSpecies(3),
        n_from_species: edgeRootWith(kSpecies, i.C_APS),
        species_verdict: kSpecies > Math.log(PHI_R)
          ? `overshoots: kappa = ${kSpecies.toFixed(6)} > ln phi = ${Math.log(PHI_R).toFixed(6)}, no positive root at all`
          : `root at ${edgeRootWith(kSpecies, i.C_APS)}`,
        spectral_radius: kept ? Math.max(...spec) : 0,
        levels_kept: kept, bradlow_cut: cut,
        admissible: bad.length ? 0 : 1, violations: bad.length ? bad.join(' · ') : 'none',
        P_val: edgePval(i.D_val),
        lndet_unit_S2: EDGE_LNDET_UNIT,
        kronecker: edgeKL(0, i.tau_im),
        E2: edgeEisenstein(2, 0, i.tau_im),
        Z_edge_computed: false,
        selects_292: false
      },
      warnings: [
        'THE HEADLINE IS A NO-GO, and it is the manuscript\'s own: the naive gap balance has its root near 9, ' +
        'not 292. This laboratory reports the refuted root and never returns 292 as the output of anything.',
        'NOT implemented, and named rather than glossed: the Harish–Chandra edge oscillator character, the ' +
        'SO(4) edge volume, the primed determinants with their tachyonic edge masses, and the Kronecker-limit ' +
        'functional. Those are what would turn ℛ into a selector.',
        'Z_edge_computed = false: Z_edge = Z_grav·Z_DEM·Z_string·Z_val is a declared factorisation, not a number.',
        'the admissibility output is a PROJECTOR verdict, not an energy; four terms are arithmetic and checked, ' +
        'and the Bradlow energy functional, higher-derivative constraints, trace-free locality operator and ' +
        'quantum-covariance algebra are not checked at all'
      ],
      diagnostics: { operator: 'diagonal, so the spectral radius is an eigenvalue', checked_terms: 4 }
    };
  },
  selftests: [
    { name: 'the naive root sits near NINE for every O(1) APS constant — never near 292',
      run(L) { const rows = [];
        for (const C of [0.01, 0.1, 1, 5, 20, 100]) rows.push(L.run({ C_APS: C }, { provenance: {} }).outputs.n_naive);
        return { pass: rows.every(n => n > 8 && n < 13),
          detail: `roots over C_APS = 0.01…100: ${rows.map(n => n.toFixed(4)).join(', ')} — the whole O(1) range lands near 9` }; } },
    { name: 'reaching 292 would take an APS constant of about 1e61, which is the answer smuggled in as an input',
      run(L) { const o = L.run({}, { provenance: {} }).outputs;
        return { pass: o.C_needed > 1e60 && o.C_needed < 1e62,
          detail: `C_APS would have to be ${o.C_needed.toExponential(4)} — not an O(1) correction to anything` }; } },
    { name: 'the laboratory never returns 292 as a result, and says so in a field',
      run(L) { const o = L.run({}, { provenance: {} }).outputs;
        return { pass: o.selects_292 === false && o.n_shell === 292 && Math.abs(o.n_naive - 292) > 250,
          detail: `n_shell = 292 is QUOTED for comparison; the operator's own root is ${o.n_naive.toFixed(6)}, and selects_292 = false` }; } },
    { name: 'the zeta_eff(0) that WOULD put the root at 292 is a falsifiable target, and the supplied species content misses it',
      run(L) { const o = L.run({}, { provenance: {} }).outputs;
        return { pass: Math.abs(o.zeta_eff_needed + 0.4596) < 1e-4 &&
            Math.abs(o.zeta_eff_species + 8 / 3) < 1e-12 && Math.abs(o.zeta_eff_species_killing + 7 / 6) < 1e-12 &&
            o.n_from_species === null,
          detail: `needed ζ_eff(0) = ${o.zeta_eff_needed.toFixed(9)} · supplied = ${o.zeta_eff_species.toFixed(6)} = −8/3 ` +
            `(Killing kernel ${o.zeta_eff_species_killing.toFixed(6)} = −7/6) · ${o.species_verdict}` }; } },
    { name: 'the Kronecker term is SL₂(ℤ)-invariant and therefore cannot move the root — it shifts an intercept',
      run(L) { const a = L.run({ tau_im: 1 }, { provenance: {} }).outputs;
        const b = L.run({ tau_im: 3 }, { provenance: {} }).outputs;
        return { pass: a.kronecker <= -0.5168 + 1e-9 && b.kronecker <= -0.5168 + 1e-9 && a.n_naive === b.n_naive,
          detail: `K(τ = i) = ${a.kronecker.toFixed(9)}, K(τ = 3i) = ${b.kronecker.toFixed(9)}, both at or below the bound −0.5168, ` +
            `and the root is unchanged at ${a.n_naive.toFixed(6)}` }; } },
    { name: 'admissibility is a PROJECTOR: it refuses term by term and names the condition that failed',
      run(L) { const ok = L.run({}, { provenance: {} }).outputs;
        const no = L.run({ k_CS: 799, D_val: 2.5 }, { provenance: {} }).outputs;
        return { pass: ok.admissible === 1 && no.admissible === 0 && /k_CS/.test(no.violations) && /P_val/.test(no.violations),
          detail: `admissible at the lock; refused otherwise with: ${no.violations}` }; } },
    { name: 'the Bradlow projector truncates where l(l+1) > q, and the cut moves with q',
      run(L) { const a = L.run({ q: 30, l_max: 24 }, { provenance: {} }).outputs;
        const b = L.run({ q: 400, l_max: 24 }, { provenance: {} }).outputs;
        return { pass: a.bradlow_cut < b.bradlow_cut && a.levels_kept === a.bradlow_cut,
          detail: `q = 30 keeps ${a.levels_kept} levels (cut at l = ${a.bradlow_cut}), q = 400 keeps ${b.levels_kept} (cut at l = ${b.bradlow_cut})` }; } }
  ]
});
