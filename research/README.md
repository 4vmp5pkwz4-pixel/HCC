# META–CAUSAL SCIENCE II — research branch

**Status:** independent mathematical working draft, 11 October 2026. **Not** a claim of a universal theory of nature, scientific priority, or a Millennium Prize solution.

## Main result

For a smooth coarse map \(\pi:M\to Z\), a microscopic vector field \(F\) projects to an exact autonomous macro field if and only if it preserves the vertical distribution (under the stated submersion/connected-fiber hypotheses). In a scalar macrocoordinate and compact fiber \(H\), let \(v(z,h)=d\pi(F(z,h))\). The exact minimax instantaneous macro model is

\[
b_*(z)=\tfrac12(\max_h v(z,h)+\min_h v(z,h)),
\quad
\delta(z)=\tfrac12(\max_h v(z,h)-\min_h v(z,h)).
\]

**Interpretation:** a strictly positive \(\delta\) proves that no *deterministic, instantaneous* autonomous macro law on this chosen observable reproduces every microscopic state in the declared class. It does **not** rule out closure after adding memory, a hidden variable, stochastic conditioning, or new measurements.

### Physical worked test

For \(q'=p,\ p'=-\omega^2q-\gamma p\), \(E=(p^2+\omega^2q^2)/2\),

\[
E'=-\gamma p^2,\quad
b_*(E)=-\gamma E,\quad
\delta(E)=\gamma E.
\]

For every solution with \(E(0)=E_0\) and \(\gamma>0\),

\[
|E(t)-E_0e^{-\gamma t}|\le E_0(1-e^{-\gamma t}).
\]

This is a rigorous inequality, not an assertion that \(E'=-\gamma E\) is the exact oscillator energy equation.

## Branch contents and Pages

- \`/index.html\`: a standalone interactive manuscript laboratory replacing the *branch's* inherited HCC entry page. The **main** branch is unchanged.
- \`/research/META_CAUSAL_SCIENCE_V2.md\`: theorem statements, proofs and falsification conditions.
- \`/research/verify_nonlinear.py\`: reproducible tests.

A compiled paper and LaTeX source are also available in the companion ChatGPT research artifact. If you want an **independent Pages address**, create a separate public repository and copy these files there; changing HCC's Pages publishing branch to this research branch will replace the existing public HCC deployment (one Pages publishing source per repository).

## Required scientific standards

Every imported proposition must specify its hypothesis and provenance. Do not treat computational tests as formal proofs. Scientific originality has **not** been established by an exhaustive prior-art comparison. This work builds on established projectable vector fields, exact causal abstraction, Chebyshev approximation, and classical differential-equation stability.

Relevant prior art: [Rubenstein et al. 2017](https://proceedings.mlr.press/r15/rubenstein-17a.html), [Chebyshev centres](https://encyclopediaofmath.org/wiki/Chebyshev_centre), [OpenAI Mathematics](https://github.com/openai/math) including [the repository revision history](https://github.com/openai/math/blob/main/history.md).

**No merges without explicit user approval.**
