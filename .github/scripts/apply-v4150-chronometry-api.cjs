'use strict';
const fs=require('fs');
const p='index.html';
let s=fs.readFileSync(p,'utf8');
const anchor='/* ══ THE QUANTITY BUS ════════════════════════════════════════════════════════';
if((s.split(anchor).length-1)!==1) throw new Error('quantity-bus insertion anchor must be unique');
if(s.includes('const CHRONOMETRY_CASES=')) throw new Error('Chronometry API adapter already exists');

const block=`/* ══ ANCIENT CHRONOMETRY · SOURCE-LOCKED BROWSER PROJECTION ════════════════
   The exact arithmetic, source validation, conflict detection and falsification firewall
   live in core/labs/chronometry.source_locked.mjs and are independently verified. The
   browser needs a JSON-safe projection so agents, the manifest and the visual station can
   inspect the same adjudicated cases without importing a second numerical authority.

   IMPORTANT: these are source-qualified CASES, not a global table of units. A kṣaṇa in
   Abhidharmakośa is not silently averaged with a kṣaṇa in the Bhāgavata; the same rule
   holds for truṭi. Numerical proximity never promotes a historical expression to a
   modern physical identity. */
const CHRONOMETRY_CASES=Object.freeze({
  'jain.avasarpini':Object.freeze({
    case_id:'jain.avasarpini',status:'EXACT_TEXTUAL',quantity_kind:'symbolic_cycle_structure',
    source:'Jain avasarpini closure',closure_k:10,closure_years:0,
    dependent_42000:true,phase_consistent:false,comparison_status:'TEXTUAL_CLOSURE_ONLY'}),
  'jain.precession_21000':Object.freeze({
    case_id:'jain.precession_21000',status:'HYPOTHESIS',quantity_kind:'time_interval',
    source:'Jain 21000-year terminal duration',ancient_years:21000,
    dependent_42000:false,phase_consistent:false,comparison_status:'PHASE_ANCHOR_REQUIRED'}),
  'jain.obliquity_42000':Object.freeze({
    case_id:'jain.obliquity_42000',status:'HYPOTHESIS',quantity_kind:'time_interval',
    source:'Jain structural 42000-year subtraction',ancient_years:42000,
    dependent_42000:true,phase_consistent:false,comparison_status:'DEPENDENT_EVIDENCE'}),
  'source.ksana_conflict':Object.freeze({
    case_id:'source.ksana_conflict',status:'EXACT_TEXTUAL',quantity_kind:'source_definition_conflict',
    source:'Abhidharmakosa III.88-89 + Bhagavata 3.11.7-8',definition_count:2,
    dependent_42000:false,phase_consistent:false,comparison_status:'SAME_TERM_DIFFERENT_DEFINITION'}),
  'source.truti_conflict':Object.freeze({
    case_id:'source.truti_conflict',status:'EXACT_TEXTUAL',quantity_kind:'source_definition_conflict',
    source:'Arthasastra II.20 + Bhagavata 3.11.6-8 + Siddhantasiromani',definition_count:3,
    dependent_42000:false,phase_consistent:false,comparison_status:'SAME_TERM_DIFFERENT_DEFINITION'}),
  'astronomy.epoch_correction':Object.freeze({
    case_id:'astronomy.epoch_correction',status:'UNKNOWN',quantity_kind:'historical_period_benchmark',
    source:'Aryabhata + Daming + Shoushi source-locked benchmark registry',benchmark_count:6,
    dependent_42000:false,phase_consistent:false,comparison_status:'PENDING_EPOCH_CORRECTION'})
});
function chronometryCase(case_id){
  const r=CHRONOMETRY_CASES[case_id];
  if(!r) throw new RangeError('unknown chronometry case "'+case_id+'"; use one of '+Object.keys(CHRONOMETRY_CASES).join(', '));
  return {...r};
}
hccApiRegister({
  id:'chronometry', world:'cyc', lab:'chronometry',
  title:['Ancient Chronometry Observatory · source-locked cases',
         'Обсерватория древней хронометрии · источники зафиксированы',
         'Observatorium antiker Chronometrie · quellengebundene Fälle'],
  status:'SOURCE-LOCKED + FALSIFICATION-GATED; astronomy comparisons remain PENDING_EPOCH_CORRECTION',
  verifiers:['docs/verify-chronometry-source-locked.cjs','docs/verify-chronometry-falsification.cjs','docs/verify-ancient-astronomy-benchmarks.cjs'],
  formulas:[
    'avasarpini = 4K + 3K + 2K + (K - 42000 y) + 21000 y + 21000 y = 10K',
    '42000 y = 2 × 21000 y — dependent evidence, not a second independent coincidence'],
  inputs:[{name:'case_id',type:'string',default:'jain.avasarpini',
    doc:['Source-qualified case identifier','Идентификатор случая с привязкой к источнику','Quellengebundene Fall-ID']}],
  outputs:[
    {name:'status',unit:'1',quantity_kind:'epistemic_status',doc:['Adjudicated epistemic class','Эпистемический класс','Epistemische Klasse']},
    {name:'dependent_42000',unit:'1',quantity_kind:'boolean',doc:['Whether the 42000-year datum is structurally dependent','Структурная зависимость 42000 лет','Strukturelle Abhängigkeit von 42000 Jahren']},
    {name:'phase_consistent',unit:'1',quantity_kind:'boolean',doc:['True only after an independent phase-anchor test','Только после независимой фазовой проверки','Nur nach unabhängigem Phasenanker-Test']},
    {name:'comparison_status',unit:'1',quantity_kind:'epistemic_status',doc:['Comparison gate state','Состояние сравнительного шлюза','Status des Vergleichsgatters']}],
  limits:[
    'Same-name historical units remain source-qualified; no averaging or universal SI identity is inferred.',
    'Jain 21000 y ↔ climatic precession remains HYPOTHESIS until calendar, epoch, phase and look-elsewhere controls are satisfied.',
    'Jain 42000 y is dependent evidence because 42000 = 2 × 21000 inside the textual closure.',
    'All six Aryabhata/Daming/Shoushi bootstrap benchmarks remain PENDING_EPOCH_CORRECTION.',
    'Cross-domain numerical proximity cannot create a quantity identity or quantity-bus link.'],
  evaluate:({case_id})=>chronometryCase(case_id)
});

`;
s=s.replace(anchor,block+anchor);
fs.writeFileSync(p,s);
