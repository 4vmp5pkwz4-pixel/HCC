#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import math
import os
from pathlib import Path
from typing import Any

import numpy as np

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from classy import Class

OUT = Path(os.environ.get("VDE_OUT", "vde_validation/results"))
OUT.mkdir(parents=True, exist_ok=True)

PINNED_CLASS_COMMIT = "e85808324f51fc694d12e3ed7439552a3c3f9540"
OMEGA_X_FID = 0.05
OMEGA_X_NULL = 1.0e-8
OMEGA_K = -0.01
H = 0.674
L_MAX = 1200
PK_MAX_HMPC = 1.5


def base_params() -> dict[str, Any]:
    return {
        "h": H,
        "omega_b": 0.02237,
        "omega_cdm": 0.1200,
        "Omega_k": OMEGA_K,
        "A_s": 2.10e-9,
        "n_s": 0.965,
        "tau_reio": 0.0544,
        "output": "tCl,pCl,lCl,mPk,dTk,vTk",
        "lensing": "yes",
        "gauge": "newtonian",
        "l_max_scalars": L_MAX,
        "P_k_max_h/Mpc": PK_MAX_HMPC,
        "z_pk": "0,1",
    }


def with_vde(omega_x: float) -> dict[str, Any]:
    p = base_params()
    p.update({
        "Omega_fld": omega_x,
        "fluid_equation_of_state": "CLP",
        "w0_fld": -2.0 / 3.0,
        "wa_fld": 0.0,
        "cs2_fld": 1.0,
        "use_ppf": "no",
    })
    return p


def control_params() -> dict[str, Any]:
    return base_params()


def parse_precision_file(path: Path) -> dict[str, Any]:
    d: dict[str, Any] = {}
    for raw in path.read_text().splitlines():
        line = raw.split("#", 1)[0].strip()
        if not line or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        v = v.strip()
        if k:
            d[k] = v
    return d


def save_columns(path: Path, data: dict[str, Any]) -> None:
    keys = list(data.keys())
    if not keys:
        return
    arrays = [np.asarray(data[k]) for k in keys]
    n = min(len(a) for a in arrays)
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(keys)
        for i in range(n):
            w.writerow([a[i] for a in arrays])


def save_pk(path: Path, k_h: np.ndarray, pk_mpc3: np.ndarray) -> None:
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["k_h_Mpc", "P_lin_Mpc3", "P_lin_Mpch3"])
        for k, p in zip(k_h, pk_mpc3):
            w.writerow([k, p, p * H**3])


def run_model(name: str, params: dict[str, Any], precision: dict[str, Any] | None = None) -> dict[str, Any]:
    c = Class()
    try:
        c.set(params)
        if precision:
            c.set(precision)
        c.compute()

        lensed = c.lensed_cl(L_MAX)
        raw = c.raw_cl(L_MAX)
        background = c.get_background()
        transfer = c.get_transfer(0.0)

        k_h = np.geomspace(1e-4, 1.0, 180)
        pkfun = getattr(c, "pk_lin", None)
        if pkfun is None:
            pkfun = c.pk
        pk = np.array([pkfun(float(k * H), 0.0) for k in k_h], dtype=float)

        derived = {
            "classy_version": getattr(__import__("classy"), "__version__", "unknown"),
            "h": float(c.h()),
            "Omega_k": float(c.Omega_k()),
            "Omega_Lambda": float(c.Omega_Lambda()),
            "Omega_fld": float(c.Omega_fld()),
            "sigma8": float(c.sigma8()),
        }
        try:
            derived.update(c.get_current_derived_parameters(["conformal_age", "z_rec", "tau_rec"]))
        except Exception as exc:
            derived["derived_parameter_warning"] = str(exc)

        save_columns(OUT / f"{name}_cl_lensed.csv", lensed)
        save_columns(OUT / f"{name}_cl_raw.csv", raw)
        save_columns(OUT / f"{name}_background.csv", background)
        save_columns(OUT / f"{name}_transfer_z0.csv", transfer)
        save_pk(OUT / f"{name}_pk_z0.csv", k_h, pk)
        (OUT / f"{name}_derived.json").write_text(json.dumps(derived, indent=2, sort_keys=True) + "\n")
        (OUT / f"{name}_params.json").write_text(json.dumps(params, indent=2, sort_keys=True) + "\n")

        return {
            "lensed": {k: np.asarray(v) for k, v in lensed.items()},
            "raw": {k: np.asarray(v) for k, v in raw.items()},
            "background": background,
            "transfer": transfer,
            "k_h": k_h,
            "pk": pk,
            "derived": derived,
        }
    finally:
        try:
            c.struct_cleanup()
        except Exception:
            pass
        try:
            c.empty()
        except Exception:
            pass


