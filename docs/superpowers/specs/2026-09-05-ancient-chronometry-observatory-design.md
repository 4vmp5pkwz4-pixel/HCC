# Ancient Chronometry & Commensurability Observatory — Design

## Purpose

Build a source-locked, falsifiable comparative chronometry layer for HCC that can encode ancient Indian, Jain, Buddhist, Sanskrit, Chinese and Kalacakra systems of time, length, number and astronomy, compare them with modern measured science, and reject numerical coincidences that do not survive provenance, uncertainty, epoch, phase and multiple-testing controls.

The system must be capable of saying `EXACT`, `DERIVED`, `MEASURED`, `EPOCH_CORRECTED_MATCH`, `COMMENSURATE`, `PHASE_CONSISTENT`, `HYPOTHESIS`, `ANALOGY`, `UNKNOWN`, or `REJECTED` with equal visibility. It is not designed to prove that an ancient cosmology secretly contained modern physics.

## Scientific contract

This design inherits `SCIENTIFIC_CONTRACT.md` without weakening it.

1. Numerical equality alone is never a physical relation.
2. The same lexical unit name is not a quantity identity.
3. Ancient values are source-locked to text, recension, tradition, epoch and operational definition.
4. Modern values are locked to quantity kind, frame, epoch, uncertainty and source version.
5. A conversion to SI is a transformation with assumptions, not a replacement of the original datum.
6. A modern comparison must use the source epoch where the physical quantity is time-dependent.
7. A visually attractive match may not be promoted to a stronger epistemic class.
8. A candidate match must survive an explicit falsification pipeline.

## Scope

### Ancient source families

The initial corpus model must support, without merging them:

- Jain: Tattvarthasutra, Jambudvipaprajnapti, Tiloyapannatti, Trilokasara, Suryaprajnapti and source-critical descendants.
- Buddhist / Abhidharma: Abhidharmakosa traditions, Mahasamghika Vinaya, Mahaprajnaparamita-sastra, Pali Abhidhamma/commentarial systems, Lalitavistara, Avatamsaka/Gandavyuha recension families and cosmological texts containing explicit temporal or spatial scales.
- Sanskrit / Indic: Vedanga Jyotisa, Arthasastra, Manusmrti, relevant Mahabharata passages, Visnu Purana, Bhagavata Purana, Yoga Sutra with Vyasa commentary, Surya Siddhanta, Aryabhatiya, Pancasiddhantika, Brahmasphutasiddhanta, Siddhantasiromani and source-critical descendants.
- Kalacakra / Tibetan astronomy: Kalacakratantra, Vimalaprabha, surviving Sanskrit astronomical material and historically distinct Tibetan computational traditions.
- Chinese: Zhoubi Suanjing, Huainanzi, Han Shu and Hou Han Shu calendrical treatises, Jin Shu, Song Shu, Sui Shu, Tang calendrical treatises, Daming, Dayan, Shoushi and Yuan Shi materials, plus documented Indian astronomical transmission into China.

This list is an extensible registry, not a claim that every surviving manuscript has been digitised or exhaustively collated.

### Modern comparison domains

The modern registry must support metrology, quantum/atomic/nuclear physics, chemistry, molecular biology, physiology, geophysics, paleoclimate, celestial mechanics, stellar physics, galactic dynamics and cosmology.

## Source-locked datum

Every ancient datum must carry at least:

```text
id
term_native
normalized_term
transliteration
quantity_kind
language
tradition
text
chapter_or_verse
recension
edition
source_date_range
operational_definition
exact_relation_graph
calendar_profile
spatial_profile
source_anchor
anchor_uncertainty
epistemic_status
citation
notes
```

A global record such as `ksana = X seconds`, `truti = Y seconds`, `paramanu = Z metres` is forbidden.

Allowed identities are source-qualified, for example:

```text
abhidharmakosa.ksana
bhagavata.ksana
arthasastra.truti
bhagavata.truti
siddhantasiromani.truti
```

## Exact arithmetic kernel

