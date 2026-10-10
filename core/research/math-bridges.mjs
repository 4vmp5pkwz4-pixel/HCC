/** Catalogue search and bridge interpretation; never a scientific status promoter. */
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function searchMathCatalog(catalog,{query='',discipline='',artifactOnly=false}={}){
 const normalized=normalize(query),familyID=/^\d{3}$/.test(normalized)?normalized:null;
 const tokens=normalized.split(' ').filter(Boolean);
 return catalog.families.filter(f=>(!discipline||f.discipline===discipline)&&(!artifactOnly||f.lean_family_document)&&
  (familyID?f.id===familyID:tokens.every(t=>normalize([f.id,f.title,f.description,...f.papers.flatMap(p=>[p.title,p.abstract])].join(' ')).includes(t))));
}
export function bridgeVerdict(bridge){
 const kind=['direct','method','conditional','blocked'].includes(bridge.bridge)?bridge.bridge:'conditional';
 return {kind,closed:false,epistemic_status:'hypothetical',
  reason:kind==='blocked'?'Source hypotheses do not match the HCC target.':'A source theorem or artifact does not supply the missing source-to-target proof.',
  lean_verified_here:false,independently_verified_here:false};
}
