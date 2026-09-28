/** An opt-in same-page adapter to the Atlas's existing public navigation and instrument APIs. */
function serializableFinite(value) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new RangeError('non-finite scientific result refused');
  if (Array.isArray(value)) return value.map(serializableFinite);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, serializableFinite(v)]));
  }
  if (value === undefined || typeof value === 'function') throw new TypeError('non-serializable Atlas result refused');
  return value;
}

export function connectLiveAtlas({api = globalThis.HCC_API, nav = globalThis.HCC_NAV} = {}) {
  if (api?.schema !== 'hcc.api/2' || !api.ready || !api.describe || !api.report ||
      !nav?.worlds || !nav.labs || !nav.find || !nav.go || !nav.layer || !nav.open || !nav.scene) {
    throw new Error('Atlas live interfaces unavailable; await the Atlas page and use its HCC_API/HCC_NAV');
  }
  const snapshot = () => serializableFinite({
    schema:'hcc.agent-scene/1', version:api.version, build:api.build,
    ...nav.scene(),
  });
  return Object.freeze({
    ready: async (timeout = 10000) => { await api.ready({timeout}); return snapshot(); },
    snapshot,
    findObjects: (query, limit = 24) => serializableFinite(nav.find(query, limit)),
    navigate(worldId, labId = null) {
      if (!nav.worlds().some(world => world.id === worldId)) throw new RangeError(`unknown world: ${String(worldId)}`);
      if (labId !== null && !nav.labs().some(lab => lab.id === labId && lab.parentWorld === worldId)) {
        throw new RangeError(`unknown lab in world ${worldId}: ${String(labId)}`);
      }
      nav.go(worldId, labId);
      return snapshot();
    },
    setScaleLayer(layer) {
      if (!['local', 'galactic', 'andromeda', 'cosmic'].includes(layer) || nav.layer(layer) !== true) {
        throw new RangeError(`unknown or unavailable scale layer: ${String(layer)}`);
      }
      return snapshot();
    },
    openObject(key) {
      if (nav.open(key) !== true) throw new RangeError(`unknown or unavailable object: ${String(key)}`);
      return snapshot();
    },
    runInstrument(id, input = {}) {
      if (!api.describe(id)) throw new RangeError(`unknown instrument: ${String(id)}`);
      return serializableFinite(api.report(id, input));
    },
  });
}
