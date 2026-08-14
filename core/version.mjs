/* Release identity for the computational core.
   The core is versioned INDEPENDENTLY of the visual atlas: a reader upgrading the scene
   must not silently change a number an agent depends on. */
export const CORE_VERSION = '1.0.0';
export const CORE_SCHEMA  = 'hcc.core/1';
export const RESULT_SCHEMA = 'hcc.result/2';
