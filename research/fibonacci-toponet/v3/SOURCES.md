# Sources consulted (checked 16 October 2026)

The following are **external scientific precedents/inspirations**. This project did not reproduce their training, benchmarks, weights, architectures or results. The research literature contains no evidence that Fibonacci scales are universally optimal.

| Lab / source | Public reference | Engineering correspondence | NOT implemented here |
|---|---|---|---|
| OpenAI | https://openai.com/index/introducing-gpt-oss/ | alternation of local attention and other computation; source motivates separating local pathway from global pathway | gpt-oss weights, MoE, RoPE, grouped-query attention |
| Google Research | https://research.google/pubs/titans-learning-to-memorize-at-test-time/ | local attention complemented by persistent memory | Titans test-time learning machinery |
| Google DeepMind | https://deepmind.google/research/publications/121073/ | compressed multi-timescale memory for long sequences | MELODI memory hierarchy |
| Google Research | https://research.google/blog/introducing-nested-learning-a-new-ml-paradigm-for-continual-learning/ | future direction: multi-rate update and continual learning | Hope/Nested Learning self-modification |
| Meta FAIR | https://ai.meta.com/research/sam2/ | explicit streaming memory principle | SAM 2 image/video pipeline |
| Meta AI | https://ai.meta.com/research/publications/memory-layers-at-scale/ | prospective retrieval memory alternative | sparse trainable KV memory layers |
| Mamba-2 (Dao & Gu) | https://proceedings.mlr.press/v235/dao24a.html | mathematical connection of attention and SSMs; motivates separate recurrent pathway | SSD matrix kernels, Mamba-2 parameterization |
| Anthropic | https://www.transformer-circuits.pub/2025/attribution-graphs/methods.html | structured audit & mechanistic verification as future step | attribution-graph circuit tracing |
| Cohen & Welling | https://proceedings.mlr.press/v48/cohenc16.html | symmetry, equivariance, explicit group averaging | group-equivariant convolution layers |
| OpenAI Math | https://github.com/openai/math | care with proof artifacts, explicit assumptions and independent checks | no claimed import of unverified theorems |
| Project manuscript | `META_CAUSAL_S3_244_PRD.tex` (local provenance, not redistributed in full) | Reynolds projectors, spectral observability, Gaussian Fisher/Schur, verification discipline | Einstein-Boltzmann theory, tensor CMB solver, quantum gravity |

The selected references are a **targeted survey**, not every publicly available research paper or catalogue from every leading AI organization.