def rel_stats(a: np.ndarray, b: np.ndarray, floor_frac: float = 1e-10) -> dict[str, float]:
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    scale = max(float(np.nanmax(np.abs(b))), 1e-300)
    mask = np.isfinite(a) & np.isfinite(b) & (np.abs(b) > floor_frac * scale)
    if not np.any(mask):
        return {"max": math.nan, "p95": math.nan, "median": math.nan, "n": 0}
    r = np.abs(a[mask] / b[mask] - 1.0)
    return {
        "max": float(np.max(r)),
        "p95": float(np.percentile(r, 95)),
        "median": float(np.median(r)),
        "n": int(r.size),
    }


def ell_window_stats(a: np.ndarray, b: np.ndarray, ell_min: int = 30, ell_max: int = 1000) -> dict[str, float]:
    n = min(len(a), len(b), ell_max + 1)
    return rel_stats(np.asarray(a)[ell_min:n], np.asarray(b)[ell_min:n], floor_frac=1e-12)


def get_k_transfer(tr: dict[str, Any]) -> np.ndarray:
    for key in ("k (h/Mpc)", "k [h/Mpc]", "k"):
        if key in tr:
            return np.asarray(tr[key], dtype=float)
    raise KeyError("No k column found in CLASS transfer table: " + ", ".join(tr.keys()))


