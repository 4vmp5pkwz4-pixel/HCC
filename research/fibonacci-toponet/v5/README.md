# FibonacciTopoNet v5.1 — audited research snapshot (2026-10-16)

Self-contained, local research prototype built from the user's `FibonacciTopoNet_v5.py` (preserved verbatim as `FibonacciTopoNet_v5_ORIGINAL.py`). The corrected model is **not pretrained** and is **not a frontier LLM**.

## What changed

- **Causal local attention:** explicit strict no-future information flow, sliding Fibonacci windows `[1, 2, 3, 5]` without constructing dense `T×T` attention matrices.
- **Sequence order:** sinusoidal positional features, causal processing and final recurrent state distinguish reverse sequences.
- **Bounded recurrent memory:** genuine 2×2 Fibonacci companion blocks, with `||W||₂≤0.93` by construction, gated bounded hidden state.
- **Differentiable fast weights:** functional delta-rule state per batch example, no `.data` writes and no implicit persistent cross-request state.
- **Exact versioned memory:** explicit separately managed last-write-wins store, deletion, provenance, explicit link semantics, cycle/budget/unknown abstention. This is algorithmic storage, **not learned semantic memory**.
- **Centered covariance diversity penalty:** inverse-effective-rank proxy distinguishes rank collapse from isotropic features; **not** persistent homology or Hodge regularization.
- **Actual quotient-projector primitive:** `CyclicS3Projector(n,p,character)` operates on a specific `SU(2)_L` harmonic weight basis. It matches the finite cyclic group average and resolves twisted character sectors. It is **not** applied to arbitrary text embeddings or evidence of quantum gravity.

## Quickstart

```bash
pip install -r requirements.txt
python verify_v5_1.py
python benchmark_order.py
```

Demonstration model:

```python
import torch
from fibonacci_topo_net_v5_1 import FibonacciTopoNetV5_1, create_exact_session, MemoryLink, CyclicS3Projector
model=FibonacciTopoNetV5_1(vocab_size=128,d_model=48,n_layers=2)
logits=model(torch.randint(0,128,(2,16)))
store=create_exact_session(capacity=100)
store.write('A',42)
store.write('B',MemoryLink('A'))
assert store.follow('B').value == 42
p=CyclicS3Projector(n=2,p=5)
projected=p(torch.randn(2,9, dtype=torch.complex128))
```

The model's exact store is a separate session object. It does not secretly read or write persistent external data. The neural fast weights are temporary per forward call.

## Results

`verify_v5_1.py`: **2,825 structural checks**, zero failures. Benchmark with independent reversed-label pairs, 220 optimization steps and seeds 17/29: original v5 achieved **50%/50%** at length 12 and length 24, while v5.1 achieved **100%/100%** at length 12 and **99.8047%/100%** at length 24. Those values are on a very narrow synthetic marker-order task. The evaluation contains 512 held-out examples per run/length; train length was 12.

## Checkpoints and reproducibility

`checkpoints/` holds four `state_dict` files, including both baselines. Use `torch.load(file, map_location='cpu',weights_only=True)` and instantiate with the exact benchmark configuration (`vocab_size=16,d_model=24,n_layers=1,n_heads=4,max_scales=4,num_classes=2`). `ORDER_BENCHMARK.json` includes time, parameters and per-seed accuracy. `SHA256SUMS.txt` records content integrity.

## Limits and nonclaims

- No broad language modeling, long-term factual accuracy, efficient inference benchmark, TDA persistence diagrams, neural scaling claims, or public SOTA score.
- Exact discrete group selection refers to a specified harmonic basis and group embedding, not neural embeddings in general.
- The source manuscript META-CAUSAL/S³ remains an independent conditional research project; no proof of physical topology, LQG dynamics, or quantum gravity follows from this engineering implementation.
- This snapshot does not automatically modify the production HCC app; review/approval is required before merging the research branch.
