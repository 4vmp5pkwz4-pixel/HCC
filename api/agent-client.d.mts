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
