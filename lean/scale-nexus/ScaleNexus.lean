import Mathlib

/-!
# HCC Scale Nexus — the algebraic and analytic layer

What is proved here is mathematics about the coordinates the atlas uses: identities, inverses, covariance laws,
the geometry of a round 3-sphere and one algebraic identity of the Friedmann equations. Nothing here proves a
physical model: general relativity is not formalised, and the Friedmann relation enters only as a hypothesis
(`hρ` below). Every exported statement is followed by `#print axioms`; the build log is audited for anything
beyond `propext`, `Classical.choice`, `Quot.sound`.
-/

noncomputable section

namespace HCC.ScaleNexus

open Real

/-! ## 1. Compactness and the quantum coordinate (Planck-normalised) -/

/-- C = 2m/r: the Schwarzschild radius over the radius, in Planck units. -/
def compactness (m r : ℝ) : ℝ := 2 * m / r
/-- Q = 1/(m r): the reduced Compton length over the radius, in Planck units. -/
def quantum (m r : ℝ) : ℝ := 1 / (m * r)

theorem product (m r : ℝ) (hm : m ≠ 0) (hr : r ≠ 0) :
    compactness m r * quantum m r = 2 / r ^ 2 := by
  unfold compactness quantum; field_simp; ring

theorem ratio (m r : ℝ) (hr : r ≠ 0) :
    compactness m r / quantum m r = 2 * m ^ 2 := by
  unfold compactness quantum; field_simp; ring

/-! ## 2. The exact bridge from SI to Planck-normalised values -/

