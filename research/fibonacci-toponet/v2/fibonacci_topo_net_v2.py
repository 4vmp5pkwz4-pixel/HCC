"""FibonacciTopoNet v2: falsifiable *engineering* experiment.

Changes relative to uploaded prototype:
  - genuine, contractive Fibonacci companion recurrence (not 0.5 * identity);
  - locally computed attention, O(B H T W d) rather than O(B H T^2);
  - distinct Fibonacci scales and explicit matched-control scales;
  - sinusoidal positions and directional relative-position attention bias;
  - centered covariance spectral-dispersion penalty (NOT persistent homology).

Neither this model nor its regularizer establishes a new physical law.
"""
from __future__ import annotations
import math
import torch
from torch import nn
from torch.nn import functional as F

PHI = (1 + math.sqrt(5)) / 2


def fibonacci_scales(n: int) -> list[int]:
    if n <= 0:
        raise ValueError('n must be positive')
    out = [1, 2]
    while len(out) < n:
        out.append(out[-1] + out[-2])
    return out[:n]


class LocalMultiScaleAttention(nn.Module):
    def __init__(self, d_model=32, n_heads=4, scales=(1, 2, 3, 5), dropout=0.):
        super().__init__()
        if d_model % n_heads:
            raise ValueError('d_model must divide n_heads')
        scales = tuple(int(v) for v in scales)
        if not scales or any(v < 0 for v in scales):
            raise ValueError('scales must be nonempty and nonnegative')
        self.scales = scales
        self.max_window = max(scales)
        self.d_model = d_model
        self.n_heads = n_heads
        self.head_dim = d_model // n_heads
        self.qkv = nn.Linear(d_model, 3 * d_model)
        self.out = nn.Linear(d_model, d_model)
        self.rel_bias = nn.Parameter(torch.zeros(n_heads, 2 * self.max_window + 1))
        self.scale_logits = nn.Parameter(torch.zeros(len(scales)))
        self.drop = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, t, d = x.shape
        h, dh, w = self.n_heads, self.head_dim, self.max_window
        qkv = self.qkv(x).reshape(b, t, 3, h, dh).permute(2, 0, 3, 1, 4)
        q, k, v = qkv.unbind(0)  # (B,H,T,Dh)
        # Unfold produces (B,H,T,Dh,2W+1).
        k_pad = F.pad(k, (0, 0, w, w))
        v_pad = F.pad(v, (0, 0, w, w))
        k_win = k_pad.unfold(2, 2 * w + 1, 1).permute(0, 1, 2, 4, 3)
        v_win = v_pad.unfold(2, 2 * w + 1, 1).permute(0, 1, 2, 4, 3)
        scores = torch.sum(q.unsqueeze(3) * k_win, dim=-1) / math.sqrt(dh)
        scores = scores + self.rel_bias[None, :, None, :]
        offsets = torch.arange(-w, w + 1, device=x.device)
        target = torch.arange(t, device=x.device)[:, None] + offsets[None, :]
        in_seq = (target >= 0) & (target < t)
        contributions = []
        for scale in self.scales:
            valid = in_seq & (offsets.abs()[None, :] <= scale)
            alpha = torch.softmax(scores.masked_fill(~valid[None, None, :, :], -torch.inf), -1)
            alpha = self.drop(alpha)
            contributions.append(torch.sum(alpha[..., None] * v_win, dim=-2))
        mixing = torch.softmax(self.scale_logits, 0)
        combined = sum(mixing[i] * item for i, item in enumerate(contributions))
        return self.out(combined.transpose(1, 2).reshape(b, t, d))


