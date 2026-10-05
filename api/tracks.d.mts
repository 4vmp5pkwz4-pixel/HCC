// Types for reproducibility tracks (schema 'hcc.track/1'), as produced by HCC_TRACKS in the atlas and replayed by
// api/track-replay.mjs. A track is data: calls name an operation in TRACK_OPS and pass JSON arguments; nothing in a
// track is ever evaluated as code.
export type TrackSchema = 'hcc.track/1';
export type Expectation = number | string | unknown[] | { value: number; tol?: number } | { value: unknown };
export type TrackStep =
  | { op: 'nav'; world: string; lab?: string | null }
  | { op: 'state'; set: Record<string, number | string | boolean> }
  | { op: 'camera'; pos: [number, number, number]; target: [number, number, number] }
  | { op: 'call'; fn: TrackOpName; args?: Record<string, unknown>; expect?: Record<string, Expectation> };
export type TrackOpName =
  | 'cosmic.chi' | 'cosmic.t0' | 'cmb.camb' | 'cmb.acoustic' | 'cmb.sigmaT' | 'lss.dinf'
  | 'space.firstMode' | 'space.circles' | 'ghost.rmax' | 'ghost.self' | 'bbh.budget'
  | 'phi.audit' | 'hyp.ratio' | 'atlas.betti' | 'wf.experiment' | 'fluid.final' | 'fluid.invariants' | 'blowup.window' | 'cycles.section' | 'strobe.carrier' | 'strobe.saros' | 'formula.check' | 'triad.top' | 'triad.census' | 'gmode.address' | 'gmode.light' | 'gmode.cosmos' | 'gmode.flash' | 'gmode.sky' | 'phase.relation' | 'phase.lock';
export interface Track {
  schema: TrackSchema;
  id: string;
  title?: string;
  atlas?: { version: string; build: string };
  discovery?: string;
  steps: TrackStep[];
  /** FNV-1a of the canonical outputs (keys sorted, numbers to 8 significant digits); present on a sealed track */
  fingerprint?: string;
}
export interface TrackCheck { key: string; got: unknown; want: unknown; tol: number; pass: boolean; }
export interface TrackStepReport { i: number; op: TrackStep['op']; fn?: string; ok?: boolean; screen?: boolean; got?: Record<string, unknown>; checks?: TrackCheck[]; err?: string; }
export interface TrackReport { ok: boolean; steps: TrackStepReport[]; fingerprint: string; fingerprintMatch: boolean | null; }
/** window.HCC_TRACKS in the atlas */
export interface HccTracksAPI {
  schema: TrackSchema;
  ops(): { op: TrackOpName; doc: string }[];
  discovery(id: string): Track | null;
  discoveries(): string[];
  encode(t: Track): string;
  decode(link: string): Track;
  run(t: Track | string): TrackReport;
  link(t: Track): string;
  record(): Track;
  replay(t: Track | string): Promise<TrackReport>;
}
