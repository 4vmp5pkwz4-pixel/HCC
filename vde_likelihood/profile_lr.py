#!/usr/bin/env python3
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path('vde_likelihood/results/profile')
OUT = Path('vde_likelihood/results/summary')
OUT.mkdir(parents=True, exist_ok=True)


def read_header_point(path: Path):
    with path.open() as f:
        header = f.readline().lstrip('#').split()
        values = [float(x) for x in f.readline().split()]
    return dict(zip(header, values))


def main():
    alt = read_header_point(ROOT / 'alt.bestfit.txt')
    null = read_header_point(ROOT / 'null.bestfit.txt')
    chi2_alt = alt.get('chi2__bao.desi_dr2', alt.get('chi2__BAO'))
    chi2_null = null.get('chi2__bao.desi_dr2', null.get('chi2__BAO'))
    q = max(0.0, chi2_null - chi2_alt)
    rootq = math.sqrt(q)
    # Chernoff one-sided boundary law for q>0: p=1-Phi(sqrt(q))
    p_one_sided = 0.5 * math.erfc(rootq / math.sqrt(2.0)) if q > 0 else 0.5
    report = {
        'scope': 'conditional DESI DR2 BAO-only pilot; fixed Omega_k=-0.01 and omega_b=0.02237',
        'alternative': alt,
        'null': null,
        'chi2_alt': chi2_alt,
        'chi2_null': chi2_null,
        'q_X': q,
        'sqrt_q': rootq,
        'asymptotic_one_sided_p': p_one_sided,
        'interpretation_guardrail': 'Not a final cosmological model-comparison result; CMB/SNe/lensing and curvature freedom are not included.'
    }
    (OUT / 'profile_likelihood_ratio.json').write_text(json.dumps(report, indent=2, sort_keys=True) + '\n')
    print(json.dumps(report, indent=2, sort_keys=True))

if __name__ == '__main__':
    main()
