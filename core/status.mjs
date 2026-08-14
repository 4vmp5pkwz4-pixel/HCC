/* ── THE STATUS TAXONOMY ─────────────────────────────────────────────────────
   Seven statuses, and the rule that matters more than the list: a visual agreement or a
   synthetic self-test may NEVER be promoted to an empirical confirmation. A laboratory
   that has only ever been run against data it generated itself is SYNTHETIC_ONLY, and
   saying so is the whole point of having the word. */
export const STATUS = Object.freeze({
  EXACT:               'EXACT',
  NUMERICALLY_VERIFIED:'NUMERICALLY_VERIFIED',
  CONDITIONAL:         'CONDITIONAL',
  REFERENCE_MODEL:     'REFERENCE_MODEL',
  SYNTHETIC_ONLY:      'SYNTHETIC_ONLY',
  OPEN:                'OPEN',
  NOT_IMPLEMENTED:     'NOT_IMPLEMENTED'
});
export const STATUS_DOC = Object.freeze({
  EXACT:               'closed form, or an identity that holds to machine precision by construction',
  NUMERICALLY_VERIFIED:'no closed form, but reproduced by an independent numerical route inside a stated tolerance',
  CONDITIONAL:         'exact GIVEN a declared assumption or ansatz that this atlas does not derive',
  REFERENCE_MODEL:     'a standard abstract model, useful as a benchmark, NOT a prediction about a physical device',
  SYNTHETIC_ONLY:      'exercised only against data this software generated; no external measurement has ever been used',
  OPEN:                'the mathematics is stated and the object does not yet exist; no number is returned',
  NOT_IMPLEMENTED:     'declared in the catalogue, no computational contract yet; returns no number at all'
});
export const ALL_STATUSES = Object.freeze(Object.keys(STATUS));
export function isEmpirical(status){ return false; }   /* nothing here is, and the API says so */
