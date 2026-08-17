/* Release identity for the computational core.
   The core is versioned INDEPENDENTLY of the visual atlas: a reader upgrading the scene
   must not silently change a number an agent depends on.

   1.2.0 — eight kernels EXTRACTED from the atlas rather than retyped (fbs.zero_point_ladder,
           fibonacci.anyons, capacity.conditional_selector, edge.admissibility_no_go,
           s3.spectral_operator, bianchi_ix.evolution, s3.particle_creation,
           s3.ebk_quantisation), JSON-RPC 2.0 MCP over Streamable HTTP, and job execution on
           worker threads with a bounded queue.

   1.3.0 — six kernels for the trace-free de Sitter CIVP chain (civp.cp1_locking,
           civp.embadon_measure, civp.finite_index, civp.finite_carrier, civp.uv_selector,
           civp.closure). Their mathematics lives in core/civp/, imports nothing from node,
           and is loaded unchanged by civp.html — so the three-dimensional observatory and
           the API answer with the same code rather than with two transcriptions of it. */
export const CORE_VERSION = '1.3.0';
export const CORE_SCHEMA  = 'hcc.core/1';
export const RESULT_SCHEMA = 'hcc.result/2';
