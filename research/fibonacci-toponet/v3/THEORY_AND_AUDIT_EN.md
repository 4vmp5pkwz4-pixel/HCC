# Technical note: causal symmetries, contractive memory, and nuisance observability

## Scope and conventions

This technical document records testable mathematical properties of a small finite-vocabulary classifier, not an astronomical or cosmological model. All results are standard mathematical consequences of the explicitly implemented operations. Claiming historical novelty, a new physical law, AGI-level capability, or a faithful implementation of Mamba/Titans would be unwarranted.

### 1. Reynolds projection and its information ceiling

Let a finite group `G` act on inputs and let `f` be any deterministic logit function. Define `(P_G f)(x) = |G|^{-1} Σ_g f(gx)`. For any `h∈G`, permutation of the summation indices gives `(P_G f)(hx)=(P_G f)(x)`, hence `P_G²=P_G`. A classifier depending only on `P_G f` can never distinguish `x` from `hx`, even if labels differ. On reversal-balanced opposite-label pairs its maximal accuracy is 1/2. This is the same *operator averaging algebra* as the fixed-mode selection used in `S³/Γ` research, but there is **no** claim that the network represents cosmic topology.

### 2. Contraction of input-dependent memory

The recurrence uses `u_t=tanh(Ux_t+β C_φ x_t)`, `a_t=0.995 sigmoid(G x_t)`, `h_t=a_t ⊙ h_{t−1} + (1−a_t) ⊙u_t`. Thus for a **fixed input sequence** and initial state in the unit cube the entire state sequence stays in the cube. The state-to-state Jacobian is `diag(a_t)`, with operator norm strictly less than `0.995`. As a result initial-state differences contract at least as fast as `0.995^T`. This does not bound the sensitivity to arbitrary input perturbations, nor guarantee indefinite exact memory retention.

The symmetric companion block `C_φ=[[1,1],[1,0]]/φ` has eigenvalues `1` and `−φ^{-2}`; thus `∥C_φ∥₂=1`. Its presence is an inductive bias; the experiment does not establish Fibonacci-specific advantages.

### 3. Strict causal cone

Each layer's local attention sees positions in `[t-W,t]`, and pointwise feed-forward/norm layers do not expand dependence. Induction over `L` layers shows the token representation at `t` without global memory depends only on indices `[max(0,t−LW),t]`. The selective-memory path can propagate information from all past tokens to `t`, but cannot see future tokens. Exact equality is subject to floating point tolerance and deterministic evaluation.

### 4. Nuisance-orthogonal Gaussian score

For `y~N(0,C(θ))` and a covariance-direction matrix `D=∂C/∂β`, Gaussian Fisher is `F_DD=½ tr(C^{-1}D C^{-1}D)`. Given nuisance tangent matrices `B_j`, profiling gives the Schur complement / orthogonal projection:

`F_{D|B} = (1/2) min_a ∥C^{-1/2}(D−Σ_j a_j B_j)C^{-1/2}∥_F²`.

The utility in `fibonacci_topo_net_v3.py` evaluates this with Cholesky whitening and least squares. Its value is zero precisely when the contrast lies in the nuisance span (up to numerical precision). This is a *diagnostic* for a specified local Gaussian observation model, not an assurance of identifiability in a nonlinear neural network.

### 5. Benchmark design and results

The delayed-recall label is determined exclusively by a first-position token. The remainder is independent of the label; the final position contains a query token. At training length 48 and maximum attention radius 8, the last-token no-memory classifier has no access to the label-bearing token. Its optimal test accuracy is 50% on a balanced distribution. A selective-memory path can bridge that gap. In two seeds it learned the task perfectly at length 48. Generalization to length 192 varied by seed (100% vs 78.91%), and a non-Fibonacci control produced essentially the same result (100% vs 78.32%). See machine-readable reports for exact experimental setup and held-out NLL/ECE values.

### 6. Tests and open issues

The source contains 778 passing finite-matrix tests, including an independent dense-attention oracle, causal invariance to edits of future tokens, padding invariance, exact finite-group orbit invariance, gradient checks, and projected Fisher. These tests are not formal Lean proofs. Additional work needed: learned memory writes/reads under distractor distribution shifts, true long-context corpora, production GPU scan kernels, multiple matched-memory architectures, downstream language tasks, interpretability interventions, OOD calibration, and statistically powered evaluation.