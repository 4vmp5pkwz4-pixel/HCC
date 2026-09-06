export const DAY_SECONDS = 86400;

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  return value;
}

function assertSafeDay(day) {
  if (!Number.isSafeInteger(day)) throw new RangeError('AtlasTime day must be a safe integer');
  return day;
}

function positiveModulo(value, modulus) {
  const r = value % modulus;
  return r < 0 ? r + modulus : r;
}

export function normalizeEpoch(day, fraction) {
  assertSafeDay(day);
  assertFiniteNumber(fraction, 'AtlasTime fraction');

  let carry = Math.floor(fraction);
  let normalizedDay = day + carry;
  let normalizedFraction = fraction - carry;

  if (normalizedFraction >= 1) {
    normalizedDay += 1;
    normalizedFraction -= 1;
  } else if (normalizedFraction < 0) {
    normalizedDay -= 1;
    normalizedFraction += 1;
  }

  if (Object.is(normalizedFraction, -0)) normalizedFraction = 0;
  assertSafeDay(normalizedDay);
  return { day: normalizedDay, fraction: normalizedFraction };
}

export function splitEpochDays(epochDays) {
  assertFiniteNumber(epochDays, 'epochDays');
  const day = Math.floor(epochDays);
  assertSafeDay(day);
  return normalizeEpoch(day, epochDays - day);
}

export function epochDaysOf(snapshot) {
  if (!snapshot || !Number.isSafeInteger(snapshot.day) || !Number.isFinite(snapshot.fraction)) {
    throw new TypeError('snapshot must contain a safe integer day and finite fraction');
  }
  return snapshot.day + snapshot.fraction;
}

function asSplitEpoch(value, label = 'epoch') {
  if (typeof value === 'number') return splitEpochDays(value);
  if (value && typeof value === 'object') {
    if ('epochDays' in value) return splitEpochDays(value.epochDays);
    if ('day' in value && 'fraction' in value) return normalizeEpoch(value.day, value.fraction);
  }
  throw new TypeError(`${label} must be epochDays or {day,fraction}`);
}

export function reduceEpochModulo(snapshot, periodDays, anchorDays = 0) {
  assertFiniteNumber(periodDays, 'periodDays');
  if (!(periodDays > 0)) throw new RangeError('periodDays must be > 0');

  const epoch = asSplitEpoch(snapshot, 'snapshot');
  const anchor = asSplitEpoch(anchorDays, 'anchorDays');

  // Reduce integer-day components before subtraction so periodic phases never construct
  // one huge floating-point (epoch - anchor) value at deep positive or negative epochs.
  const epochDayRemainder = positiveModulo(epoch.day, periodDays);
  const anchorDayRemainder = positiveModulo(anchor.day, periodDays);
  return positiveModulo(
    epochDayRemainder - anchorDayRemainder + epoch.fraction - anchor.fraction,
    periodDays,
  );
}

function sourceOf(meta, fallback) {
  const source = meta?.source ?? fallback;
  if (typeof source !== 'string' || source.length === 0) {
    throw new TypeError('AtlasTime mutation source must be a non-empty string');
  }
  return source;
}

function validateRate(rate) {
  return assertFiniteNumber(rate, 'rateDaysPerSecond');
}

function freezeSnapshot(state) {
  return Object.freeze({
    day: state.day,
    fraction: state.fraction,
    rateDaysPerSecond: state.rateDaysPerSecond,
    paused: state.paused,
    revision: state.revision,
    source: state.source,
  });
}

export function createAtlasTime(initial = {}) {
  const initialEpoch = 'epochDays' in initial
    ? splitEpochDays(initial.epochDays)
    : normalizeEpoch(initial.day ?? 0, initial.fraction ?? 0);

  let state = {
    ...initialEpoch,
    rateDaysPerSecond: validateRate(initial.rateDaysPerSecond ?? 0),
    paused: Boolean(initial.paused ?? false),
    revision: 0,
    source: sourceOf({ source: initial.source ?? 'atlas.init' }, 'atlas.init'),
  };

  const snapshot = () => freezeSnapshot(state);

  function commit(patch, meta = {}) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new TypeError('AtlasTime patch must be an object');
    }

    const allowed = new Set(['epochDays', 'epoch', 'day', 'fraction', 'rateDaysPerSecond', 'paused']);
    for (const key of Object.keys(patch)) {
      if (!allowed.has(key)) throw new TypeError(`unknown AtlasTime field: ${key}`);
    }

    let epoch = { day: state.day, fraction: state.fraction };
    if ('epochDays' in patch) {
      epoch = splitEpochDays(patch.epochDays);
    } else if ('epoch' in patch) {
      epoch = asSplitEpoch(patch.epoch, 'epoch');
    } else if ('day' in patch || 'fraction' in patch) {
      epoch = normalizeEpoch(patch.day ?? state.day, patch.fraction ?? state.fraction);
    }

    const rateDaysPerSecond = 'rateDaysPerSecond' in patch
      ? validateRate(patch.rateDaysPerSecond)
      : state.rateDaysPerSecond;
    const paused = 'paused' in patch ? Boolean(patch.paused) : state.paused;

    state = {
      ...epoch,
      rateDaysPerSecond,
      paused,
      revision: state.revision + 1,
      source: sourceOf(meta, 'atlas.mutation'),
    };
    return snapshot();
  }

  function setEpoch(epoch, meta = {}) {
    return commit({ epoch }, { ...meta, source: sourceOf(meta, 'atlas.setEpoch') });
  }

  function setRate(rateDaysPerSecond, meta = {}) {
    return commit(
      { rateDaysPerSecond },
      { ...meta, source: sourceOf(meta, 'atlas.setRate') },
    );
  }

  function setPaused(paused, meta = {}) {
    return commit({ paused }, { ...meta, source: sourceOf(meta, 'atlas.setPaused') });
  }

  function transact(patch, meta = {}) {
    return commit(patch, { ...meta, source: sourceOf(meta, 'atlas.transaction') });
  }

  function advanceFrame(realDtSeconds, meta = {}) {
    assertFiniteNumber(realDtSeconds, 'realDtSeconds');
    if (realDtSeconds < 0) throw new RangeError('realDtSeconds must be >= 0');
    if (state.paused || realDtSeconds === 0 || state.rateDaysPerSecond === 0) return snapshot();

    const delta = splitEpochDays(state.rateDaysPerSecond * realDtSeconds);
    const next = normalizeEpoch(state.day + delta.day, state.fraction + delta.fraction);
    return commit(
      { day: next.day, fraction: next.fraction },
      { ...meta, source: sourceOf(meta, 'frame.root') },
    );
  }

  function restore(saved, meta = {}) {
    if (!saved || typeof saved !== 'object') throw new TypeError('snapshot restore requires an object');
    const epoch = asSplitEpoch(saved, 'snapshot');
    return commit(
      {
        day: epoch.day,
        fraction: epoch.fraction,
        rateDaysPerSecond: saved.rateDaysPerSecond ?? state.rateDaysPerSecond,
        paused: saved.paused ?? state.paused,
      },
      { ...meta, source: sourceOf(meta, 'snapshot.restore') },
    );
  }

  return Object.freeze({
    snapshot,
    setEpoch,
    setRate,
    setPaused,
    transact,
    advanceFrame,
    restore,
  });
}
