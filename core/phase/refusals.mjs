export const PHASE_STATUS = Object.freeze({ REFUSED: 'REFUSED' });

export function phaseRefusal(code, message, detail = null) {
  return Object.freeze({ status: PHASE_STATUS.REFUSED, code: String(code), message: String(message), detail });
}
