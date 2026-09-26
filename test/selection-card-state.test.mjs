import test from 'node:test';
import assert from 'node:assert/strict';
import { createSelectionCardState, reduceSelectionCardState } from '../core/ui/selection-card-state.mjs';

test('mobile selection always opens as a compact peek, even after the previous object was expanded', () => {
  let s = createSelectionCardState({ mobile: true });
  s = reduceSelectionCardState(s, { type: 'select', objectId: 'earth' });
  assert.equal(s.objectId, 'earth');
  assert.equal(s.expanded, false);

  s = reduceSelectionCardState(s, { type: 'toggle' });
  assert.equal(s.expanded, true);

  s = reduceSelectionCardState(s, { type: 'select', objectId: 'mars' });
  assert.equal(s.objectId, 'mars');
  assert.equal(s.expanded, false);
});

test('fold keeps the current mobile object selected as a compact peek until reopened or closed', () => {
  let s = createSelectionCardState({ mobile: true });
  s = reduceSelectionCardState(s, { type: 'select', objectId: 'jupiter' });
  s = reduceSelectionCardState(s, { type: 'toggle' });
  s = reduceSelectionCardState(s, { type: 'fold' });
  assert.deepEqual(s, { mobile: true, objectId: 'jupiter', expanded: false });

  s = reduceSelectionCardState(s, { type: 'toggle' });
  assert.equal(s.expanded, true);

  s = reduceSelectionCardState(s, { type: 'close' });
  assert.deepEqual(s, { mobile: true, objectId: null, expanded: false });
});

test('desktop selection remains open by default', () => {
  let s = createSelectionCardState({ mobile: false });
  s = reduceSelectionCardState(s, { type: 'select', objectId: 'sun' });
  assert.deepEqual(s, { mobile: false, objectId: 'sun', expanded: true });
});
