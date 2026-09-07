export const TIME_DOMAIN_KIND = Object.freeze({
  ABSOLUTE_EPOCH: 'ABSOLUTE_EPOCH',
  DERIVED_PERIODIC_PHASE: 'DERIVED_PERIODIC_PHASE',
  PHYSICAL_LOCAL_TIME: 'PHYSICAL_LOCAL_TIME',
  PARAMETRIZATION_TIME: 'PARAMETRIZATION_TIME',
  ITERATION_INDEX: 'ITERATION_INDEX',
  SPATIAL_INDEX: 'SPATIAL_INDEX',
  RENDER_TIME: 'RENDER_TIME',
});

export const STATE_SCOPE = Object.freeze({
  GLOBAL_PHYSICS: 'GLOBAL_PHYSICS',
  SHARED_PHYSICS: 'SHARED_PHYSICS',
  LAB_LOCAL: 'LAB_LOCAL',
  VIEW_ONLY: 'VIEW_ONLY',
});

export const CLOCK_STATUS = Object.freeze({
  EXACT: 'EXACT',
  NUMERICAL: 'NUMERICAL',
  MODEL_DEPENDENT: 'MODEL_DEPENDENT',
  STATISTICAL: 'STATISTICAL',
  NO_EXCHANGE: 'NO_EXCHANGE',
});

function freezeRecord(record) {
  return Object.freeze({...record});
}

export const TIME_DOMAINS = Object.freeze([
  freezeRecord({id:'atlas.epoch', kind:TIME_DOMAIN_KIND.ABSOLUTE_EPOCH, unit:'day[J2000]', promotable:true, provenance:'AtlasTime authority'}),
  freezeRecord({id:'solar.epoch', kind:TIME_DOMAIN_KIND.ABSOLUTE_EPOCH, unit:'day[J2000]', promotable:true, provenance:'Solar ephemeris projection of AtlasTime'}),
  freezeRecord({id:'cycles.epoch', kind:TIME_DOMAIN_KIND.ABSOLUTE_EPOCH, unit:'day[J2000]', promotable:true, provenance:'Cycles projection of AtlasTime'}),
  freezeRecord({id:'saros.phase', kind:TIME_DOMAIN_KIND.DERIVED_PERIODIC_PHASE, unit:'cycle', promotable:false, provenance:'Cycles Saros period/anchor'}),
  freezeRecord({id:'antikythera.phase', kind:TIME_DOMAIN_KIND.DERIVED_PERIODIC_PHASE, unit:'cycle', promotable:false, provenance:'Antikythera declared mean periods'}),
  freezeRecord({id:'precession.phase', kind:TIME_DOMAIN_KIND.DERIVED_PERIODIC_PHASE, unit:'cycle', promotable:false, provenance:'Atlas precession model'}),
  freezeRecord({id:'galactic.phase', kind:TIME_DOMAIN_KIND.DERIVED_PERIODIC_PHASE, unit:'cycle', promotable:false, provenance:'Atlas galactic-year model'}),
  freezeRecord({id:'relativity.coordinate_time', kind:TIME_DOMAIN_KIND.PHYSICAL_LOCAL_TIME, unit:'model-time', promotable:false, provenance:'Relativity laboratory coordinate chart'}),
  freezeRecord({id:'relativity.proper_time', kind:TIME_DOMAIN_KIND.PHYSICAL_LOCAL_TIME, unit:'proper-time', promotable:false, provenance:'Relativity worldline clock'}),
  freezeRecord({id:'ks.physical_t', kind:TIME_DOMAIN_KIND.PHYSICAL_LOCAL_TIME, unit:'model-time', promotable:false, provenance:'KS regularized dynamics physical t'}),
  freezeRecord({id:'ks.regularizer_s', kind:TIME_DOMAIN_KIND.PARAMETRIZATION_TIME, unit:'regularizer-s', promotable:false, provenance:'KS fictitious regularization parameter'}),
  freezeRecord({id:'mixmaster.tau', kind:TIME_DOMAIN_KIND.PARAMETRIZATION_TIME, unit:'tau', promotable:false, provenance:'Mixmaster volume-time parametrization'}),
  freezeRecord({id:'standard_map.iteration', kind:TIME_DOMAIN_KIND.ITERATION_INDEX, unit:'iteration', promotable:false, provenance:'Standard map kick index; kick period undeclared'}),
  freezeRecord({id:'anderson.site', kind:TIME_DOMAIN_KIND.SPATIAL_INDEX, unit:'site', promotable:false, provenance:'Anderson transfer-matrix spatial index'}),
  freezeRecord({id:'lorenz.flow_time', kind:TIME_DOMAIN_KIND.PHYSICAL_LOCAL_TIME, unit:'lorenz-time', promotable:false, provenance:'Lorenz flow integration time'}),
  freezeRecord({id:'lorenz.poincare_iteration', kind:TIME_DOMAIN_KIND.ITERATION_INDEX, unit:'iteration', promotable:false, provenance:'Successive maxima Poincare return map'}),
  freezeRecord({id:'render.monotonic', kind:TIME_DOMAIN_KIND.RENDER_TIME, unit:'second[monotonic]', promotable:false, provenance:'Browser/XR monotonic frame clock'}),
]);

