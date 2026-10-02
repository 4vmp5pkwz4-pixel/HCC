import {defineLab} from '../contract.mjs';
import {geometryAudit} from '../research/geometry.mjs';
export default defineLab({
 id:'cosmology.geometry_audit',title:'FLRW reference versus DESI DR2 Lyα geometry',status:'REFERENCE_MODEL',strict_inputs:true,
 model_id:'flrw.cpl.desi-lya-compressed.v1',
 inputs:[{name:'H0',type:'number',unit:'km/s/Mpc',default:67.4,min:1,max:200},{name:'OmegaM',type:'number',unit:'1',default:.315,min:0,max:2},{name:'OmegaR',type:'number',unit:'1',default:.00009,min:0,max:1},{name:'OmegaK',type:'number',unit:'1',default:0,min:-1,max:1},{name:'w0',type:'number',unit:'1',default:-1,min:-3,max:3},{name:'wa',type:'number',unit:'1',default:0,min:-5,max:5},{name:'rd',type:'number',unit:'Mpc',default:147.1,min:1,max:500}],
 outputs:[{name:'audit',type:'object',unit:null,doc:'Full model/reference comparison at measured z=2.33, covariance, alternatives and provenance.'}],
 assumptions:['FLRW constant curvature with explicit CPL dark energy and radiation','DESI 2607.27410v3 Eq26 Gaussian distance compression, rho=0.225','Pair/AP overlap: chi² alternatives never combined; no fit or empirical confirmation'],
 domain_of_validity:['H(z)² positive throughout light cone; ΩDE≥0; before closed antipode'],
 formulas:['DM=(c/H0)S_k(∫ dz/E)','F_AP=DM/DH','χ²=(prediction−data)^T C^−1 (prediction−data)'],
 verifiers:['test/geometry-evidence.test.mjs'],falsifiers:['Flat EdS distance differs from its analytic solution','AP changes under rd scaling','Correlated Gaussian comparison ignores rho'],
 evaluate(i){const audit=geometryAudit(i);return {outputs:{audit},warnings:audit.warnings,diagnostics:{empirical_validation:false}};},
 selftests:[{name:'AP cancels rd',run(lab){const a=lab.run({rd:120}),b=lab.run({rd:180});return {pass:Math.abs(a.outputs.audit.model.AP-b.outputs.audit.model.AP)<1e-12};}}]
});
