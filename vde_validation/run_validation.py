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
NULL_EPS = (1.0e-4, 1.0e-6, 1.0e-8)
OMEGA_K = -0.01
H = 0.674
L_MAX = 1200
PK_MAX_HMPC = 1.5

# Validation tolerances are declared before execution.  The null test is judged
# at common tight precision and with a robust 95th-percentile metric; isolated
# k-samples are also reported but are not used to hide numerical outliers.
TOL = {
    "mode_kmin_rel": 5.0e-3,
    "null_TT_p95": 2.0e-5,
    "null_EE_p95": 2.0e-5,
    "null_Pk_p95": 5.0e-4,
    "convergence_TT_p95": 5.0e-3,
    "convergence_EE_p95": 5.0e-3,
    "convergence_Pk_p95": 5.0e-3,
}


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
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key:
            d[key] = value
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


def run_model(
    name: str,
    params: dict[str, Any],
    precision: dict[str, Any] | None = None,
    save_background: bool = False,
) -> dict[str, Any]:
    c = Class()
    try:
        c.set(params)
        if precision:
            c.set(precision)
        c.compute()

        lensed = c.lensed_cl(L_MAX)
        raw = c.raw_cl(L_MAX)
        transfer = c.get_transfer(0.0)
        background = c.get_background() if save_background else None

        k_h = np.geomspace(1.0e-4, 1.0, 180)
        pkfun = getattr(c, "pk_lin", None) or c.pk
        pk = np.array([pkfun(float(k * H), 0.0) for k in k_h], dtype=float)

        import classy
        derived: dict[str, Any] = {
            "classy_version": getattr(classy, "__version__", "unknown"),
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
        save_columns(OUT / f"{name}_transfer_z0.csv", transfer)
        if background is not None:
            save_columns(OUT / f"{name}_background.csv", background)
        save_pk(OUT / f"{name}_pk_z0.csv", k_h, pk)
        (OUT / f"{name}_derived.json").write_text(json.dumps(derived, indent=2, sort_keys=True) + "\n")
        (OUT / f"{name}_params.json").write_text(json.dumps(params, indent=2, sort_keys=True) + "\n")

        return {
            "lensed": {k: np.asarray(v) for k, v in lensed.items()},
            "raw": {k: np.asarray(v) for k, v in raw.items()},
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


def rel_stats(a: np.ndarray, b: np.ndarray, floor_frac: float = 1.0e-10) -> dict[str, float]:
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    scale = max(float(np.nanmax(np.abs(b))), 1.0e-300)
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
    return rel_stats(np.asarray(a)[ell_min:n], np.asarray(b)[ell_min:n], floor_frac=1.0e-12)


def get_k_transfer(tr: dict[str, Any]) -> np.ndarray:
    for key in ("k (h/Mpc)", "k [h/Mpc]", "k"):
        if key in tr:
            return np.asarray(tr[key], dtype=float)
    raise KeyError("No k column found in CLASS transfer table: " + ", ".join(tr.keys()))


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


def plot_vde_vs_control(control: dict[str, Any], vde: dict[str, Any]) -> None:
    ell = np.asarray(vde["lensed"]["ell"])
    mask = (ell >= 2) & (ell <= L_MAX)
    tt_c = np.asarray(control["lensed"]["tt"])
    tt_v = np.asarray(vde["lensed"]["tt"])

    fig, ax = plt.subplots(2, 1, figsize=(8, 8), sharex=True)
    ax[0].plot(ell[mask], ell[mask] * (ell[mask] + 1) * tt_c[mask] / (2 * np.pi), label="curved LCDM")
    ax[0].plot(ell[mask], ell[mask] * (ell[mask] + 1) * tt_v[mask] / (2 * np.pi), label="canonical VDE")
    ax[0].set_ylabel(r"$\ell(\ell+1)C_\ell^{TT}/2\pi$")
    ax[0].legend()
    ax[0].grid(alpha=.25)
    ax[1].plot(ell[mask], tt_v[mask] / tt_c[mask] - 1.0)
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


def plot_validation(
    control: dict[str, Any],
    vde: dict[str, Any],
    control_tight: dict[str, Any],
    vde_tight: dict[str, Any],
    nulls: dict[float, dict[str, Any]],
) -> None:
    ell = np.asarray(vde["lensed"]["ell"])
    mask = (ell >= 30) & (ell <= 1000)
    tt_ct = np.asarray(control_tight["lensed"]["tt"])
    tt_v = np.asarray(vde["lensed"]["tt"])
    tt_vt = np.asarray(vde_tight["lensed"]["tt"])

    fig, ax = plt.subplots(2, 1, figsize=(8, 8))
    for eps in NULL_EPS:
        tt_n = np.asarray(nulls[eps]["lensed"]["tt"])
        ax[0].plot(ell[mask], tt_n[mask] / tt_ct[mask] - 1.0, label=fr"$\Omega_X={eps:.0e}$")
    ax[0].set_ylabel("null / tight control - 1")
    ax[0].set_xlabel(r"$\ell$")
    ax[0].legend()
    ax[0].grid(alpha=.25)
    ax[1].plot(ell[mask], tt_vt[mask] / tt_v[mask] - 1.0, label="VDE tight/default")
    ax[1].plot(ell[mask], np.asarray(control_tight["lensed"]["tt"])[mask] / np.asarray(control["lensed"]["tt"])[mask] - 1.0, label="control tight/default")
    ax[1].set_ylabel("precision shift")
    ax[1].set_xlabel(r"$\ell$")
    ax[1].legend()
    ax[1].grid(alpha=.25)
    fig.tight_layout()
    fig.savefig(OUT / "null_and_convergence_tt.png", dpi=180)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(8, 5))
    for eps in NULL_EPS:
        ax.semilogx(nulls[eps]["k_h"], nulls[eps]["pk"] / control_tight["pk"] - 1.0, label=fr"$\Omega_X={eps:.0e}$")
    ax.axhline(0, color="k", lw=.7)
    ax.set_xlabel(r"$k$ [$h/\mathrm{Mpc}$]")
    ax.set_ylabel("null / tight control - 1")
    ax.legend()
    ax.grid(alpha=.25, which="both")
    fig.tight_layout()
    fig.savefig(OUT / "null_limit_pk.png", dpi=180)
    plt.close(fig)


def main() -> int:
    class_dir = Path(os.environ.get("CLASS_DIR", "class_public"))
    tight_precision = parse_precision_file(class_dir / "cl_permille.pre")
    mode_meta = write_mode_ledger()

    print("[1/7] curved LCDM control, default precision")
    control = run_model("control", control_params(), save_background=True)
    print("[2/7] fiducial canonical VDE, default precision")
    vde = run_model("vde", with_vde(OMEGA_X_FID), save_background=True)
    print("[3/7] curved LCDM control, cl_permille precision")
    control_tight = run_model("control_tight", control_params(), tight_precision)
    print("[4/7] fiducial canonical VDE, cl_permille precision")
    vde_tight = run_model("vde_tight", with_vde(OMEGA_X_FID), tight_precision)

    nulls: dict[float, dict[str, Any]] = {}
    for i, eps in enumerate(NULL_EPS, start=5):
        print(f"[{i}/7] null-limit Omega_X={eps:.0e}, cl_permille precision")
        nulls[eps] = run_model(f"null_{eps:.0e}", with_vde(eps), tight_precision, save_background=(eps == NULL_EPS[-1]))

    required = {"k (h/Mpc)", "d_fld", "t_fld", "phi", "psi"}
    missing = sorted(required.difference(vde["transfer"].keys()))

    ktr = get_k_transfer(vde["transfer"])
    expected_kmin_h = math.sqrt(8.0 * mode_meta["K_Mpc_inv2"]) / H
    actual_kmin_h = float(np.min(ktr))
    kmin_rel = abs(actual_kmin_h / expected_kmin_h - 1.0)

    version = str(vde["derived"].get("classy_version", ""))
    version_ok = version.lstrip("v").startswith("3.3.4")

    null_metrics: dict[str, Any] = {}
    for eps in NULL_EPS:
        n = nulls[eps]
        null_metrics[f"{eps:.0e}"] = {
            "TT_l30_1000": ell_window_stats(n["lensed"]["tt"], control_tight["lensed"]["tt"]),
            "EE_l30_1000": ell_window_stats(n["lensed"]["ee"], control_tight["lensed"]["ee"]),
            "Pk": rel_stats(n["pk"], control_tight["pk"]),
            "sigma8": n["derived"]["sigma8"],
        }

    null_final = null_metrics[f"{NULL_EPS[-1]:.0e}"]
    null_coarse = null_metrics[f"{NULL_EPS[0]:.0e}"]

    convergence = {
        "control": {
            "TT_l30_1000": ell_window_stats(control_tight["lensed"]["tt"], control["lensed"]["tt"]),
            "EE_l30_1000": ell_window_stats(control_tight["lensed"]["ee"], control["lensed"]["ee"]),
            "Pk": rel_stats(control_tight["pk"], control["pk"]),
        },
        "vde": {
            "TT_l30_1000": ell_window_stats(vde_tight["lensed"]["tt"], vde["lensed"]["tt"]),
            "EE_l30_1000": ell_window_stats(vde_tight["lensed"]["ee"], vde["lensed"]["ee"]),
            "Pk": rel_stats(vde_tight["pk"], vde["pk"]),
        },
    }

    metrics: dict[str, Any] = {
        "pinned_class_commit": PINNED_CLASS_COMMIT,
        "classy_version": version,
        "tolerances_declared": TOL,
        "physical_parameters": {
            "Omega_X_fiducial": OMEGA_X_FID,
            "Omega_X_null_sequence": list(NULL_EPS),
            "Omega_k_geom": OMEGA_K,
            "h": H,
            "l_max": L_MAX,
        },
        "vde_vs_control_default": {
            "TT_l30_1000": ell_window_stats(vde["lensed"]["tt"], control["lensed"]["tt"]),
            "EE_l30_1000": ell_window_stats(vde["lensed"]["ee"], control["lensed"]["ee"]),
            "Pk": rel_stats(vde["pk"], control["pk"]),
            "sigma8_control": control["derived"]["sigma8"],
            "sigma8_vde": vde["derived"]["sigma8"],
        },
        "null_limit_common_tight_precision": null_metrics,
        "convergence_default_vs_cl_permille": convergence,
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
            "control_tight": control_tight["derived"],
            "vde_tight": vde_tight["derived"],
            "null_1e-8_tight": nulls[NULL_EPS[-1]]["derived"],
        },
    }

    checks = {
        "class_version_is_3_3_4": version_ok,
        "vde_transfer_columns_present": len(missing) == 0,
        "vde_Omega_fld_matches": abs(vde["derived"]["Omega_fld"] - OMEGA_X_FID) < 1.0e-10,
        "closed_mode_kmin_matches_n2": kmin_rel < TOL["mode_kmin_rel"],
        "null_TT_p95_below_declared_tol": null_final["TT_l30_1000"]["p95"] < TOL["null_TT_p95"],
        "null_EE_p95_below_declared_tol": null_final["EE_l30_1000"]["p95"] < TOL["null_EE_p95"],
        "null_Pk_p95_below_declared_tol": null_final["Pk"]["p95"] < TOL["null_Pk_p95"],
        "null_TT_contracts_from_1e-4_to_1e-8": null_final["TT_l30_1000"]["p95"] < null_coarse["TT_l30_1000"]["p95"],
        "null_Pk_contracts_from_1e-4_to_1e-8": null_final["Pk"]["p95"] < null_coarse["Pk"]["p95"],
        "control_convergence_TT_p95": convergence["control"]["TT_l30_1000"]["p95"] < TOL["convergence_TT_p95"],
        "control_convergence_EE_p95": convergence["control"]["EE_l30_1000"]["p95"] < TOL["convergence_EE_p95"],
        "control_convergence_Pk_p95": convergence["control"]["Pk"]["p95"] < TOL["convergence_Pk_p95"],
        "vde_convergence_TT_p95": convergence["vde"]["TT_l30_1000"]["p95"] < TOL["convergence_TT_p95"],
        "vde_convergence_EE_p95": convergence["vde"]["EE_l30_1000"]["p95"] < TOL["convergence_EE_p95"],
        "vde_convergence_Pk_p95": convergence["vde"]["Pk"]["p95"] < TOL["convergence_Pk_p95"],
    }
    metrics["checks"] = checks
    metrics["all_checks_pass"] = all(checks.values())

    (OUT / "validation_summary.json").write_text(json.dumps(metrics, indent=2, sort_keys=True) + "\n")
    with (OUT / "validation_checks.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["check", "pass"])
        for key, value in checks.items():
            w.writerow([key, int(value)])

    plot_vde_vs_control(control, vde)
    plot_validation(control, vde, control_tight, vde_tight, nulls)

    print(json.dumps(metrics, indent=2, sort_keys=True))
    print("ALL_CHECKS_PASS=", metrics["all_checks_pass"])
    return 0 if metrics["all_checks_pass"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
