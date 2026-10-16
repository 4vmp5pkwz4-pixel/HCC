# FibonacciTopoNet — reproducible research (v4)

This is a **research prototype**, not a pretrained LLM or a demonstration of superior general intelligence. The v4 design separates a learned causal encoder, differentiable delta-rule associative fast weights, and a deliberately **non-neural** exact versioned key-value/graph memory. Exact key retrieval is possible because the inputs are structured and the memory implements dictionary semantics; it must not be reported as neural language reasoning.

## Start

From this `research/fibonacci-toponet/` directory, after cloning the repository:

```bash
python -m pip install -r requirements.txt
python v4/verify_v4.py
python v4/benchmark_v4.py --help  # inspect supported flags first
```

The scripts use `v4` code and its embedded fallback import of `v3/fibonacci_topo_net_v3.py` when executed from the `v4` folder; the v3 dependency is also kept in `v4/provenance_v3/fibonacci_topo_net_v3.py`. Some benchmark scripts use relative working-directory paths; run them from `v4/` if appropriate. Existing benchmark JSON files are preserved as historical results.

## Repository layout

- `v4/fibonacci_topo_net_v4.py` — integrated prototype and `VersionedAssociativeMemory`.
- `v4/neural_kv.py` — trained associative delta-memory baseline.
- `v4/verify_v4.py` — randomized invariant/property checks (3,050 on audited run).
- `v4/benchmark*.py`, `v4/results/` — synthetic-task scripts and frozen records.
- `v4/checkpoints/` — exact historical PyTorch artifacts; use `torch.load(..., weights_only=True)` for tensor state dictionaries where applicable. Treat checkpoints as untrusted unless provenance is confirmed.
- `v3/`, `v2/` — prior implementations and provenance, not silently modified.
- `SCIENTIFIC_AUDIT.md`, `CONTINUATION.md`, `SHA256SUMS.txt` — claims, next gates, integrity manifest.

## Key findings and limitations

- Delta memory with explicit keys and overwrite rules: 100% on the synthetic last-write-wins test for lengths 24/96/192 and additional length-1024 tests (two seeds), with a strong inductive bias and a task-specific encoding. It does not establish superiority to production Transformers, Titans, Mamba, or world-leading models.
- Transformer baseline reaches roughly 99%–100% at training length 24 but degrades markedly at length 192 in the logged tests; not matched in model size or total compute.
- Exact symbolic memory gives 100% by algorithm, not learning; its storage grows with retained facts.
- Versioned provenance and abstention are implemented **within a single process/session**, not as a cryptographically authenticated distributed database.
- Fibonacci spacing is an inductive choice. Evidence does not show an advantage over well-matched non-Fibonacci windows.

## Further research

See `CONTINUATION.md`. Do not claim independent SOTA status, production safety, cryptographic security or topology-of-universe evidence from these experiments. Use matched-compute public benchmarks and third-party reruns before any broad capability claims.