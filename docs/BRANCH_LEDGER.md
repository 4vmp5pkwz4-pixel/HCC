# The branches this repository carried, and what became of them

Recorded 2026-09-07T19:18:23Z immediately before deleting every branch
except main. Nothing here is lost: a branch is a name pointing at a commit, and
the commit is written down below. Any one of them comes back with

    git push origin <sha>:refs/heads/<name>

Every branch listed as MERGED has its content in main already. Every branch
listed as BEHIND was measured against main at deletion time: taking it would
have DELETED the number of lines shown, because it predates work main carries.

| branch | tip | state | last commit |
|---|---|---|---|
| `0kc9nt-codex/-iphone` | `2488cbc` | BEHIND — taking it would delete 23240 lines | 2026-09-04 |
| `1pvk5v-codex/uberprufe-alle-implementierten-verbesserungen` | `1deb1d8` | BEHIND — taking it would delete 23141 lines | 2026-09-06 |
| `3xaafv-codex/alle-updates-und-prozesse-abschlieen` | `114d263` | BEHIND — taking it would delete 24175 lines | 2026-09-07 |
| `5fsrns-codex/finde-und-stelle-fehlende-verbindungen-wieder-her` | `8df9001` | BEHIND — taking it would delete 23055 lines | 2026-09-06 |
| `7xl63e-codex/uberprufe-alle-implementierten-verbesserungen` | `76ffa50` | BEHIND — taking it would delete 23141 lines | 2026-09-06 |
| `8bwi32-codex/finde-ui-unsicherheiten-auf-mobilgeraten` | `e78b9b3` | BEHIND — taking it would delete 23263 lines | 2026-09-04 |
| `Normalisierung` | `08d34a7` | BEHIND — taking it would delete 223072 lines | 2026-06-12 |
| `a2z49s-codex/-iphone` | `0078bec` | BEHIND — taking it would delete 23183 lines | 2026-09-05 |
| `agent/ancient-chronometry-observatory` | `9f07a7d` | BEHIND — taking it would delete 21939 lines | 2026-09-05 |
| `agent/cmb-predictive-observatory` | `6a6ed43` | BEHIND — taking it would delete 193837 lines | 2026-08-01 |
| `agent/epic-scientific-labs` | `db3975c` | BEHIND — taking it would delete 188044 lines | 2026-08-01 |
| `agent/first-principles-atlas-4.151` | `761468b` | MERGED | 2026-09-05 |
| `agent/first-principles-visual-4.151` | `8d6c38c` | BEHIND — taking it would delete 17909 lines | 2026-09-05 |
| `agent/holonomy-observatory` | `2939984` | BEHIND — taking it would delete 206832 lines | 2026-07-31 |
| `agent/invariant-nexus` | `d0e1920` | BEHIND — taking it would delete 211682 lines | 2026-07-31 |
| `agent/mobile-gpu-lab-stability` | `ec88cfe` | BEHIND — taking it would delete 191115 lines | 2026-08-02 |
| `agent/multiview-gpu-stability` | `04e2d08` | BEHIND — taking it would delete 197686 lines | 2026-08-01 |
| `agent/omni-predictive-foundations` | `5443523` | BEHIND — taking it would delete 192261 lines | 2026-08-02 |
| `agent/optical-refinement` | `f4e8020` | BEHIND — taking it would delete 193532 lines | 2026-08-01 |
| `agent/pages-live-publish` | `3a292a8` | BEHIND — taking it would delete 192248 lines | 2026-08-02 |
| `agent/premium-default-off` | `7d167ba` | BEHIND — taking it would delete 208592 lines | 2026-08-01 |
| `agent/premium-visual-engine` | `5794658` | BEHIND — taking it would delete 210848 lines | 2026-08-01 |
| `agent/radiation-mhd-stellar-audit` | `299661f` | BEHIND — taking it would delete 191884 lines | 2026-08-01 |
| `agent/revert-mobile-gpu-lab-stability` | `a89966f` | BEHIND — taking it would delete 192248 lines | 2026-08-02 |
| `agent/supernova-stability-physics` | `1800288` | BEHIND — taking it would delete 196765 lines | 2026-08-01 |
| `agent/symmetry-discovery` | `544f321` | BEHIND — taking it would delete 207079 lines | 2026-07-31 |
| `agent/symplectic-observatory` | `c757fa9` | BEHIND — taking it would delete 202407 lines | 2026-08-01 |
| `agent/twistor-observatory` | `92a8748` | BEHIND — taking it would delete 202761 lines | 2026-08-01 |
| `chore/post-reconcile-cleanup` | `5f29878` | MERGED | 2026-09-05 |
| `claude/capacity-sieve` | `ef4e9b7` | BEHIND — taking it would delete 172193 lines | 2026-08-11 |
| `claude/ctl-order` | `6cdd50c` | BEHIND — taking it would delete 172481 lines | 2026-08-06 |
| `claude/happy-faraday-4wqxhi` | `f8617f5` | BEHIND — taking it would delete ? lines | 2026-09-07 |
| `claude/mobile-polish` | `b5be70c` | BEHIND — taking it would delete 172709 lines | 2026-08-06 |
| `claude/nav-architecture-audit` | `817d144` | BEHIND — taking it would delete 173128 lines | 2026-08-05 |
| `claude/nav-columns` | `0e07619` | BEHIND — taking it would delete 172819 lines | 2026-08-06 |
| `claude/nav-inspector` | `5486330` | BEHIND — taking it would delete 172960 lines | 2026-08-05 |
| `claude/phone-sheets` | `8355513` | BEHIND — taking it would delete 172668 lines | 2026-08-06 |
| `claude/phone-usable` | `d2993c7` | BEHIND — taking it would delete 172522 lines | 2026-08-06 |
| `claude/resizable-sheet` | `fbc6aae` | BEHIND — taking it would delete 172607 lines | 2026-08-06 |
| `claude/selector-closure` | `7ccb5dd` | BEHIND — taking it would delete 172066 lines | 2026-08-11 |
| `claude/tender-bell-u90tra` | `2e51a29` | BEHIND — taking it would delete 192261 lines | 2026-08-02 |
| `claude/topbar-fix` | `bbe47ca` | BEHIND — taking it would delete 172455 lines | 2026-08-11 |
| `codex` | `846a5d3` | BEHIND — taking it would delete 214394 lines | 2026-07-30 |
| `codex-4.148-observer-consistency` | `36e8eed` | BEHIND — taking it would delete 21582 lines | 2026-09-05 |
| `codex-f9mn75` | `90b3728` | BEHIND — taking it would delete 23055 lines | 2026-09-06 |
| `codex-l0e9mh` | `5e37a49` | BEHIND — taking it would delete 214412 lines | 2026-07-30 |
| `codex-oxqg0a` | `c19c533` | BEHIND — taking it would delete 22937 lines | 2026-09-07 |
| `codex-tfl2yl` | `f7ad534` | BEHIND — taking it would delete 23149 lines | 2026-09-05 |
| `codex-uk0m6b` | `e2b46b7` | BEHIND — taking it would delete 23000 lines | 2026-09-07 |
| `codex-y7e8rn` | `2e22a2f` | BEHIND — taking it would delete 214325 lines | 2026-08-01 |
| `design/unified-atlas-time-4.152` | `a33f45f` | MERGED | 2026-09-06 |
| `f1zo26-codex/improve-webxr-visual-quality-and-effects` | `6a4035b` | BEHIND — taking it would delete 22897 lines | 2026-09-07 |
| `feat/unified-atlas-time-4.152` | `bd4b713` | MERGED | 2026-09-06 |
| `fix/post-merge-reach-4.151.1` | `bafdaab` | MERGED | 2026-09-06 |
| `fix/solar-gpu-buffer-regression-4.148` | `861f257` | BEHIND — taking it would delete 21424 lines | 2026-09-05 |
| `izfq28-codex/uberprufe-alle-implementierten-verbesserungen` | `3c79b5c` | BEHIND — taking it would delete 23123 lines | 2026-09-06 |
| `kdgre6-codex/uberprufe-alle-implementierten-verbesserungen` | `471b722` | BEHIND — taking it would delete 23141 lines | 2026-09-06 |
| `kymcln-codex/uberprufe-alle-implementierten-verbesserungen` | `c30d4da` | BEHIND — taking it would delete 23130 lines | 2026-09-06 |
| `m5snhy-codex/-iphone` | `d8418d2` | BEHIND — taking it would delete 23201 lines | 2026-09-04 |
| `reconcile/4.149-semantic` | `4987886` | BEHIND — taking it would delete 21023 lines | 2026-09-05 |
| `reconcile/4.149-stage2-multiview` | `01c0467` | BEHIND — taking it would delete 21124 lines | 2026-09-05 |
| `reconcile/4.150-ancient-chronometry` | `44042b6` | BEHIND — taking it would delete 19709 lines | 2026-09-05 |
| `reconcile/stage2-multiview-api` | `bf43b50` | BEHIND — taking it would delete 21127 lines | 2026-09-05 |
| `release/4.149.1-saros-clock-sync` | `b60b88d` | MERGED | 2026-09-05 |
| `release/4.149.2-linked-cycle-views` | `33a3646` | MERGED | 2026-09-05 |
| `release/4.150.0-ancient-chronometry` | `04908ed` | MERGED | 2026-09-05 |
| `release/4.151.1-linked-cycle-views` | `261d33b` | MERGED | 2026-09-06 |
| `release/4.152.1-cycle-navigation` | `9e41dbd` | BEHIND — taking it would delete 6849 lines | 2026-09-06 |
| `release/4.153.0-multiphase-solar-control` | `423e518` | MERGED | 2026-09-06 |
| `release/4.154.0-chronometry-workspace` | `40c44ae` | MERGED | 2026-09-06 |
| `release/4.155.0-predictive-reach-observatory` | `bddb34a` | BEHIND — taking it would delete 5422 lines | 2026-09-06 |
| `vde-class-validation-20260809` | `ce86544` | BEHIND — taking it would delete 172481 lines | 2026-08-09 |
| `vde-class-validation-20260809-scratch` | `143683f` | BEHIND — taking it would delete 172481 lines | 2026-08-06 |
| `vde-class-validation-20260809-scratch2` | `143683f` | BEHIND — taking it would delete 172481 lines | 2026-08-06 |
| `vde-class-validation-20260809-scratch3` | `143683f` | BEHIND — taking it would delete 172481 lines | 2026-08-06 |
| `vde-class-validation-20260809-scratch4` | `143683f` | BEHIND — taking it would delete 172481 lines | 2026-08-06 |
| `vde-class-validation-20260809-test` | `143683f` | BEHIND — taking it would delete 172481 lines | 2026-08-06 |