def plot_results(control: dict[str, Any], vde: dict[str, Any], null: dict[str, Any], tight: dict[str, Any]) -> None:
    ell = np.asarray(vde["lensed"]["ell"])
    m = (ell >= 2) & (ell <= 1200)
    tt_c = np.asarray(control["lensed"]["tt"])
    tt_v = np.asarray(vde["lensed"]["tt"])
    tt_n = np.asarray(null["lensed"]["tt"])
    tt_t = np.asarray(tight["lensed"]["tt"])

    fig, ax = plt.subplots(2, 1, figsize=(8, 8), sharex=True)
    ax[0].plot(ell[m], ell[m] * (ell[m] + 1) * tt_c[m] / (2 * np.pi), label="curved LCDM")
    ax[0].plot(ell[m], ell[m] * (ell[m] + 1) * tt_v[m] / (2 * np.pi), label="canonical VDE")
    ax[0].set_ylabel(r"$\ell(\ell+1)C_\ell^{TT}/2\pi$")
    ax[0].legend()
    ax[0].grid(alpha=.25)
    ratio = np.where(np.abs(tt_c[m]) > 0, tt_v[m] / tt_c[m] - 1.0, np.nan)
    ax[1].plot(ell[m], ratio)
    ax[1].axhline(0, color="k", lw=.7)
    ax[1].set_xlabel(r"$\ell$")
    ax[1].set_ylabel("VDE / control - 1")
    ax[1].grid(alpha=.25)
    fig.tight_layout()
    fig.savefig(OUT / "cmb_tt_vde_vs_control.png", dpi=180)
    plt.close(fig)

    fig, ax = plt.subplots(2, 1, figsize=(8, 8), sharex=True)
    ax[0].loglog(control["k_h"], control["pk"] * H**3, label="curved LCDM")
    ax[0].loglog(vde["k_h"], vde["pk"] * H**3, label="canonical VDE")
    ax[0].set_ylabel(r"$P_{lin}(k)$ [$(\mathrm{Mpc}/h)^3$]")
    ax[0].legend()
    ax[0].grid(alpha=.25, which="both")
    ax[1].semilogx(vde["k_h"], vde["pk"] / control["pk"] - 1.0)
    ax[1].axhline(0, color="k", lw=.7)
    ax[1].set_xlabel(r"$k$ [$h/\mathrm{Mpc}$]")
    ax[1].set_ylabel("VDE / control - 1")
    ax[1].grid(alpha=.25, which="both")
    fig.tight_layout()
    fig.savefig(OUT / "pk_vde_vs_control.png", dpi=180)
    plt.close(fig)

    fig, ax = plt.subplots(2, 1, figsize=(8, 8), sharex=False)
    null_rel = np.where(np.abs(tt_c[m]) > 0, tt_n[m] / tt_c[m] - 1.0, np.nan)
    conv_rel = np.where(np.abs(tt_v[m]) > 0, tt_t[m] / tt_v[m] - 1.0, np.nan)
    ax[0].plot(ell[m], null_rel, label=r"$\Omega_X=10^{-8}$ / control - 1")
    ax[0].plot(ell[m], conv_rel, label="tight / default VDE - 1")
    ax[0].set_xlabel(r"$\ell$")
    ax[0].set_ylabel("TT fractional difference")
    ax[0].legend()
    ax[0].grid(alpha=.25)
    ax[1].semilogx(vde["k_h"], null["pk"] / control["pk"] - 1.0, label="null / control - 1")
    ax[1].semilogx(vde["k_h"], tight["pk"] / vde["pk"] - 1.0, label="tight / default - 1")
    ax[1].set_xlabel(r"$k$ [$h/\mathrm{Mpc}$]")
    ax[1].set_ylabel("P(k) fractional difference")
    ax[1].legend()
    ax[1].grid(alpha=.25, which="both")
    fig.tight_layout()
    fig.savefig(OUT / "null_and_convergence.png", dpi=180)
    plt.close(fig)