/-- With ℓ_P = √(ħG/c³) and m_P = √(ħc/G), 2GM/(Rc²) and ħ/(MRc) are exactly the normalised C and Q. -/
theorem si_bridge (hbar G c M R : ℝ) (hh : 0 < hbar) (hG : 0 < G) (hc : 0 < c) (hM : 0 < M) (hR : 0 < R) :
    let lP := Real.sqrt (hbar * G / c ^ 3)
    let mP := Real.sqrt (hbar * c / G)
    2 * G * M / (R * c ^ 2) = compactness (M / mP) (R / lP) ∧
    hbar / (M * R * c) = quantum (M / mP) (R / lP) := by
  intro lP mP
  have hl : 0 < lP := Real.sqrt_pos.2 (by positivity)
  have hmP : 0 < mP := Real.sqrt_pos.2 (by positivity)
  have hprod : mP * lP = hbar / c := by
    have : mP * lP = Real.sqrt (hbar * c / G * (hbar * G / c ^ 3)) := by
      rw [Real.sqrt_mul (by positivity)]
    rw [this]
    have e : hbar * c / G * (hbar * G / c ^ 3) = (hbar / c) ^ 2 := by field_simp; ring
    rw [e, Real.sqrt_sq (by positivity)]
  have hquot : lP / mP = G / c ^ 2 := by
    have : lP / mP = Real.sqrt (hbar * G / c ^ 3 / (hbar * c / G)) := by
      rw [Real.sqrt_div' _ (by positivity)]
    rw [this]
    have e : hbar * G / c ^ 3 / (hbar * c / G) = (G / c ^ 2) ^ 2 := by field_simp; ring
    rw [e, Real.sqrt_sq (by positivity)]
  constructor
  · unfold compactness
    have hl' : lP = G / c ^ 2 * mP := (div_eq_iff hmP.ne').1 hquot
    rw [hl']; field_simp; ring
  · unfold quantum
    have hm' : mP = hbar / c / lP := by rw [eq_div_iff hl.ne']; exact hprod
    rw [hm']; field_simp; ring

/-! ## 3. The logarithmic coordinates and their exact inverse -/

def aCoord (u v k : ℝ) : ℝ := k + u - v
def bCoord (u v : ℝ) : ℝ := -u - v
def invU (a b k : ℝ) : ℝ := (a - b - k) / 2
def invV (a b k : ℝ) : ℝ := (k - a - b) / 2

theorem left_u (u v k : ℝ) : invU (aCoord u v k) (bCoord u v) k = u := by unfold invU aCoord bCoord; ring
theorem left_v (u v k : ℝ) : invV (aCoord u v k) (bCoord u v) k = v := by unfold invV aCoord bCoord; ring
theorem right_a (a b k : ℝ) : aCoord (invU a b k) (invV a b k) k = a := by unfold aCoord invU invV; ring
theorem right_b (a b k : ℝ) : bCoord (invU a b k) (invV a b k) = b := by unfold bCoord invU invV; ring
theorem product_log (u v k : ℝ) : aCoord u v k + bCoord u v = k - 2 * v := by unfold aCoord bCoord; ring
theorem ratio_log (u v k : ℝ) : aCoord u v k - bCoord u v = k + 2 * u := by unfold aCoord bCoord; ring

/-- The coordinates are what logarithms of C and Q are, on the positive domain, in any base (Mathlib's logb needs no hypothesis on b for these identities). -/
theorem log_coordinates (b m r : ℝ) (hm : 0 < m) (hr : 0 < r) :
    Real.logb b (compactness m r) = aCoord (Real.logb b m) (Real.logb b r) (Real.logb b 2) ∧
    Real.logb b (quantum m r) = bCoord (Real.logb b m) (Real.logb b r) := by
  unfold compactness quantum aCoord bCoord
  constructor
  · rw [Real.logb_div (by positivity) hr.ne', Real.logb_mul (by norm_num) hm.ne']
  · rw [one_div, Real.logb_inv, Real.logb_mul hm.ne' hr.ne']; ring

/-- A constant Euclidean-equivalent density is the line 2a + b = const: u − 3v = 2a + b − 2k. -/
theorem density_line (u v k : ℝ) : u - 3 * v = 2 * aCoord u v k + bCoord u v - 2 * k := by
  unfold aCoord bCoord; ring

/-! ## 4. The rung of a length, in any base b > 1, and its exact inverse -/

def level (b ℓ R : ℝ) : ℝ := Real.logb b (R / ℓ)
def radius (b ℓ N : ℝ) : ℝ := ℓ * b ^ N

theorem radius_level (b ℓ R : ℝ) (hb : 1 < b) (hℓ : 0 < ℓ) (hR : 0 < R) : radius b ℓ (level b ℓ R) = R := by
  unfold radius level
  rw [Real.rpow_logb (by linarith) (by linarith) (by positivity)]; field_simp

theorem level_radius (b ℓ N : ℝ) (hb : 1 < b) (hℓ : 0 < ℓ) : level b ℓ (radius b ℓ N) = N := by
  unfold radius level
  rw [mul_div_cancel_left₀ _ hℓ.ne', Real.logb_rpow (by linarith) (by linarith)]

/-- Changing the base relabels the same length: N_b · log b is independent of b. -/
theorem relabel (b₁ b₂ ℓ R : ℝ) (h₁ : 1 < b₁) (h₂ : 1 < b₂) :
    level b₁ ℓ R * Real.log b₁ = level b₂ ℓ R * Real.log b₂ := by
  unfold level Real.logb
  have : Real.log b₁ ≠ 0 := (Real.log_pos h₁).ne'
  have : Real.log b₂ ≠ 0 := (Real.log_pos h₂).ne'
  field_simp

/-- The golden rung read off the log-coordinates: (k − a − b)/(2 log φ) = N. -/
theorem golden_log_bridge (N logBase k a b : ℝ) (h : a + b = k - 2 * N * logBase) (hb : logBase ≠ 0) :
    (k - a - b) / (2 * logBase) = N := by
  rw [div_eq_iff (mul_ne_zero two_ne_zero hb)]; linarith

/-! ## 5. Where the two lines cross -/

theorem horizon_normalized (r : ℝ) (hr : r ≠ 0) : compactness (r / 2) r = 1 := by
  unfold compactness; field_simp

theorem crossing_squared (m r : ℝ) (hr : r ≠ 0) (hc : compactness m r = 1) (hq : quantum m r = 1) :
    r ^ 2 = 2 ∧ m ^ 2 = 1 / 2 := by
  have hm : m ≠ 0 := by intro hz; simp [quantum, hz] at hq
  have hp := product m r hm hr
  have hq' := ratio m r hr
  rw [hc, hq] at hp hq'
  constructor
  · field_simp at hp; linarith
  · norm_num at hq'; linarith

/-- On the positive quadrant the crossing is exactly (m, r) = (1/√2, √2) — not (1, 1). -/
theorem crossing (m r : ℝ) (hm : 0 < m) (hr : 0 < r) (hc : compactness m r = 1) (hq : quantum m r = 1) :
    r = Real.sqrt 2 ∧ m = 1 / Real.sqrt 2 := by
  obtain ⟨h1, h2⟩ := crossing_squared m r hr.ne' hc hq
  constructor
  · rw [← h1, Real.sqrt_sq hr.le]
  · have : m = Real.sqrt (1 / 2) := by rw [← h2, Real.sqrt_sq hm.le]
    rw [this, Real.sqrt_div' _ (by norm_num : (0:ℝ) ≤ 2), Real.sqrt_one]

/-! ## 6. Dilation covariance: R ↦ sR, M ↦ s^p M -/

def density (m r : ℝ) : ℝ := 3 * m / (4 * Real.pi * r ^ 3)

theorem dilation (s p m r : ℝ) (hs : 0 < s) (hm : m ≠ 0) (hr : r ≠ 0) :
    compactness (s ^ p * m) (s * r) = s ^ (p - 1) * compactness m r ∧
    quantum (s ^ p * m) (s * r) = s ^ (-p - 1) * quantum m r ∧
    density (s ^ p * m) (s * r) = s ^ (p - 3) * density m r := by
  have hs0 : s ≠ 0 := hs.ne'
  have e1 : s ^ (p - 1) = s ^ p / s := by rw [Real.rpow_sub hs, Real.rpow_one]
  have e2 : s ^ (-p - 1) = 1 / (s ^ p * s) := by
    rw [Real.rpow_sub hs, Real.rpow_neg hs.le, Real.rpow_one]; field_simp
  have e3 : s ^ (p - 3) = s ^ p / s ^ 3 := by
    rw [Real.rpow_sub hs]; norm_cast
  have hsp : s ^ p ≠ 0 := (Real.rpow_pos_of_pos hs p).ne'
  unfold compactness quantum density
  refine ⟨?_, ?_, ?_⟩
  · rw [e1]; field_simp; ring
  · rw [e2]; field_simp; ring
  · rw [e3]; field_simp; ring

/-! ## 7. A round 3-sphere of curvature radius A: three lengths, one volume -/

/-- the areal radius of the 2-sphere at geodesic distance D = Aχ -/
def arealRadius (A χ : ℝ) : ℝ := A * Real.sin χ
/-- the proper volume of the cap χ' ≤ χ -/
def capVolume (A χ : ℝ) : ℝ := 2 * Real.pi * A ^ 3 * (χ - Real.sin (2 * χ) / 2)

/-- χ and π − χ share the areal radius: an area does not determine a point. -/
theorem areal_symmetric (A χ : ℝ) : arealRadius A (Real.pi - χ) = arealRadius A χ := by
  unfold arealRadius; rw [Real.sin_pi_sub]

/-- and their caps are complements: V(χ) + V(π − χ) = 2π²A³, the whole sphere. -/
theorem cap_complement (A χ : ℝ) : capVolume A χ + capVolume A (Real.pi - χ) = 2 * Real.pi ^ 2 * A ^ 3 := by
  unfold capVolume
  have : Real.sin (2 * (Real.pi - χ)) = - Real.sin (2 * χ) := by
    rw [mul_sub, Real.sin_sub, Real.sin_two_pi, Real.cos_two_pi]; ring
  rw [this]; ring

/-- the areal radius never exceeds the geodesic distance -/
theorem areal_le_geodesic (A χ : ℝ) (hA : 0 ≤ A) (hχ : 0 ≤ χ) : arealRadius A χ ≤ A * χ := by
  unfold arealRadius; exact mul_le_mul_of_nonneg_left (Real.sin_le hχ) hA

/-- the cap grows at the rate of its bounding area: dV/dχ = 4πA³ sin²χ (= A · 4π R_area²) -/
theorem capVolume_deriv (A χ : ℝ) :
    HasDerivAt (capVolume A) (4 * Real.pi * A ^ 3 * Real.sin χ ^ 2) χ := by
  unfold capVolume
  have h1 : HasDerivAt (fun x : ℝ => Real.sin (2 * x)) (Real.cos (2 * χ) * 2) χ := by
    have := (Real.hasDerivAt_sin (2 * χ)).comp χ ((hasDerivAt_id χ).const_mul 2)
    simpa using this
  have h2 := ((hasDerivAt_id χ).sub (h1.div_const 2)).const_mul (2 * Real.pi * A ^ 3)
  convert h2 using 1
  rw [Real.cos_two_mul, Real.cos_sq']; simp; ring

/-- and the volume is the integral of that rate from the pole -/
theorem capVolume_integral (A χ : ℝ) :
    ∫ t in (0:ℝ)..χ, 4 * Real.pi * A ^ 3 * Real.sin t ^ 2 = capVolume A χ := by
  rw [intervalIntegral.integral_eq_sub_of_hasDerivAt (fun x _ => capVolume_deriv A x)]
  · unfold capVolume; simp
  · apply Continuous.intervalIntegrable; fun_prop

/-- the flat limit, as a bound: the cap is never larger than the Euclidean ball of radius D = Aχ -/
theorem cap_le_ball (A χ : ℝ) (hA : 0 ≤ A) (hχ : 0 ≤ χ) :
    capVolume A χ ≤ 4 / 3 * Real.pi * (A * χ) ^ 3 := by
  -- d(χ) = (4/3)πA³χ³ − V(χ) has derivative 4πA³(χ² − sin²χ) ≥ 0 and d(0) = 0
  let d := fun x : ℝ => 4 / 3 * Real.pi * (A * x) ^ 3 - capVolume A x
  have hd : ∀ x, HasDerivAt d (4 * Real.pi * A ^ 3 * (x ^ 2 - Real.sin x ^ 2)) x := by
    intro x
    have hb : HasDerivAt (fun x : ℝ => 4 / 3 * Real.pi * (A * x) ^ 3) (4 * Real.pi * A ^ 3 * x ^ 2) x := by
      have := ((hasDerivAt_id x).const_mul A).pow 3 |>.const_mul (4 / 3 * Real.pi)
      convert this using 1; simp; ring
    convert hb.sub (capVolume_deriv A x) using 1; ring
  have hmono : MonotoneOn d (Set.Ici 0) := by
    apply monotoneOn_of_deriv_nonneg (convex_Ici 0)
    · exact (fun x _ => (hd x).continuousAt.continuousWithinAt)
    · exact (fun x _ => (hd x).differentiableAt.differentiableWithinAt)
    · intro x hx
      rw [(hd x).deriv]
      have hx' : 0 ≤ x := le_of_lt (by simpa using hx)
      have hs : Real.sin x ≤ x := Real.sin_le hx'
      have hs' : -x ≤ Real.sin x := by
        rcases le_or_lt 1 x with h1 | h1
        · linarith [Real.neg_one_le_sin x]
        · have := Real.sin_nonneg_of_nonneg_of_le_pi hx' (by linarith [Real.pi_gt_three]); linarith
      have : Real.sin x ^ 2 ≤ x ^ 2 := sq_le_sq' hs' hs
      have : 0 ≤ x ^ 2 - Real.sin x ^ 2 := by linarith
      positivity
  have h0 : d 0 = 0 := by simp [d, capVolume]
  have := hmono (Set.mem_Ici.2 le_rfl) (Set.mem_Ici.2 hχ) hχ
  simp only [h0] at this
  simp only [d] at this
  linarith

/-- and from below: V ≥ (4/3)π(Aχ)³·(1 − 3χ²/10) for 0 ≤ χ ≤ 1 — so V/(4πD³/3) → 1 as χ → 0, the flat limit, with an explicit error -/
theorem ball_sub_le_cap (A χ : ℝ) (hA : 0 ≤ A) (hχ : 0 ≤ χ) (hχ1 : χ ≤ 1) :
    4 / 3 * Real.pi * (A * χ) ^ 3 - 2 / 5 * Real.pi * A ^ 3 * χ ^ 5 ≤ capVolume A χ := by
  let e := fun x : ℝ => capVolume A x - (4 / 3 * Real.pi * (A * x) ^ 3 - 2 / 5 * Real.pi * A ^ 3 * x ^ 5)
  have he : ∀ x, HasDerivAt e (4 * Real.pi * A ^ 3 * (Real.sin x ^ 2 - x ^ 2 + x ^ 4 / 2)) x := by
    intro x
    have hb : HasDerivAt (fun x : ℝ => 4 / 3 * Real.pi * (A * x) ^ 3 - 2 / 5 * Real.pi * A ^ 3 * x ^ 5)
        (4 * Real.pi * A ^ 3 * x ^ 2 - 2 * Real.pi * A ^ 3 * x ^ 4) x := by
      have h1 := (((hasDerivAt_id x).const_mul A).pow 3).const_mul (4 / 3 * Real.pi)
      have h2 := ((hasDerivAt_id x).pow 5).const_mul (2 / 5 * Real.pi * A ^ 3)
      convert h1.sub h2 using 1; simp; ring
    convert (capVolume_deriv A x).sub hb using 1; ring
  have hmono : MonotoneOn e (Set.Icc 0 1) := by
    apply monotoneOn_of_deriv_nonneg (convex_Icc 0 1)
    · exact (fun x _ => (he x).continuousAt.continuousWithinAt)
    · exact (fun x _ => (he x).differentiableAt.differentiableWithinAt)
    · intro x hx
      rw [interior_Icc] at hx
      rw [(he x).deriv]
      have h0 : 0 < x := hx.1
      have h1 : x ≤ 1 := hx.2.le
      have hlow := Real.sin_gt_sub_cube h0 h1
      have hx2 : x ^ 2 ≤ 1 := by nlinarith
      have hx3 : x ^ 3 ≤ x := by nlinarith
      have hpos : 0 ≤ x - x ^ 3 / 4 := by linarith
      have hsq : (x - x ^ 3 / 4) ^ 2 ≤ Real.sin x ^ 2 := sq_le_sq' (by linarith) hlow.le
      have : 0 ≤ Real.sin x ^ 2 - x ^ 2 + x ^ 4 / 2 := by nlinarith [sq_nonneg (x ^ 3)]
      positivity
  have h0 : e 0 = 0 := by simp [e, capVolume]
  have := hmono (Set.left_mem_Icc.2 zero_le_one) ⟨hχ, hχ1⟩ hχ
  simp only [h0, e] at this
  linarith

/-! ## 8. The apparent horizon of a closed FLRW model (Friedmann taken as a hypothesis) -/

/-- If the total density obeys 8πGρ/3 = H² + c²/A² (closed, k = +1), the Misner–Sharp mass inside the
apparent horizon R_A = c/√(H² + c²/A²) has 2GM/(c²R_A) = 1. Pure algebra; it says nothing about whether
the hypothesis describes the universe. -/
theorem apparent_horizon (c G H A ρ : ℝ) (hc : 0 < c) (hA : 0 < A)
    (hρ : 8 * Real.pi * G * ρ / 3 = H ^ 2 + c ^ 2 / A ^ 2) :
    let RA := c / Real.sqrt (H ^ 2 + c ^ 2 / A ^ 2)
    let M := 4 / 3 * Real.pi * ρ * RA ^ 3
    2 * G * M / (c ^ 2 * RA) = 1 := by
  intro RA M
  have hX : 0 < H ^ 2 + c ^ 2 / A ^ 2 := by positivity
  have hs : 0 < Real.sqrt (H ^ 2 + c ^ 2 / A ^ 2) := Real.sqrt_pos.2 hX
  have hRA : 0 < RA := div_pos hc hs
  have hsq : RA ^ 2 = c ^ 2 / (H ^ 2 + c ^ 2 / A ^ 2) := by
    show (c / Real.sqrt _) ^ 2 = _
    rw [div_pow, Real.sq_sqrt hX.le]
  have hM : 2 * G * M / (c ^ 2 * RA) = (8 * Real.pi * G * ρ / 3) * RA ^ 2 / c ^ 2 := by
    show 2 * G * (4 / 3 * Real.pi * ρ * RA ^ 3) / (c ^ 2 * RA) = _
    field_simp; ring
  rw [hM, hρ, hsq]; field_simp; ring

/-- With Ω_K = −c²/(A²H²) the same horizon is R_H/√(1 − Ω_K), R_H = c/H. -/
theorem apparent_horizon_omega (c H A : ℝ) (hc : 0 < c) (hH : 0 < H) (hA : 0 < A) :
    c / Real.sqrt (H ^ 2 + c ^ 2 / A ^ 2) = (c / H) / Real.sqrt (1 - (-(c ^ 2 / (A ^ 2 * H ^ 2)))) := by
  have e : H ^ 2 + c ^ 2 / A ^ 2 = H ^ 2 * (1 - (-(c ^ 2 / (A ^ 2 * H ^ 2)))) := by field_simp; ring
  rw [e, Real.sqrt_mul (sq_nonneg H), Real.sqrt_sq hH.le]; field_simp

/-! ## 9. A quantum of light lies on the Compton line -/

/-- M = h/(λc) (an energy equivalent, not a rest mass) and R = λ/2π give ħ/(MRc) = 1 exactly, with ħ = h/2π. -/
theorem photon_on_compton_line (h c lam : ℝ) (hh : 0 < h) (hc : 0 < c) (hl : 0 < lam) :
    (h / (2 * Real.pi)) / ((h / (lam * c)) * (lam / (2 * Real.pi)) * c) = 1 := by
  have := Real.pi_pos; field_simp; ring

end HCC.ScaleNexus

end

#print axioms HCC.ScaleNexus.product
#print axioms HCC.ScaleNexus.ratio
#print axioms HCC.ScaleNexus.si_bridge
#print axioms HCC.ScaleNexus.left_u
#print axioms HCC.ScaleNexus.left_v
#print axioms HCC.ScaleNexus.right_a
#print axioms HCC.ScaleNexus.right_b
#print axioms HCC.ScaleNexus.product_log
#print axioms HCC.ScaleNexus.ratio_log
#print axioms HCC.ScaleNexus.log_coordinates
#print axioms HCC.ScaleNexus.density_line
#print axioms HCC.ScaleNexus.radius_level
#print axioms HCC.ScaleNexus.level_radius
#print axioms HCC.ScaleNexus.relabel
#print axioms HCC.ScaleNexus.golden_log_bridge
#print axioms HCC.ScaleNexus.horizon_normalized
#print axioms HCC.ScaleNexus.crossing_squared
#print axioms HCC.ScaleNexus.crossing
#print axioms HCC.ScaleNexus.dilation
#print axioms HCC.ScaleNexus.areal_symmetric
#print axioms HCC.ScaleNexus.cap_complement
#print axioms HCC.ScaleNexus.areal_le_geodesic
#print axioms HCC.ScaleNexus.capVolume_deriv
#print axioms HCC.ScaleNexus.capVolume_integral
#print axioms HCC.ScaleNexus.cap_le_ball
#print axioms HCC.ScaleNexus.ball_sub_le_cap
#print axioms HCC.ScaleNexus.apparent_horizon
#print axioms HCC.ScaleNexus.apparent_horizon_omega
#print axioms HCC.ScaleNexus.photon_on_compton_line
