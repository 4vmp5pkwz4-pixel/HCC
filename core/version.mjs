/* Release identity for the computational core.
   The core is versioned INDEPENDENTLY of the visual atlas: a reader upgrading the scene
   must not silently change a number an agent depends on.

   1.2.0 — eight kernels EXTRACTED from the atlas rather than retyped (fbs.zero_point_ladder,
           fibonacci.anyons, capacity.conditional_selector, edge.admissibility_no_go,
           s3.spectral_operator, bianchi_ix.evolution, s3.particle_creation,
           s3.ebk_quantisation), JSON-RPC 2.0 MCP over Streamable HTTP, and job execution on
           worker threads with a bounded queue. */
export const CORE_VERSION = '1.2.0';
export const CORE_SCHEMA  = 'hcc.core/1';
export const RESULT_SCHEMA = 'hcc.result/2';