All textual identities are represented using integers, rational numbers or symbolic powers. Binary64 is allowed only at presentation or explicitly numerical scientific-comparison boundaries.

Required primitives:

```text
makeRational(numerator: bigint, denominator: bigint)
normalizeRational(r)
multiplyRational(a, b)
divideRational(a, b)
addRational(a, b)
subtractRational(a, b)
rationalToDecimal(r, digits)
```

The exact layer must preserve relationships such as Jain ara closure or a textual chain of subdivisions without losing integer/rational identity.

## Unit-conflict observatory

The system must detect and display identical normalized names that have incompatible source definitions. Initial benchmark terms include:

`ksana`, `nimesa`, `truti`, `paramanu`, `anu`, `angula`, `yojana`, `muhurta`, `kalpa`, `yuga`, `asamkhyeya`.

No averaging is permitted across traditions.

## Jain cycle model

Represent a descending half-cycle symbolically with `K = kotakoti-sagaropama`:

```text
A1 = 4K
A2 = 3K
A3 = 2K
A4 = K - 42000 years
A5 = 21000 years
A6 = 21000 years
sum(A1..A6) = 10K
```

The ascending sequence is the reverse structural order. The current HCC candidate comparison `21000 years` versus the independently derived terrestrial climatic-precession scale remains `HYPOTHESIS / NEAR_COMMENSURATE` until calendar, phase, epoch and multiple-testing checks pass.

`42000 years` must carry a dependency warning because it is structurally `2 × 21000` in this closure and is not an independent Jain datum.

## Calendar profiles

Ancient year-like quantities may not be silently mapped to a tropical year. Every conversion declares a profile, at minimum:

```text
canonical-unspecified
360-day traditional
Julian-year
tropical-year
sidereal-year
source-specific
```

A source-specific calendar profile overrides a generic profile where the source defines enough information.

## Length metrology

Ancient length systems are relation graphs with uncertain anchors. The engine must support interval/distribution anchors for terms such as `angula`, `chi`, `li`, `yojana`, `pramana-yojana`, `rajju`, and derived subdivisions.

Every SI conversion reports anchor sensitivity. Any candidate relation created only by tuning an allowed anchor is classified `REJECTED: anchor-created coincidence`.

## Modern scientific datum

Every modern datum must carry:

```text
quantity_kind
value_or_function
SI_unit
reference_frame
observer
epoch
uncertainty
covariance_reference
physical_model
source
source_version
```

A source-era astronomical value is compared with `modernReference(quantity, sourceEpoch, frame, observer)`, not automatically with J2000.

## Historical astronomy benchmark class

Ancient observations of the same physical quantity as modern astronomy are a privileged comparison class because they do not require cross-domain identity claims.

Initial benchmark families include:

- Aryabhata sidereal rotation / sidereal lunar month.
- Huainanzi synodic month.
- Daming tropical year and lunar synodic/draconic/anomalistic periods.
- Shoushi tropical year and lunar synodic/draconic/anomalistic periods.
- Vedanga Jyotisa calendrical relations as an earlier lower-precision benchmark.

The final residuals must be recomputed against epoch-corrected modern models before receiving `EPOCH_CORRECTED_MATCH`.

## Commensurability engine

Reuse the existing HCC continued-fraction/commensurability machinery rather than creating a second engine.

For exploratory period comparison use

```text
r(n,m) = abs(log((n * A) / (m * B)))
```

with predeclared bounded integers. Default exploratory bound is `1 <= n,m <= 12`. Increasing the bound must increase the multiple-testing penalty and be visible to the user.

Large integer coincidences are not evidence merely because a ratio can be approximated.

## Phase test

A period match is weaker than an independently phase-consistent match.

When independent absolute anchors exist, evaluate a normalized wrapped phase residual. A candidate cannot reach `PHASE_CONSISTENT` without a phase specified independently of the comparison target.

This is mandatory for the Jain 21 kyr candidate.

## Anti-apophenia firewall

Every cross-domain search must account for the search space.

Required controls:

