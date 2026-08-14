/* ── ONE JOB, ONE THREAD ─────────────────────────────────────────────────────
   Before this, every "asynchronous" run was a setImmediate on the main thread: the API
   returned 202 honestly and then blocked the event loop for the whole computation, so a
   second agent's health check waited behind somebody else's Bianchi IX integration. A job
   that cannot be interrupted is not a job, it is a slow request with a receipt.

   The worker imports the SAME core module the synchronous path uses. There is no second
   implementation of anything here — only a different thread to put it on. */
import { parentPort, workerData } from 'node:worker_threads';
import { CORE } from '../core/index.mjs';

const { lab_id, input } = workerData;
let cancelled = false;
parentPort.on('message', m => { if (m && m.cancel) cancelled = true; });

try {
  const result = CORE.run(lab_id, input, {
    onProgress: p => parentPort.postMessage({ type: 'progress', progress: p }),
    isCancelled: () => cancelled
  });
  parentPort.postMessage(cancelled ? { type: 'cancelled' } : { type: 'result', result });
} catch (e) {
  parentPort.postMessage({ type: 'error',
    error: { code: e.code || 'ERROR', message: e.message, detail: e.detail || null } });
}
