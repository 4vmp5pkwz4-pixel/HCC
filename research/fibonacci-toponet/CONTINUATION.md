# Canonical continuation protocol

1. Read `README.md`, `SCIENTIFIC_AUDIT.md`, the v4 Python source and `v4/results/` before changing claims. Use this research branch or its PR as the canonical persisted handoff.
2. Reproduce `python v4/verify_v4.py` with torch 2.10.0+cpu or note precise compatibility changes; audit deterministic seeds.
3. Do not merge to HCC `main` without explicit approval. Prefer a small PR from a new topic branch for each experiment; preserve old checkpoints and reports.
4. First independent replication target: compare at matched total compute and parameters against a modern Transformer, linear attention/delta-rule model and GRU on associative recall, mixed updates/deletions, ambiguous keys, adversarial collisions, multihop and long-context extrapolation. Use 5+ seeds, confidence intervals, wall-clock throughput and memory.
5. Evaluate real data: retrieval QA with changed facts, distribution shifts, OOD abstention and multi-step queries. Separate exact symbolic oracle from learned pipeline, and quantify errors at routing, key extraction, update, and answer stages.
6. Add optional formal specification of finite-state memory (e.g. Lean) and fuzz the boundary between external session state and neural output; do not label Python property checks as full formal proof.
7. Keep META–CAUSAL/S³ mathematics as a separate scientific track. Symmetry projectors are an algebraic connection only; they are not evidence that this neural architecture detects physical cosmic topology.

## Gates before broad claims

- Independent code reuse with matching saved hashes.
- No data leakage or unintended oracle access.
- Match input representation and computational budgets.
- Demonstrate *positive* transfer beyond purpose-designed synthetic task.
- Explicit experimental uncertainty and failures.