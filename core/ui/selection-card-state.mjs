export function createSelectionCardState({ mobile }) {
  return { mobile: !!mobile, objectId: null, expanded: !mobile };
}

export function reduceSelectionCardState(state, event) {
  switch (event?.type) {
    case 'select':
      return {
        mobile: state.mobile,
        objectId: event.objectId ?? null,
        expanded: state.mobile ? false : true,
      };
    case 'toggle':
      if (state.objectId == null) return state;
      return { ...state, expanded: !state.expanded };
    case 'fold':
      if (state.objectId == null) return state;
      return { ...state, expanded: false };
    case 'close':
      return { mobile: state.mobile, objectId: null, expanded: false };
    default:
      return state;
  }
}