- look-elsewhere accounting;
- harmonic-family clustering;
- bounded rational search;
- log-uniform synthetic null periods;
- shuffled labels;
- source-duplication penalties;
- recension-dependence penalties;
- anchor-sensitivity tests;
- phase-consistency tests;
- FDR or family-wise correction where a statistical family is defined;
- negative controls composed of deliberately irrelevant quantity kinds.

The engine's job is to destroy candidate matches before promoting them.

## Epistemic classes

`EXACT_TEXTUAL` — exact inside a declared textual mathematical system.

`DERIVED_TEXTUAL` — derived from declared textual inputs.

`HISTORICAL_MEASUREMENT` — ancient determination of an independently observable quantity.

`MODERN_MEASUREMENT` — modern experimental/observational datum.

`EPOCH_CORRECTED_MATCH` — same quantity; agreement survives source-epoch reconstruction.

`COMMENSURATE` — a statistically defensible rational relation under the declared search family.

`PHASE_CONSISTENT` — period and independently specified phase agree.

`HYPOTHESIS` — testable proposed physical relation.

`ANALOGY` — structural similarity without physical identity.

`UNKNOWN` — insufficient evidence.

`REJECTED` — fails identity, provenance, statistics, phase, anchor, mechanism or source-consistency tests.

## Explicit initial firewall

The following must never be promoted merely from numerical proximity:

```text
paramanu <-> atom
paramanu <-> electron Compton wavelength
paramanu <-> Planck length
truti <-> atomic time
truti <-> Planck time
ksana <-> neuronal oscillation
kalpa <-> age of Earth
kalpa <-> age of Universe
asamkhyeya <-> number of particles in Universe
```

They may appear in exploratory views only with the reason for non-admission.

## Visual architecture

The eventual UI is two synchronized spaces.

### Source space

Graph of texts, languages, recensions, dates and unit-definition chains.

### Science space

Logarithmic modern scale from Planck/particle through atom/molecule/biology/planet/orbit/paleoclimate/star/galaxy/cosmology.

A conduit between spaces exists only when a typed relation record exists. Brightness, animation and geometric proximity may not imply confidence.

A `Same term / different definition` view must make conflicts explicit.

A historical-precision view must plot residual by observable and epoch, never cultural ranking.

## Branch-safe delivery protocol

This work is intentionally split because another agent is modifying HCC concurrently.

### Phase A — safe parallel preparation

May be committed to `agent/ancient-chronometry-observatory` before the other agent finishes:

- this design specification;
- implementation plans;
- source-data schemas and source registries in new files;
- exact-arithmetic/source-lock kernels in new files;
- independent verifier files;
- independent test data;
- handoff documentation.

### Phase B — wait for updated main before integration

Do not modify these shared/high-conflict files until the other agent lands:

- `index.html`;
- `version.json`;
- generated API/manifest artifacts;
- global navigation registries embedded in the atlas;
- shared extracted-kernel artifacts whose source is `index.html`;
- release notes/counts that depend on the full repository state.

After the other agent commits/merges, compare its new `main` with this branch base, then adapt Phase B to the new architecture. Do not blindly merge an old generated artifact set.

## Verification requirements

The completed feature must include independent checks for:

- rational normalization and exact arithmetic;
- source identity separation;
- same-term conflicting-definition detection;
- Jain cycle closure;
- calendar-profile sensitivity;
- anchor sensitivity;
- bounded commensurability search;
- harmonic dependence;
- null-model false-positive behavior;
- epoch-aware historical astronomy;
- JSON/export round trips;
- UI/source registry consistency after Phase B integration.

Verifier implementations must not share hidden numerical constants with the production path they are testing.

## Definition of success

The observatory succeeds when every displayed relation can be reconstructed from its source data and code and when the system is equally willing to display `MATCH`, `NEAR MATCH`, `UNKNOWN`, `ANALOGY`, or `REJECTED`.

The strongest result is not the largest number of matches. It is the smallest set of relations that remains after adversarial source, epoch, anchor, phase and multiple-testing checks.