def write_mode_ledger() -> dict[str, float]:
    c_km_s = 299792.458
    H0_Mpc_inv = (100.0 * H) / c_km_s
    K = -OMEGA_K * H0_Mpc_inv**2
    sqrtK = math.sqrt(K)
    rows = []
    for n in range(2, 81):
        q = (n + 1) * sqrtK
        k = math.sqrt(n * (n + 2)) * sqrtK
        rows.append((n, q, k, k / H, n * (n + 2) * K))
    with (OUT / "s3_scalar_mode_ledger.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["n", "q_Mpc_inv", "k_Mpc_inv", "k_h_Mpc", "laplacian_eigenvalue_Mpc_inv2"])
        w.writerows(rows)
    return {"H0_Mpc_inv": H0_Mpc_inv, "K_Mpc_inv2": K, "sqrtK_Mpc_inv": sqrtK}


def main() -> int:
    class_dir = Path(os.environ.get("CLASS_DIR", "class_public"))
    precision_path = class_dir / "cl_permille.pre"
    tight_precision = parse_precision_file(precision_path)

    mode_meta = write_mode_ledger()

    print("[1/4] curved LCDM control")
    control = run_model("control", control_params())
    print("[2/4] fiducial canonical VDE")
    vde = run_model("vde", with_vde(OMEGA_X_FID))
    print("[3/4] null-limit canonical VDE")
    null = run_model("null", with_vde(OMEGA_X_NULL))
    print("[4/4] tight-precision canonical VDE")
    tight = run_model("vde_tight", with_vde(OMEGA_X_FID), tight_precision)

    required = {"k (h/Mpc)", "d_fld", "t_fld", "phi", "psi"}
    missing = sorted(required.difference(vde["transfer"].keys()))

    ktr = get_k_transfer(vde["transfer"])
    expected_kmin_h = math.sqrt(8.0 * mode_meta["K_Mpc_inv2"]) / H
    actual_kmin_h = float(np.min(ktr))
    kmin_rel = abs(actual_kmin_h / expected_kmin_h - 1.0)

    metrics = {
        "pinned_class_commit": PINNED_CLASS_COMMIT,
        "classy_version": vde["derived"].get("classy_version"),
        "physical_parameters": {
            "Omega_X_fiducial": OMEGA_X_FID,
            "Omega_X_null": OMEGA_X_NULL,
            "Omega_k_geom": OMEGA_K,
            "h": H,
            "l_max": L_MAX,
        },
        "vde_vs_control": {
            "TT_l30_1000": ell_window_stats(vde["lensed"]["tt"], control["lensed"]["tt"]),
            "EE_l30_1000": ell_window_stats(vde["lensed"]["ee"], control["lensed"]["ee"]),
            "Pk": rel_stats(vde["pk"], control["pk"]),
            "sigma8_control": control["derived"]["sigma8"],
            "sigma8_vde": vde["derived"]["sigma8"],
        },
        "null_limit": {
            "TT_l30_1000": ell_window_stats(null["lensed"]["tt"], control["lensed"]["tt"]),
            "EE_l30_1000": ell_window_stats(null["lensed"]["ee"], control["lensed"]["ee"]),
            "Pk": rel_stats(null["pk"], control["pk"]),
        },
        "convergence_default_vs_cl_permille": {
            "TT_l30_1000": ell_window_stats(tight["lensed"]["tt"], vde["lensed"]["tt"]),
            "EE_l30_1000": ell_window_stats(tight["lensed"]["ee"], vde["lensed"]["ee"]),
            "Pk": rel_stats(tight["pk"], vde["pk"]),
        },
        "closed_s3_mode_check": {
            "expected_first_physical_scalar_k_h_Mpc": expected_kmin_h,
            "actual_transfer_min_k_h_Mpc": actual_kmin_h,
            "relative_difference": kmin_rel,
        },
        "transfer_columns": {
            "required": sorted(required),
            "missing": missing,
            "available": sorted(vde["transfer"].keys()),
        },
        "derived": {
            "control": control["derived"],
            "vde": vde["derived"],
            "null": null["derived"],
            "vde_tight": tight["derived"],
        },
    }

    checks = {
        "class_version_is_3_3_4": str(metrics["classy_version"]).startswith("3.3.4"),
        "vde_transfer_columns_present": len(missing) == 0,
        "vde_Omega_fld_matches": abs(vde["derived"]["Omega_fld"] - OMEGA_X_FID) < 1e-10,
        "closed_mode_kmin_matches_n2": kmin_rel < 5e-3,
        "null_TT_max_rel_lt_1e-4": metrics["null_limit"]["TT_l30_1000"]["max"] < 1e-4,
        "null_Pk_max_rel_lt_1e-4": metrics["null_limit"]["Pk"]["max"] < 1e-4,
        "convergence_TT_p95_lt_5e-3": metrics["convergence_default_vs_cl_permille"]["TT_l30_1000"]["p95"] < 5e-3,
        "convergence_Pk_p95_lt_5e-3": metrics["convergence_default_vs_cl_permille"]["Pk"]["p95"] < 5e-3,
    }
    metrics["checks"] = checks
    metrics["all_checks_pass"] = all(checks.values())

    (OUT / "validation_summary.json").write_text(json.dumps(metrics, indent=2, sort_keys=True) + "\n")
    with (OUT / "validation_checks.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["check", "pass"])
        for k, v in checks.items():
            w.writerow([k, int(v)])

    plot_results(control, vde, null, tight)

    print(json.dumps(metrics, indent=2, sort_keys=True))
    print("ALL_CHECKS_PASS=", metrics["all_checks_pass"])
    return 0 if metrics["all_checks_pass"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
