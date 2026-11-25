import Mathlib
/-! Exact rational fixtures for the cross-language check: Lean computes the algebraic maps of the Scale Nexus kernel
on rational inputs exactly; the JavaScript kernel must reproduce them in floating point. These are evaluations, not proofs. -/
namespace HCC.ScaleNexus.Fixtures
def aQ (u v k : ℚ) : ℚ := k + u - v
def bQ (u v : ℚ) : ℚ := -u - v
def invUQ (a b k : ℚ) : ℚ := (a - b - k) / 2
def invVQ (a b k : ℚ) : ℚ := (k - a - b) / 2
def CQ (m r : ℚ) : ℚ := 2 * m / r
def QQ (m r : ℚ) : ℚ := 1 / (m * r)
def rhoQ (m r : ℚ) : ℚ := 3 * m / (4 * r ^ 3)   -- density × π, kept rational
/-- deterministic inputs: an LCG over ℕ mapped to rationals with small denominators -/
def lcg (s : ℕ) : ℕ := (s * 1103515245 + 12345) % 2147483648
def inputs : List (ℚ × ℚ × ℚ × ℤ) := Id.run do
  let mut s := 4410
  let mut out : List (ℚ × ℚ × ℚ × ℤ) := []
  for _ in [0:60] do
    s := lcg s; let m : ℚ := ((s % 99991 : ℕ) + 1 : ℚ) / ((s % 97 : ℕ) + 1 : ℚ)
    s := lcg s; let r : ℚ := ((s % 99989 : ℕ) + 1 : ℚ) / ((s % 89 : ℕ) + 1 : ℚ)
    s := lcg s; let sc : ℚ := ((s % 37 : ℕ) + 2 : ℚ) / ((s % 11 : ℕ) + 1 : ℚ)
    s := lcg s; let p : ℤ := ((s % 9 : ℕ) : ℤ) - 4
    out := out ++ [(m, r, sc, p)]
  return out
def qs (q : ℚ) : String := s!"\"{q.num}/{q.den}\""
def row (x : ℚ × ℚ × ℚ × ℤ) : String :=
  let (m, r, sc, p) := x
  let u := m; let v := r; let k : ℚ := 3/10
  let a := aQ u v k; let b := bQ u v
  let C2 := CQ (sc ^ p * m) (sc * r); let Q2 := QQ (sc ^ p * m) (sc * r)
  s!"\{\"m\":{qs m},\"r\":{qs r},\"s\":{qs sc},\"p\":{p},\"a\":{qs a},\"b\":{qs b},\"invU\":{qs (invUQ a b k)},\"invV\":{qs (invVQ a b k)},\"C\":{qs (CQ m r)},\"Q\":{qs (QQ m r)},\"CQprod\":{qs (CQ m r * QQ m r)},\"CQratio\":{qs (CQ m r / QQ m r)},\"rhoPi\":{qs (rhoQ m r)},\"Cdil\":{qs C2},\"Qdil\":{qs Q2},\"Cdil_law\":{qs (sc ^ (p - 1) * CQ m r)},\"Qdil_law\":{qs (sc ^ (-p - 1) * QQ m r)}}"
#eval IO.println ("[" ++ ",\n".intercalate (inputs.map row) ++ "]")
end HCC.ScaleNexus.Fixtures
