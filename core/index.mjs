/* Canonical HCC core facade.
   The historical implementation is preserved byte-for-byte in base-index.mjs so the
   phase engine can extend the public CORE without duplicating or rewriting 180 kB of
   laboratory authority. This facade is now the hash boundary seen by consumers. */
export * from './base-index.mjs';
import { LABS, CORE as BASE_CORE, PROVENANCE as BASE_PROVENANCE } from './base-index.mjs';
import { HCC_PHASE, combinedCoreCodeHash } from './phase/runtime.mjs';

export const PROVENANCE=Object.freeze({
  commit:BASE_PROVENANCE.commit,
  code_sha256:combinedCoreCodeHash()
});

const restamp=out=>out&&typeof out==='object'&&!Array.isArray(out)
  ? {...out,git_commit:PROVENANCE.commit,code_sha256:PROVENANCE.code_sha256}
  : out;

export const CORE={
  ...BASE_CORE,
  provenance:PROVENANCE,
  phase:HCC_PHASE,
  run(id,input,ctx={}){
    const l=LABS.get(id);
    if(!l) throw Object.assign(new Error(`no laboratory "${id}"`),{code:'NOT_FOUND'});
    return l.run(input,{...ctx,provenance:PROVENANCE});
  },
  sweep(id,input){
    const l=LABS.get(id);
    if(!l) throw Object.assign(new Error('no such lab'),{code:'NOT_FOUND'});
    return l.sweep(input,{provenance:PROVENANCE});
  },
  validate(id){
    const l=LABS.get(id);
    if(!l) throw Object.assign(new Error('no such lab'),{code:'NOT_FOUND'});
    return l.validate({},{provenance:PROVENANCE});
  },
  connections(...args){return restamp(BASE_CORE.connections(...args));},
  measurements(...args){return restamp(BASE_CORE.measurements(...args));},
  openProblems(...args){return restamp(BASE_CORE.openProblems(...args));}
};
