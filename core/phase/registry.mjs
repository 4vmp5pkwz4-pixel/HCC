function immutableList(values){ return Object.freeze([...values]); }

export function createPhaseRegistry({ spaces = [], bridges = [] } = {}) {
  const spaceMap = new Map();
  for (const s of spaces) {
    if (!s?.id) throw new TypeError('phase space id is required');
    if (spaceMap.has(s.id)) throw new TypeError(`duplicate phase space id "${s.id}"`);
    spaceMap.set(s.id, s);
  }
  const bridgeMap = new Map();
  for (const b of bridges) {
    if (!b?.id) throw new TypeError('phase bridge id is required');
    if (bridgeMap.has(b.id)) throw new TypeError(`duplicate phase bridge id "${b.id}"`);
    bridgeMap.set(b.id, Object.freeze({...b}));
  }
  return Object.freeze({
    getSpace: id => spaceMap.get(id) || null,
    listSpaces: () => [...spaceMap.values()],
    getBridge: id => bridgeMap.get(id) || null,
    listBridges: (filter = {}) => [...bridgeMap.values()].filter(b =>
      (filter.status == null || b.status === filter.status) &&
      (filter.labA == null || b.source === filter.labA || b.target === filter.labA) &&
      (filter.labB == null || b.source === filter.labB || b.target === filter.labB)),
    snapshot: () => Object.freeze({spaces:immutableList(spaceMap.values()),bridges:immutableList(bridgeMap.values())})
  });
}
