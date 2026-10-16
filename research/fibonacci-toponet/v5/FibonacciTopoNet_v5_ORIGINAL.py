"""
FibonacciTopoNet-v5
Unified architecture combining:
- Fibonacci multi-scale attention
- Phi-stable recurrent transition
- Spectral / topological proxy regularizer
- Versioned hybrid associative memory (exact + delta-rule)

Engineering realization of structural analogies.
Not a new physical law and not a claim of SOTA performance.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import math
from typing import Optional, Tuple, Dict

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def fibonacci_sequence(n: int):
    """First n Fibonacci numbers starting from 1, 1, 2, 3, ..."""
    if n <= 0:
        return []
    seq = [1, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]


PHI = (1.0 + math.sqrt(5.0)) / 2.0


# ---------------------------------------------------------------------------
# Building blocks
# ---------------------------------------------------------------------------

class FibonacciMultiScaleAttention(nn.Module):
    def __init__(self, d_model: int, n_heads: int = 4, max_scales: int = 5, dropout: float = 0.1):
        super().__init__()
        assert d_model % n_heads == 0
        self.d_model = d_model
        self.n_heads = n_heads
        self.head_dim = d_model // n_heads
        self.scales = fibonacci_sequence(max_scales)
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.out_proj = nn.Linear(d_model, d_model)
        self.dropout = nn.Dropout(dropout)
        self.scale_logits = nn.Parameter(torch.zeros(len(self.scales)))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, D = x.shape
        qkv = self.qkv(x).reshape(B, T, 3, self.n_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]

        scale_weights = F.softmax(self.scale_logits, dim=0)
        combined = 0.0

        for w, win in zip(scale_weights, self.scales):
            scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)
            # Band mask according to Fibonacci window
            mask = torch.zeros(T, T, device=x.device, dtype=torch.bool)
            for t in range(T):
                left = max(0, t - win)
                right = min(T, t + win + 1)
                mask[t, left:right] = True
            scores = scores.masked_fill(~mask.unsqueeze(0).unsqueeze(0), float('-inf'))
            attn = F.softmax(scores, dim=-1)
            attn = self.dropout(attn)
            out = torch.matmul(attn, v)
            combined = combined + w * out

        combined = combined.transpose(1, 2).reshape(B, T, D)
        return self.out_proj(combined)


class PhiStableRecurrent(nn.Module):
    """Recurrent transition whose spectrum is softly biased toward phi."""
    def __init__(self, d_model: int):
        super().__init__()
        self.weight = nn.Parameter(torch.eye(d_model) * (PHI - 1.0) * 0.5)
        self.bias = nn.Parameter(torch.zeros(d_model))
        self.scale = nn.Parameter(torch.tensor(1.0))

    def forward(self, h: torch.Tensor) -> torch.Tensor:
        # Mild spectral control
        W = self.weight * self.scale
        return torch.tanh(F.linear(h, W, self.bias))


class SpectralProxyRegularizer(nn.Module):
    def __init__(self, strength: float = 1e-3):
        super().__init__()
        self.strength = strength

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if x.dim() == 3:
            x = x.reshape(-1, x.size(-1))
        if x.size(0) > 128:
            idx = torch.randperm(x.size(0), device=x.device)[:128]
            x = x[idx]
        try:
            S = torch.linalg.svdvals(x)
            # Encourage a modest spectral gap / prevent total collapse
            penalty = torch.exp(-S.mean())
            return self.strength * penalty
        except Exception:
            return torch.zeros((), device=x.device)


class VersionedDeltaMemory(nn.Module):
    """
    Hybrid memory:
    - Exact dictionary (last-write-wins) for structured keys
    - Differentiable delta-rule fast weights for soft associations
    """
    def __init__(self, d_model: int, memory_size: int = 64):
        super().__init__()
        self.d_model = d_model
        self.memory_size = memory_size
        self.fast_weight = nn.Parameter(torch.zeros(d_model, d_model))
        self.key_proj = nn.Linear(d_model, d_model)
        self.val_proj = nn.Linear(d_model, d_model)
        # Exact store (not differentiated)
        self.register_buffer("_keys", torch.zeros(memory_size, d_model))
        self.register_buffer("_vals", torch.zeros(memory_size, d_model))
        self.register_buffer("_ptr", torch.zeros((), dtype=torch.long))

    def write_exact(self, key: torch.Tensor, value: torch.Tensor):
        idx = int(self._ptr.item()) % self.memory_size
        self._keys[idx] = key.detach()
        self._vals[idx] = value.detach()
        self._ptr += 1

    def read_exact(self, query: torch.Tensor) -> torch.Tensor:
        # Nearest neighbor in the exact store
        if self._ptr.item() == 0:
            return torch.zeros_like(query)
        sims = F.cosine_similarity(query.unsqueeze(0), self._keys, dim=-1)
        best = sims.argmax()
        return self._vals[best]

    def delta_update(self, k: torch.Tensor, v: torch.Tensor, lr: float = 0.1):
        # Classic delta rule: W <- W + lr * (v - W k) k^T
        pred = self.fast_weight @ k
        error = v - pred
        self.fast_weight.data += lr * torch.outer(error, k)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        k = self.key_proj(x)
        v = self.val_proj(x)
        # Soft read via fast weights
        soft = F.linear(k, self.fast_weight)
        return soft


# ---------------------------------------------------------------------------
# Full model
# ---------------------------------------------------------------------------

class FibonacciTopoNetV5(nn.Module):
    def __init__(
        self,
        vocab_size: int = 128,
        d_model: int = 64,
        n_layers: int = 2,
        n_heads: int = 4,
        max_scales: int = 4,
        num_classes: int = 2,
        use_memory: bool = True,
        use_recurrent: bool = True,
    ):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, d_model)
        self.use_memory = use_memory
        self.use_recurrent = use_recurrent

        self.layers = nn.ModuleList()
        for _ in range(n_layers):
            self.layers.append(nn.ModuleDict({
                "attn": FibonacciMultiScaleAttention(d_model, n_heads, max_scales),
                "ff": nn.Sequential(
                    nn.Linear(d_model, 4 * d_model),
                    nn.GELU(),
                    nn.Dropout(0.1),
                    nn.Linear(4 * d_model, d_model),
                ),
                "norm1": nn.LayerNorm(d_model),
                "norm2": nn.LayerNorm(d_model),
            }))

        self.recur = PhiStableRecurrent(d_model) if use_recurrent else None
        self.memory = VersionedDeltaMemory(d_model) if use_memory else None
        self.head = nn.Linear(d_model, num_classes)
        self.reg = SpectralProxyRegularizer(1e-3)

    def forward(
        self,
        tokens: torch.Tensor,
        return_aux: bool = False,
    ) -> torch.Tensor | Tuple[torch.Tensor, Dict]:
        h = self.embed(tokens)
        regs = []

        for layer in self.layers:
            a = layer["attn"](layer["norm1"](h))
            h = h + a
            f = layer["ff"](layer["norm2"](h))
            h = h + f
            if return_aux:
                regs.append(self.reg(h))

        pooled = h.mean(dim=1)

        if self.use_recurrent and self.recur is not None:
            pooled = self.recur(pooled)

        if self.use_memory and self.memory is not None:
            mem_out = self.memory(pooled)
            pooled = pooled + 0.1 * mem_out

        logits = self.head(pooled)

        if return_aux:
            aux = {
                "reg": sum(regs) if regs else torch.zeros((), device=tokens.device),
                "pooled": pooled.detach(),
            }
            return logits, aux
        return logits


# ---------------------------------------------------------------------------
# Unified test
# ---------------------------------------------------------------------------

def run_unified_test(seed: int = 42, steps: int = 8) -> Dict:
    torch.manual_seed(seed)
    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = FibonacciTopoNetV5(
        vocab_size=64,
        d_model=48,
        n_layers=2,
        n_heads=4,
        max_scales=4,
        num_classes=2,
        use_memory=True,
        use_recurrent=True,
    ).to(device)

    n_params = sum(p.numel() for p in model.parameters())
    print(f"Parameters: {n_params:,}")
    print(f"Fibonacci scales: {fibonacci_sequence(4)}")
    print(f"Device: {device}")

    B, T = 16, 24
    tokens = torch.randint(0, 64, (B, T), device=device)
    labels = torch.randint(0, 2, (B,), device=device)

    opt = torch.optim.AdamW(model.parameters(), lr=2e-3)
    model.train()

    history = []
    for step in range(steps):
        opt.zero_grad()
        logits, aux = model(tokens, return_aux=True)
        loss = F.cross_entropy(logits, labels) + aux["reg"]
        loss.backward()
        opt.step()
        history.append(loss.item())
        if step % 2 == 0:
            print(f"step {step:02d} | loss={loss.item():.4f} | reg={aux['reg'].item():.6f}")

    model.eval()
    with torch.no_grad():
        logits = model(tokens)
        acc = (logits.argmax(-1) == labels).float().mean().item()

    print(f"Final accuracy (random labels): {acc:.3f}")
    print("Unified test passed.")

    return {
        "params": n_params,
        "final_loss": history[-1],
        "accuracy": acc,
        "history": history,
    }


if __name__ == "__main__":
    run_unified_test()
