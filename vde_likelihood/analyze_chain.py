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


def read_chain(path: str):
    with open(path, "r", encoding="utf-8") as f:
        header = f.readline().lstrip("#").split()
    arr = np.loadtxt(path, comments="#")
    if arr.ndim == 1:
        arr = arr[None, :]
    if len(header) != arr.shape[1]:
        raise RuntimeError(f"Header/data column mismatch in {path}: {len(header)} vs {arr.shape[1]}")
    return header, arr


def main():
    chain_files = sorted(glob.glob(str(PREFIX) + ".*.txt"))
    if not chain_files:
        raise SystemExit("No Cobaya chain files found")

    header0, _ = read_chain(chain_files[0])
    pieces = []
    for file in chain_files:
        header, arr = read_chain(file)
        if header != header0:
            raise RuntimeError(f"Chain header mismatch in {file}")
        cut = int(IGNORE_FRACTION * len(arr))
        pieces.append(arr[cut:])
    data = np.vstack(pieces)
    idx = {name: i for i, name in enumerate(header0)}

    required = ["weight", "minuslogpost", "Omega_fld", "H0", "omega_cdm"]
    missing = [name for name in required if name not in idx]
    if missing:
        raise RuntimeError("Missing required chain columns: " + ", ".join(missing))

    weight = data[:, idx["weight"]]
    minuslogpost = data[:, idx["minuslogpost"]]
    requested = ["Omega_fld", "H0", "omega_cdm", "Omega_Lambda", "Omega_m", "rs_drag", "chi2__bao.desi_dr2"]

    summary = {
        "chain_files": chain_files,
        "chain_columns": header0,
        "rows_after_burnin": int(data.shape[0]),
        "burnin_fraction_removed_per_chain": IGNORE_FRACTION,
        "total_weight": float(np.sum(weight)),
        "parameters": {},
    }

    for name in requested:
        if name not in idx:
            continue
        x = data[:, idx[name]]
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
        name: float(data[best, i]) for name, i in idx.items()
    }

    x_omega = data[:, idx["Omega_fld"]]
    tot = float(np.sum(weight))
    summary["Omega_X_boundary_mass_proxy"] = {
        "P(Omega_X<0.005)": float(np.sum(weight[x_omega < 0.005]) / tot),
        "P(Omega_X<0.01)": float(np.sum(weight[x_omega < 0.01]) / tot),
        "P(Omega_X<0.02)": float(np.sum(weight[x_omega < 0.02]) / tot),
        "P(Omega_X<0.05)": float(np.sum(weight[x_omega < 0.05]) / tot),
        "P(Omega_X<0.10)": float(np.sum(weight[x_omega < 0.10]) / tot),
    }

    corr_names = ["Omega_fld", "H0", "omega_cdm"]
    X = np.column_stack([data[:, idx[n]] for n in corr_names])
    wn = weight / np.sum(weight)
    mu = np.sum(X * wn[:, None], axis=0)
    centered = X - mu
    cov = np.einsum("i,ij,ik->jk", wn, centered, centered)
    corr = cov / np.sqrt(np.outer(np.diag(cov), np.diag(cov)))
    summary["weighted_correlation"] = {
        corr_names[i]: {corr_names[j]: float(corr[i, j]) for j in range(len(corr_names))}
        for i in range(len(corr_names))
    }

    (OUT / "posterior_summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n")

    fig, axes = plt.subplots(1, 3, figsize=(13, 4))
    for ax, name, title in zip(
        axes,
        ["Omega_fld", "H0", "omega_cdm"],
        [r"$\Omega_X$", r"$H_0$", r"$\omega_c$"]
    ):
        x = data[:, idx[name]]
        ax.hist(x, bins=50, weights=weight, density=True, histtype="step", lw=1.8)
        q16, q50, q84 = weighted_quantile(x, [0.16, 0.5, 0.84], weight)
        ax.axvline(q50, color="k", lw=1)
        ax.axvspan(q16, q84, color="C0", alpha=0.12)
        ax.set_xlabel(title)
        ax.set_ylabel("posterior density")
        ax.grid(alpha=0.2)
    fig.tight_layout()
    fig.savefig(OUT / "posterior_marginals.png", dpi=180)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6, 5))
    ax.scatter(data[:, idx["Omega_fld"]], data[:, idx["H0"]], s=5, alpha=0.25,
               c=data[:, idx.get("chi2__bao.desi_dr2", idx["minuslogpost"])], cmap="viridis_r")
    ax.set_xlabel(r"$\Omega_X$")
    ax.set_ylabel(r"$H_0$ [km s$^{-1}$ Mpc$^{-1}$]")
    ax.grid(alpha=0.2)
    fig.tight_layout()
    fig.savefig(OUT / "OmegaX_H0_samples.png", dpi=180)
    plt.close(fig)

    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
