import { navierStokesS3PhaseAdapter } from './navier-stokes-s3.mjs';
import { holonomyPhaseAdapter } from './holonomy.mjs';
import { contactActionPhaseAdapter } from './contact-action.mjs';
import { relativityPhaseAdapter } from './relativity.mjs';
import { heatPhaseAdapter } from './field-heat.mjs';

export { navierStokesS3PhaseAdapter, holonomyPhaseAdapter, contactActionPhaseAdapter, relativityPhaseAdapter, heatPhaseAdapter };

export const INITIAL_PHASE_SPACES=Object.freeze([
  navierStokesS3PhaseAdapter(), holonomyPhaseAdapter(), contactActionPhaseAdapter(), relativityPhaseAdapter(), heatPhaseAdapter()
]);
