import Mathlib
import ScaleNexus

/-!
# HCC Scale Nexus — Frontier II: the allowed masses, the group of dilations, both S³ branches, the horizon bound,
and the propagation of covariances. Mathematics only; nothing here is evidence for a physical model.
-/

noncomputable section

namespace HCC.ScaleNexus

open Real

/-! ## 13. The masses a radius can hold: C ≤ 1 and Q ≤ 1 -/

/-- At radius r > 0, a positive mass satisfies C ≤ 1 and Q ≤ 1 exactly when 1/r ≤ m ≤ r/2. -/
theorem allowed_masses (m r : ℝ) (hm : 0 < m) (hr : 0 < r) :
    (compactness m r ≤ 1 ∧ quantum m r ≤ 1) ↔ (1 / r ≤ m ∧ m ≤ r / 2) := by
  unfold compactness quantum
  rw [div_le_one hr, div_le_one (mul_pos hm hr), div_le_iff₀ hr]
  constructor
  · rintro ⟨h1, h2⟩; exact ⟨by linarith, by linarith⟩
  · rintro ⟨h1, h2⟩; exact ⟨by linarith, by linarith⟩

/-- … and that interval is nonempty exactly when r ≥ √2, i.e. r² ≥ 2. -/
theorem allowed_nonempty (r : ℝ) (hr : 0 < r) :
    (∃ m, 0 < m ∧ compactness m r ≤ 1 ∧ quantum m r ≤ 1) ↔ 2 ≤ r ^ 2 := by
  constructor
  · rintro ⟨m, hm, h⟩
    obtain ⟨h1, h2⟩ := (allowed_masses m r hm hr).1 h
    have : 1 / r ≤ r / 2 := le_trans h1 h2
    rw [div_le_div_iff₀ hr (by norm_num)] at this; nlinarith
  · intro h
    refine ⟨1 / r, by positivity, (allowed_masses _ r (by positivity) hr).2 ⟨le_rfl, ?_⟩⟩
    rw [div_le_div_iff₀ hr (by norm_num)]; nlinarith

/-! ## 14. Exactly one positive crossing of C = 1 and Q = 1 -/

theorem crossing_unique : ∃! p : ℝ × ℝ, 0 < p.1 ∧ 0 < p.2 ∧ compactness p.1 p.2 = 1 ∧ quantum p.1 p.2 = 1 := by
  have h2 : (0:ℝ) < Real.sqrt 2 := Real.sqrt_pos.2 (by norm_num)
  have hs : Real.sqrt 2 * Real.sqrt 2 = 2 := Real.mul_self_sqrt (by norm_num)
  refine ⟨(1 / Real.sqrt 2, Real.sqrt 2), ⟨by positivity, h2, ?_, ?_⟩, ?_⟩
  · unfold compactness; field_simp
  · unfold quantum; field_simp
  · rintro ⟨m, r⟩ ⟨hm, hr, hc, hq⟩
    obtain ⟨e1, e2⟩ := crossing m r hm hr hc hq
    simp only [Prod.mk.injEq]; exact ⟨e2, e1⟩

/-! ## 15. The dilations form a group, and C^{p+1} Q^{p−1} is their invariant -/

/-- the dilation of exponent p by s: (M, R) ↦ (s^p M, s R) -/
def dil (s p : ℝ) (x : ℝ × ℝ) : ℝ × ℝ := (s ^ p * x.1, s * x.2)

theorem dil_one (p : ℝ) (x : ℝ × ℝ) : dil 1 p x = x := by
  simp [dil]

theorem dil_comp (s t p : ℝ) (hs : 0 < s) (ht : 0 < t) (x : ℝ × ℝ) : dil s p (dil t p x) = dil (s * t) p x := by
  simp only [dil, Prod.mk.injEq]
  constructor
  · rw [Real.mul_rpow hs.le ht.le]; ring
  · ring

