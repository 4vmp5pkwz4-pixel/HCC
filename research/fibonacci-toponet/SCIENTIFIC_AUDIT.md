# Scientific audit, 2026-10-16

**Verified locally:** `python v4/verify_v4.py` yielded 3,050 finite property checks with 0 failures, PyTorch 2.10.0+cpu. This is a regression suite, not a formal proof or an external replication. See JSON reports for exact setup.

**Experimental results (synthetic):** Two seeds of neural delta memory reached 100% on lengths 24 (training), 96, 192 (512 test cases per length) and 1024 (256 cases per seed) in a 12-key/6-value last-write-wins task. The neural model has 342 trainable parameters but receives structured key/value encoding and learned near-orthogonal keys. Its baseline GRU has 15,414 parameters and was initially trained 240 steps; a separate 3,000-step run improved its performance but did not match 100%. The 39,318-parameter causal Transformer trained 450 steps achieved near-perfect training-length performance but far lower length-192 extrapolation. **None of these are fair SOTA or compute-matched comparisons.**

**Exact symbolic memory:** `VersionedAssociativeMemory` stores typed keys, versions, explicit deletions, unknown/budget/cycle responses, and replayable evidence. The evidence is not authenticated and its replay is valid only relative to the unchanged current memory state.

**What is NOT established:** real-world language performance, a novel physical law, the special optimality of Fibonacci numbers, unlimited memory, sublinear complexity for all workloads, strong robustness outside synthetic tasks, end-to-end neural multi-hop inference, or external benchmark leadership.

**Reproducibility:** Source, scripts, JSON reports and checkpoint weights (if present in GitHub tree) are versioned. `SHA256SUMS.txt` lists original file-byte digests. Use `git status` to confirm a clean checkout, the commit SHA and Python/PyTorch version before comparing runs.