export const CLOCK_ADAPTERS = Object.freeze([
  freezeRecord({source:'atlas.epoch', target:'solar.epoch', status:CLOCK_STATUS.EXACT, units:Object.freeze({source:'day[J2000]',target:'day[J2000]'}), relation:'identity', validity:'declared Solar ephemeris epoch domain', invertible:true, provenance:'shared Atlas epoch'}),
  freezeRecord({source:'solar.epoch', target:'atlas.epoch', status:CLOCK_STATUS.EXACT, units:Object.freeze({source:'day[J2000]',target:'day[J2000]'}), relation:'identity', validity:'declared Solar ephemeris epoch domain', invertible:true, provenance:'shared Atlas epoch'}),
  freezeRecord({source:'atlas.epoch', target:'cycles.epoch', status:CLOCK_STATUS.EXACT, units:Object.freeze({source:'day[J2000]',target:'day[J2000]'}), relation:'identity', validity:'declared Cycles epoch domain', invertible:true, provenance:'shared Atlas epoch'}),
  freezeRecord({source:'cycles.epoch', target:'atlas.epoch', status:CLOCK_STATUS.EXACT, units:Object.freeze({source:'day[J2000]',target:'day[J2000]'}), relation:'identity', validity:'declared Cycles epoch domain', invertible:true, provenance:'shared Atlas epoch'}),
  freezeRecord({source:'atlas.epoch', target:'saros.phase', status:CLOCK_STATUS.EXACT, units:Object.freeze({source:'day[J2000]',target:'cycle'}), relation:'periodic_modulo_declared_period_anchor', validity:'Saros model validity domain', invertible:false, provenance:'Cycles Saros engine'}),
  freezeRecord({source:'atlas.epoch', target:'antikythera.phase', status:CLOCK_STATUS.EXACT, units:Object.freeze({source:'day[J2000]',target:'cycle'}), relation:'periodic_modulo_declared_period_anchor', validity:'declared Antikythera mean-period model', invertible:false, provenance:'Cycles Antikythera mechanism'}),
  freezeRecord({source:'atlas.epoch', target:'precession.phase', status:CLOCK_STATUS.MODEL_DEPENDENT, units:Object.freeze({source:'day[J2000]',target:'cycle'}), relation:'epoch_to_model_phase', validity:'declared precession model domain', invertible:false, provenance:'Atlas precession model'}),
  freezeRecord({source:'atlas.epoch', target:'galactic.phase', status:CLOCK_STATUS.MODEL_DEPENDENT, units:Object.freeze({source:'day[J2000]',target:'cycle'}), relation:'epoch_to_model_phase', validity:'declared galactic-year model domain', invertible:false, provenance:'Atlas galactic motion model'}),
  freezeRecord({source:'relativity.coordinate_time', target:'relativity.proper_time', status:CLOCK_STATUS.MODEL_DEPENDENT, units:Object.freeze({source:'model-time',target:'proper-time'}), relation:'worldline_metric_integral', validity:'declared metric/worldline domain', invertible:true, provenance:'Relativity laboratory metric relation'}),
  freezeRecord({source:'relativity.proper_time', target:'relativity.coordinate_time', status:CLOCK_STATUS.MODEL_DEPENDENT, units:Object.freeze({source:'proper-time',target:'model-time'}), relation:'inverse_worldline_metric_integral_when_monotonic', validity:'declared metric/worldline monotonic domain', invertible:true, provenance:'Relativity laboratory metric relation'}),
  freezeRecord({source:'ks.regularizer_s', target:'ks.physical_t', status:CLOCK_STATUS.MODEL_DEPENDENT, units:Object.freeze({source:'regularizer-s',target:'model-time'}), relation:'trajectory_integral_dt_ds', validity:'KS trajectory where dt/ds is defined', invertible:false, provenance:'KS regularized dynamics'}),
  freezeRecord({source:'lorenz.poincare_iteration', target:'lorenz.flow_time', status:CLOCK_STATUS.STATISTICAL, units:Object.freeze({source:'iteration',target:'lorenz-time'}), relation:'mean_return_time_exchange_rate', validity:'measured invariant-measure return statistics', invertible:false, meanReturnTime:0.7509, provenance:'docs/verify-clock-exchange.cjs'}),
]);