theorem dil_inv (s p : ℝ) (hs : 0 < s) (x : ℝ × ℝ) : dil s⁻¹ p (dil s p x) = x := by
  rw [dil_comp _ _ _ (inv_pos.2 hs) hs, inv_mul_cancel₀ hs.ne', dil_one]

/-- under a dilation of exponent p, C^{p+1}·Q^{p−1} does not change -/
theorem dilation_invariant (s p m r : ℝ) (hs : 0 < s) (hm : 0 < m) (hr : 0 < r) :
    (compactness (s ^ p * m) (s * r)) ^ (p + 1) * (quantum (s ^ p * m) (s * r)) ^ (p - 1)
      = (compactness m r) ^ (p + 1) * (quantum m r) ^ (p - 1) := by
  obtain ⟨hc, hq, -⟩ := dilation s p m r hs hm.ne' hr.ne'
  have hC : 0 < compactness m r := by unfold compactness; positivity
  have hQ : 0 < quantum m r := by unfold quantum; positivity
  rw [hc, hq, Real.mul_rpow (Real.rpow_nonneg hs.le _) hC.le, Real.mul_rpow (Real.rpow_nonneg hs.le _) hQ.le,
    ← Real.rpow_mul hs.le, ← Real.rpow_mul hs.le]
  have e : s ^ ((p - 1) * (p + 1)) * s ^ ((-p - 1) * (p - 1)) = 1 := by
    rw [← Real.rpow_add hs]; ring_nf; simp
  calc s ^ ((p - 1) * (p + 1)) * compactness m r ^ (p + 1) * (s ^ ((-p - 1) * (p - 1)) * quantum m r ^ (p - 1))
      = (s ^ ((p - 1) * (p + 1)) * s ^ ((-p - 1) * (p - 1))) * (compactness m r ^ (p + 1) * quantum m r ^ (p - 1)) := by ring
    _ = _ := by rw [e, one_mul]

/-! ## 16. Both branches of S³, and the volume increasing along χ -/

/-- the two geodesic distances of one areal radius add up to half a great circle -/
theorem branches_geodesic (A χ : ℝ) : A * χ + A * (Real.pi - χ) = Real.pi * A := by ring

/-- the volume of the cap increases strictly with χ on [0, π] -/
theorem capVolume_strictMono (A : ℝ) (hA : 0 < A) : StrictMonoOn (capVolume A) (Set.Icc 0 Real.pi) := by
  apply strictMonoOn_of_deriv_pos (convex_Icc 0 Real.pi)
  · exact fun x _ => (capVolume_deriv A x).continuousAt.continuousWithinAt
  · intro x hx
    rw [interior_Icc] at hx
    rw [(capVolume_deriv A x).deriv]
    have : 0 < Real.sin x := Real.sin_pos_of_pos_of_lt_pi hx.1 hx.2
    positivity

/-- on the near branch (χ < π/2) the cap holds less volume than its far twin, though both bound the same area -/
theorem near_lt_far (A χ : ℝ) (hA : 0 < A) (h0 : 0 ≤ χ) (h1 : χ < Real.pi / 2) :
    capVolume A χ < capVolume A (Real.pi - χ) ∧ arealRadius A χ = arealRadius A (Real.pi - χ) := by
  refine ⟨capVolume_strictMono A hA ⟨h0, by linarith [Real.pi_pos]⟩ ⟨by linarith [Real.pi_pos], by linarith⟩ (by linarith), (areal_symmetric A χ).symm⟩

/-! ## 17. The apparent horizon lies inside the curvature radius for every closed slice -/

/-- with R_A = R_H/√(1 − Ω_K) and A = R_H/√(−Ω_K), Ω_K < 0: R_A/A = √(−Ω_K/(1 − Ω_K)) < 1 -/
theorem apparent_lt_curvature (RH ΩK : ℝ) (hRH : 0 < RH) (hK : ΩK < 0) :
    RH / Real.sqrt (1 - ΩK) < RH / Real.sqrt (-ΩK) := by
  apply div_lt_div_of_pos_left hRH (Real.sqrt_pos.2 (by linarith))
  exact Real.sqrt_lt_sqrt (by linarith) (by linarith)

/-! ## 18. How covariances move through the log coordinates -/

/-- (a, b) = k·(ln M − ln R, −ln M − ln R), k = 1/ln 10. With Σ the covariance of (ln M, ln R), J Σ Jᵀ is the
covariance of (a, b) — the kernel's σ_a² = k²(σ_M² + σ_R² − 2c), σ_b² = k²(σ_M² + σ_R² + 2c), cov = k²(σ_R² − σ_M²). -/
theorem covariance_propagation (k sM sR c : ℝ) :
    let J : Matrix (Fin 2) (Fin 2) ℝ := !![k, -k; -k, -k]
    let S : Matrix (Fin 2) (Fin 2) ℝ := !![sM ^ 2, c; c, sR ^ 2]
    J * S * J.transpose = !![k ^ 2 * (sM ^ 2 + sR ^ 2 - 2 * c), k ^ 2 * (sR ^ 2 - sM ^ 2); k ^ 2 * (sR ^ 2 - sM ^ 2), k ^ 2 * (sM ^ 2 + sR ^ 2 + 2 * c)] := by
  intro J S
  ext i j; fin_cases i <;> fin_cases j <;> simp [J, S, Matrix.mul_apply, Fin.sum_univ_two] <;> ring

/-- and G, uncorrelated with the measurements, enters (a, b) through the column (k, 0): it adds k²σ_G² to σ_a² and
nothing to σ_b² or to cov(a, b) — Q holds no G -/
theorem covariance_with_G (k sM sR c sG : ℝ) :
    let J : Matrix (Fin 2) (Fin 3) ℝ := !![k, -k, k; -k, -k, 0]
    let S : Matrix (Fin 3) (Fin 3) ℝ := !![sM ^ 2, c, 0; c, sR ^ 2, 0; 0, 0, sG ^ 2]
    J * S * J.transpose = !![k ^ 2 * (sM ^ 2 + sR ^ 2 - 2 * c) + k ^ 2 * sG ^ 2, k ^ 2 * (sR ^ 2 - sM ^ 2); k ^ 2 * (sR ^ 2 - sM ^ 2), k ^ 2 * (sM ^ 2 + sR ^ 2 + 2 * c)] := by
  intro J S
  ext i j; fin_cases i <;> fin_cases j <;> simp [J, S, Matrix.mul_apply, Fin.sum_univ_succ] <;> ring

end HCC.ScaleNexus

end
