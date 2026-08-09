#!/usr/bin/env python3
from __future__ import annotations

import glob
import json
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

PREFIX = Path("vde_likelihood/results/desi_dr2_bao_vde_pilot")
OUT = Path("vde_likelihood/results/summary")
OUT.mkdir(parents=True, exist_ok=True)
IGNORE_FRACTION = 0.30


def weighted_quantile(values, quantiles, weights):
    values = np.asarray(values, dtype=float)
    quantiles = np.asarray(quantiles, dtype=float)
    weights = np.asarray(weights, dtype=float)
    order = np.argsort(values)
    values = values[order]
    weights = weights[order]
    cdf = np.cumsum(weights) - 0.5 * weights
    cdf /= np.sum(weights)
    return np.interp(quantiles, cdf, values)


def read_paramnames(path: Path):
    names = []
    labels = []
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line:
            continue
        parts = line.split(None, 1)
        names.append(parts[0].rstrip("*"))
        labels.append(parts[1] if len(parts) > 1 else parts[0])
    return names, labels


def main():
    chain_files = sorted(glob.glob(str(PREFIX) + ".*.txt"))
    if not chain_files:
        raise SystemExit("No Cobaya chain files found")

    names, labels = read_paramnames(Path(str(PREFIX) + ".paramnames"))
    pieces = []
    for file in chain_files:
        arr = np.loadtxt(file)
        if arr.ndim == 1:
            arr = arr[None, :]
        cut = int(IGNORE_FRACTION * len(arr))
        pieces.append(arr[cut:])
    data = np.vstack(pieces)

    weight = data[:, 0]
    minuslogpost = data[:, 1]
    params = data[:, 2:2 + len(names)]
    idx = {name: i for i, name in enumerate(names)}

    requested = ["Omega_fld", "H0", "omega_cdm", "Omega_Lambda", "Omega_m", "rs_drag"]
    summary = {
        "chain_files": chain_files,
        "rows_after_burnin": int(data.shape[0]),
        "burnin_fraction_removed_per_chain": IGNORE_FRACTION,
        "total_weight": float(np.sum(weight)),
        "parameters": {},
    }

    for name in requested:
        if name not in idx:
            continue
        x = params[:, idx[name]]
        q025, q16, q50, q84, q975 = weighted_quantile(x, [0.025, 0.16, 0.5, 0.84, 0.975], weight)
        mean = float(np.average(x, weights=weight))
        var = float(np.average((x - mean) ** 2, weights=weight))
        summary["parameters"][name] = {
            "mean": mean,
            "std": var ** 0.5,
            "q2.5": float(q025),
            "q16": float(q16),
            "median": float(q50),
            "q84": float(q84),
            "q97.5": float(q975),
        }

    best = int(np.argmin(minuslogpost))
    summary["best_sample"] = {
        "minuslogpost": float(minuslogpost[best]),
        "parameters": {name: float(params[best, i]) for name, i in idx.items() if i < params.shape[1]},
    }

    # Boundary mass proxy: posterior probability below small Omega_X thresholds.
    if "Omega_fld" in idx:
        x = params[:, idx["Omega_fld"]]
        tot = float(np.sum(weight))
        summary["Omega_X_boundary_mass_proxy"] = {
            "P(Omega_X<0.005)": float(np.sum(weight[x < 0.005]) / tot),
            "P(Omega_X<0.01)": float(np.sum(weight[x < 0.01]) / tot),
            "P(Omega_X<0.02)": float(np.sum(weight[x < 0.02]) / tot),
        }

    (OUT / "posterior_summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n")

    # Weighted histograms/marginals for the three sampled parameters.
    fig, axes = plt.subplots(1, 3, figsize=(13, 4))
    for ax, name, title in zip(
        axes,
        ["Omega_fld", "H0", "omega_cdm"],
        [r"$\Omega_X$", r"$H_0$", r"$\omega_c$"]
    ):
        if name not in idx:
            continue
        x = params[:, idx[name]]
        ax.hist(x, bins=50, weights=weight, density=True, histtype="step", lw=1.8)
        ax.set_xlabel(title)
        ax.set_ylabel("posterior density")
        ax.grid(alpha=0.2)
    fig.tight_layout()
    fig.savefig(OUT / "posterior_marginals.png", dpi=180)
    plt.close(fig)

    # Simple weighted Omega_X-H0 scatter, downsampled for legibility.
    if "Omega_fld" in idx and "H0" in idx:
        x = params[:, idx["Omega_fld"]]
        y = params[:, idx["H0"]]
        step = max(1, len(x) // 5000)
        fig, ax = plt.subplots(figsize=(6, 5))
        ax.scatter(x[::step], y[::step], s=4, alpha=0.2)
        ax.set_xlabel(r"$\Omega_X$")
        ax.set_ylabel(r"$H_0$ [km s$^{-1}$ Mpc$^{-1}$]")
        ax.grid(alpha=0.2)
        fig.tight_layout()
        fig.savefig(OUT / "OmegaX_H0_samples.png", dpi=180)
        plt.close(fig)

    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
