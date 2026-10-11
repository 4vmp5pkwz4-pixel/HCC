# META–CAUSAL FOUNDATIONS II — FORTY PROOF-BOUNDED INVARIANT LAWS

11 October 2026. Research working draft; historical world priority is not established. These are 40 mathematical claims with explicit hypothesis packages, NOT 40 experimentally verified new interactions of nature. Full rigorous Russian paper, PDF and Python verifier are the companion research deliverables.

01. Operational equivalence is an equivalence relation

02. Additional experiments refine operational equivalence classes

03. Similarity transformations preserve all formal-series predictions

04. Hankel rank is bounded by linear realization dimension

05. Finite Hankel rank equals minimal real-linear realization dimension

06. Reachable-observable quotient dimension equals Hankel rank **[derived/strengthened in this edition]**

07. Unary observations obey Cayley-Hamilton recurrences

08. Adding admissible operations cannot decrease the Hankel rank

09. A nonzero r-minor certifies linear dimension at least r

10. Finite-noise singular-value certificate and Bernoulli sample bound **[derived/strengthened in this edition]**

11. Individual stochastic P and Q have process rank one

12. Joint stochastic P and Q can attain arbitrary dimension n

13. Exact n-minor magnitude equals (1-a)^(n-1)

14. Unbounded intervention synergy of n-1

15. Predictive rank is not a submodular function of the action alphabet

16. Classical operation-order contrast equals a 2x2 minor

17. At most 2n-2 action steps suffice for the explicit witness **[derived/strengthened in this edition]**

18. Deterministic endpoint a=0 retains joint rank n and determinant 1 **[derived/strengthened in this edition]**

19. Singular-value lower bound and dimension-certifying noise gate **[derived/strengthened in this edition]**

20. Arbitrary ontic entropy can be invisible to operational rank **[derived/strengthened in this edition]**

21. Strong Markov lumpability is kernel invariance of the partition map

22. Exact lumpability propagates through every word of interventions

23. Approximate quotient defects accumulate at most additively **[derived/strengthened in this edition]**

24. Total variation cannot increase under a stochastic coarse-graining

25. KL divergence cannot increase under a stochastic coarse-graining

26. Equal-prior hypothesis testing is determined by total variation

27. Quantum d-dimensional preparation/effect tables have rank <= d^2

28. Tetrahedral pure-qubit table has rank 4 and determinant 16/27

29. Independent full preparation/effect tables have multiplicative rank

30. CPTP maps contract quantum trace distinguishability

31. Finite probability tables have classical latent-state emulations

32. Nonlinear projectability iff vertical brackets are vertical

33. Optimal scalar macrolaw defect equals half the fiberwise velocity spread

34. Finite-time macro error obeys Gronwall

35. Damped oscillator energy alone is not autonomous for all phases

36. Minimal seesaw CP-even parameter domain is semialgebraic

37. Heavy-neutrino CP-odd source squared is fixed by CP-even diagonals

38. Heavy-neutrino Gram determinant is fixed by masses in this seesaw

39. CP-odd source sign is not identifiable from only CP-even channels

40. Heavy-sector CP-odd trace is invariant under weak-basis changes

## Central exact certificates

Finite-state stochastic family (for each n>=2) supports individual process ranks r(P)=r(Q)=1 and joint rank r(P,Q)=n. A concrete witness has |det H_n|=(1-a)^(n-1) for 0<=a<1.

New deterministic saturation at a=0: both P and Q have columns that are deterministic one-hot transitions and |det H_n|=1 although individual ranks remain one.

For a finite n by n probability witness, ||H_n||_2<=n implies
sigma_min(H_n)>=((1-a)/n)^(n-1). With per-cell absolute error epsilon<(1-a)^(n-1)/(2n^n), the estimated smallest singular value exceeds n*epsilon and certifies dimension n. This is conservative, not optimal.

If each entry is estimated from N repeated independent Bernoulli trials, N >= log(2n^2/delta)/(2epsilon^2) certifies simultaneous absolute error epsilon with probability >=1-delta.

For stochastic coarse-graining L and operations P_j with approximations Pbar_j, any intervention word w obeys
||L P_w - Pbar_w L||_(1->1) <= sum_j ||L P_j - Pbar_j L||_(1->1).

The CP-even heavy-neutrino discriminant and its sign ambiguity are conditional on exactly two heavy Majorana neutrinos, normal light hierarchy with m1=0 and leading-order type-I seesaw; they do not determine the observed cosmic baryon asymmetry.

## Proof and priority gates

Classical Hankel minimal realization, lumpability, data processing and quantum trace contraction are established mathematics. Do not claim historical novelty for these. The structural synthesis and deterministic saturation are new to this research programme but no exhaustive historical priority check has established world-first status.

Proof source: original 19-page META–CAUSAL FOUNDATIONS manuscript. Independent calculations in the companion verifier include 36 rational synergy constructions (n=2 through 13; a=0, 1/2, 2/3), rank/noise cases, qubit spectra, coarse-graining controls, and a scoped neutrino CP discriminator. All recorded tests passed, but finite tests do not imply universal proofs.

Relevant external critical literature: Fanizza, Lumbreras and Winter, Commun. Math. Phys. 405 (2024), finite-memory processes need not admit a finite-dimensional quantum realization. Liu, Yuan, Zhang, Entropy 26 (2024), causal emergence under coarse-graining. OpenAI Mathematics catalogue https://github.com/openai/math contains scope-limited mathematical results and documented corrections/withdrawals, not an automatic proof of fundamental physics.

Independent external review and empirical discrimination of competing physical models are required before declaring a paradigm shift. No main-branch merge or Pages publishing change is authorized.