class ContractiveFibonacciCell(nn.Module):
    """Normalized companion blocks, with provable Lipschitz constant <= 0.9.

    W=0.8 kron(I, [[1,1],[1,0]]/phi) + 0.1*tanh(delta)/d.
    By triangle and Frobenius norm bounds, ||W||_2 <=0.9.
    """
    def __init__(self, d_model: int, steps=2):
        super().__init__()
        if d_model % 2 != 0:
            raise ValueError('even d_model required')
        companion = torch.tensor([[1., 1.], [1., 0.]]) / PHI
        self.register_buffer('companion', torch.kron(torch.eye(d_model // 2), companion))
        self.delta = nn.Parameter(torch.randn(d_model, d_model) * 0.02)
        self.bias = nn.Parameter(torch.zeros(d_model))
        self.steps = int(steps)

    def transition(self):
        d = self.companion.shape[0]
        return 0.8 * self.companion + 0.1 * torch.tanh(self.delta) / d

    def forward(self, h):
        w = self.transition()
        for _ in range(self.steps):
            h = torch.tanh(F.linear(h, w, self.bias))
        return h


class CovarianceSpectralPenalty(nn.Module):
    """Penalize covariance eigenvalue dispersion, not a homology invariant."""
    def __init__(self, strength=0.0005):
        super().__init__()
        self.strength = strength

    def forward(self, x):
        x = x.reshape(-1, x.shape[-1])
        x = x - x.mean(dim=0, keepdim=True)
        covariance = (x.T @ x) / max(x.shape[0] - 1, 1)
        ev = torch.linalg.eigvalsh(covariance).clamp_min(0.)
        ev = ev / (ev.mean().clamp_min(1e-8))
        return self.strength * ((ev - 1.) ** 2).mean()


class FibonacciTopoNetV2(nn.Module):
    def __init__(self, vocab_size=32, d_model=32, n_layers=2, n_heads=4,
                 scales=(1, 2, 3, 5), num_classes=2, dropout=0.):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, d_model)
        self.pos_scale = nn.Parameter(torch.tensor(1.))
        self.layers = nn.ModuleList([
            nn.ModuleDict({
                'attn': LocalMultiScaleAttention(d_model, n_heads, scales, dropout),
                'ff': nn.Sequential(nn.Linear(d_model, 2*d_model), nn.GELU(), nn.Linear(2*d_model, d_model)),
                'norm1': nn.LayerNorm(d_model),
                'norm2': nn.LayerNorm(d_model),
            }) for _ in range(n_layers)
        ])
        self.pool_score = nn.Linear(d_model, 1)
        self.recur = ContractiveFibonacciCell(d_model, steps=2)
        self.head = nn.Linear(d_model, num_classes)
        self.reg = CovarianceSpectralPenalty()

    def forward(self, token_ids, return_reg=False):
        if token_ids.dim() != 2:
            raise ValueError('expected token ids (B,T)')
        b, t = token_ids.shape
        d = self.embed.embedding_dim
        pos = torch.arange(t, device=token_ids.device, dtype=self.embed.weight.dtype)[:, None]
        freqs = torch.exp(torch.arange(0, d, 2, device=token_ids.device,
                                       dtype=pos.dtype) * (-math.log(10000) / d))
        embpos = torch.zeros(t, d, device=token_ids.device, dtype=pos.dtype)
        embpos[:, 0::2] = torch.sin(pos * freqs)
        embpos[:, 1::2] = torch.cos(pos * freqs)
        x = self.embed(token_ids) + self.pos_scale * embpos[None, ...]
        penalty = x.new_zeros(())
        for lay in self.layers:
            x = x + lay['attn'](lay['norm1'](x))
            x = x + lay['ff'](lay['norm2'](x))
            if return_reg:
                penalty = penalty + self.reg(x)
        weights = torch.softmax(self.pool_score(x).squeeze(-1), dim=-1)
        pooled = torch.sum(x * weights[..., None], dim=1)
        logits = self.head(self.recur(pooled))
        return (logits, penalty) if return_reg else logits


class ReversalInvariantWrapper(nn.Module):
    """Exact Z2-invariant predictor. Use only when reversal is a true symmetry."""
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, x):
        return 0.5 * (self.model(x) + self.model(x.flip(dims=(1,))))