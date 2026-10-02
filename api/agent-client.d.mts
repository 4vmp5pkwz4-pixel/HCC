import type {S3MeasurementInput, S3Measurement, S3Point, StereoPoint} from '../core/math/s3-geometry.mjs';
export type {S3MeasurementInput, S3Measurement, S3Point, StereoPoint};

export interface GeometryClient {
  measureS3(input: S3MeasurementInput): S3Measurement;
  stereographicToS3(chart: StereoPoint): S3Point;
  s3ToStereographic(point: S3Point): StereoPoint;
  hopfBase(point: S3Point): StereoPoint;
}
export interface StaticAtlasSession {
  geometry: GeometryClient;
  research: ResearchClient;
  discover(): { schema: 'hcc.agent-session/1'; version: string; build: string; [key: string]: unknown };
  search(filters?: {query?: string; world?: string; status?: string}): Record<string, unknown>[];
  describe(id: string): Record<string, unknown>;
  forecast(control: string, delta?: number): unknown;
  audit(input: unknown): Promise<unknown>;
}

export declare function connectAtlas(baseURL?: string | URL, options?: {timeout_ms?: number}): Promise<StaticAtlasSession>;
export declare function auditWithProvenance(input: unknown): Promise<unknown>;
export declare const auditForecast: (input: unknown) => unknown;
export declare const AUDIT_INPUT_SCHEMA: unknown;
export declare const measureS3: GeometryClient['measureS3'];
export declare const stereographicToS3: GeometryClient['stereographicToS3'];
export declare const s3ToStereographic: GeometryClient['s3ToStereographic'];
export declare const hopfBase: GeometryClient['hopfBase'];

export interface FLRWInput {H0:number;OmegaM:number;OmegaR:number;OmegaK:number;w0:number;wa:number;z:number;}
export interface ResearchClient {
 flrw(input:FLRWInput):Record<string,unknown>;
 geometryAudit(input:FLRWInput & {rd:number}):Record<string,unknown>;
 curvatureDiagnostic(input:{D:number;Dprime:number;E:number}):number;
 constantCurvatureFit(input:{source:string;normalization:'D=H0*DM/c';points:{z:number;D:number;Dprime:number;E:number}[];covariance?:number[][]}):Record<string,unknown>;
 scalarMode(input:{n:number;radius_Mpc:number;chi:number}):Record<string,unknown>;
 lensingKernel(input:FLRWInput & {zSource:number}):Record<string,unknown>;
 delensingResidual(rho:number):Record<string,unknown>;
 catalog():Record<string,unknown>;
}
export declare const flrw:ResearchClient['flrw'];
export declare const geometryAudit:ResearchClient['geometryAudit'];
export declare const curvatureDiagnostic:ResearchClient['curvatureDiagnostic'];
export declare const constantCurvatureFit:ResearchClient['constantCurvatureFit'];
export declare const scalarMode:ResearchClient['scalarMode'];
export declare const lensingKernel:ResearchClient['lensingKernel'];
export declare const delensingResidual:ResearchClient['delensingResidual'];
export declare const researchCatalog:ResearchClient['catalog'];
