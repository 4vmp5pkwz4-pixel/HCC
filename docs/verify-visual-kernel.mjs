/** Dependency-free math/layout coverage in the normal verifier router. */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const result=spawnSync(process.execPath,['--test','test/visual-kernel.test.mjs','test/s3-geometry.test.mjs','test/visual-device-lifecycle.test.mjs'],
  {cwd:fileURLToPath(new URL('..',import.meta.url)),stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