export const STATE_SCOPES = Object.freeze([
  freezeRecord({id:'atlas.epoch', scope:STATE_SCOPE.GLOBAL_PHYSICS, provenance:'AtlasTime'}),
  freezeRecord({id:'atlas.rate_days_per_second', scope:STATE_SCOPE.GLOBAL_PHYSICS, provenance:'AtlasTime'}),
  freezeRecord({id:'atlas.paused', scope:STATE_SCOPE.GLOBAL_PHYSICS, provenance:'AtlasTime'}),
  freezeRecord({id:'atlas.reference_frame', scope:STATE_SCOPE.GLOBAL_PHYSICS, provenance:'root physical interpretation'}),
  freezeRecord({id:'shared.parameter', scope:STATE_SCOPE.SHARED_PHYSICS, provenance:'declared integration/link registry'}),
  freezeRecord({id:'lab.experiment_state', scope:STATE_SCOPE.LAB_LOCAL, provenance:'owning laboratory'}),
  freezeRecord({id:'view.camera', scope:STATE_SCOPE.VIEW_ONLY, provenance:'navigation/view state'}),
  freezeRecord({id:'view.selection', scope:STATE_SCOPE.VIEW_ONLY, provenance:'navigation/view state'}),
]);

const DOMAIN_BY_ID = new Map(TIME_DOMAINS.map(domain => [domain.id, domain]));
const SCOPE_BY_ID = new Map(STATE_SCOPES.map(scope => [scope.id, scope]));
const ADAPTER_BY_ROUTE = new Map(CLOCK_ADAPTERS.map(adapter => [`${adapter.source}\u0000${adapter.target}`, adapter]));

export function domainById(id) {
  const domain = DOMAIN_BY_ID.get(id);
  if (!domain) throw new RangeError(`unknown time domain: ${id}`);
  return domain;
}

export function stateScopeById(id) {
  const scope = SCOPE_BY_ID.get(id);
  if (!scope) throw new RangeError(`unknown state scope id: ${id}`);
  return scope;
}

export function canPromoteToAtlasEpoch(domainId) {
  const domain = domainById(domainId);
  return domain.kind === TIME_DOMAIN_KIND.ABSOLUTE_EPOCH && domain.promotable === true;
}

function noExchange(source, target) {
  return Object.freeze({
    source,
    target,
    status:CLOCK_STATUS.NO_EXCHANGE,
    units:null,
    relation:'none_declared',
    validity:'no justified adapter declared',
    invertible:false,
    provenance:'typed time registry fail-closed rule',
  });
}

export function findClockAdapter(source, target) {
  domainById(source);
  domainById(target);
  return ADAPTER_BY_ROUTE.get(`${source}\u0000${target}`) ?? noExchange(source, target);
}

export function validateTimeRegistry() {
  const validKinds = new Set(Object.values(TIME_DOMAIN_KIND));
  const validScopes = new Set(Object.values(STATE_SCOPE));
  const validStatuses = new Set(Object.values(CLOCK_STATUS));

  const domainIds = new Set();
  for (const domain of TIME_DOMAINS) {
    if (domainIds.has(domain.id)) throw new Error(`duplicate time domain id: ${domain.id}`);
    domainIds.add(domain.id);
    if (!validKinds.has(domain.kind)) throw new Error(`invalid time domain kind: ${domain.id}`);
    if (typeof domain.unit !== 'string' || !domain.unit) throw new Error(`missing time domain unit: ${domain.id}`);
    if (typeof domain.provenance !== 'string' || !domain.provenance) throw new Error(`missing time domain provenance: ${domain.id}`);
    if (domain.promotable && domain.kind !== TIME_DOMAIN_KIND.ABSOLUTE_EPOCH) throw new Error(`illegal Atlas epoch promotion: ${domain.id}`);
  }

  const routes = new Set();
  for (const adapter of CLOCK_ADAPTERS) {
    const route = `${adapter.source}\u0000${adapter.target}`;
    if (routes.has(route)) throw new Error(`duplicate clock adapter: ${adapter.source} -> ${adapter.target}`);
    routes.add(route);
    if (!domainIds.has(adapter.source) || !domainIds.has(adapter.target)) throw new Error(`undeclared clock adapter endpoint: ${adapter.source} -> ${adapter.target}`);
    if (!validStatuses.has(adapter.status) || adapter.status === CLOCK_STATUS.NO_EXCHANGE) throw new Error(`invalid declared adapter status: ${route}`);
    if (!adapter.units || typeof adapter.units.source !== 'string' || typeof adapter.units.target !== 'string') throw new Error(`missing adapter units: ${route}`);
    if (typeof adapter.validity !== 'string' || !adapter.validity) throw new Error(`missing adapter validity: ${route}`);
    if (typeof adapter.provenance !== 'string' || !adapter.provenance) throw new Error(`missing adapter provenance: ${route}`);
    if (typeof adapter.invertible !== 'boolean') throw new Error(`missing adapter invertibility: ${route}`);
  }

  const scopeIds = new Set();
  for (const scope of STATE_SCOPES) {
    if (scopeIds.has(scope.id)) throw new Error(`duplicate state scope id: ${scope.id}`);
    scopeIds.add(scope.id);
    if (!validScopes.has(scope.scope)) throw new Error(`invalid state scope: ${scope.id}`);
    if (typeof scope.provenance !== 'string' || !scope.provenance) throw new Error(`missing state scope provenance: ${scope.id}`);
  }

  return {ok:true, domains:TIME_DOMAINS.length, adapters:CLOCK_ADAPTERS.length, scopes:STATE_SCOPES.length};
}

validateTimeRegistry();