## What was taken from the branches that were left, and what was not

Recorded 2026-09-07. Twenty-three branches remained after the merged ones were
deleted. Every one of them carries an `index.html` older than main — 4.147 to
4.155 against main's 4.157 — so none of them has page content worth taking
wholesale. What they *did* have is files main never received.

| branch | what it held that main lacked | taken? |
|---|---|---|
| `release/4.155.0-predictive-reach-observatory` | `core/prediction/reach-forecast.mjs`, its verifier, its fragment and patch, two design documents | **YES** — materialised onto 4.157.0 and verified in a browser: 23 scaling laws, 3 local-only, 5 unjudged for one control |
| `reconcile/4.150-ancient-chronometry` | `docs/reconcile-ancient-phase-b-red.cjs` | **YES** — it failed one clause against main, which was a real gap, and is kept as `docs/verify-ancient-chronometry-contract.cjs` |
| `vde-class-validation-20260809` | the whole DESI DR2 BAO / CLASS validation project | **YES** — `vde_likelihood/`, `vde_validation/` and its four workflows, retriggered to `workflow_dispatch` |
| `vde-…-scratch`, `-scratch2`, `-scratch3`, `-scratch4`, `-test` | nothing: each is the branch above minus 1681 lines | no — subsets of what was taken |
| `reconcile/4.149-semantic`, `reconcile/4.149-stage2-multiview`, `reconcile/stage2-multiview-api`, `reconcile/4.150-*` (workflows) | one-shot materialisation scripts and the CI jobs that ran them | no — spent tooling whose OUTPUT is in main; keeping a script that patches a file into a state it is already in adds a file that can only fail |
| the four `*-codex/uberprufe-*`, `a2z49s-codex/-iphone` | nothing main lacks; all at 4.147–4.148 | no |
| `agent/ancient-chronometry-observatory`, `agent/first-principles-visual-4.151` | nothing main lacks | no |
| `design/unified-atlas-time-4.152`, `release/4.149.2-linked-cycle-views` | nothing at all — zero commits past their merge base | no |
| `Normalisierung`, `claude/tender-bell-u90tra`, `codex-l0e9mh` | unrelated histories with no merge base and no `HCC_VERSION`; older parallel lines of the same file | no |

Every tip SHA is in the table above this section, so anything judged wrongly here
comes back with one command.
