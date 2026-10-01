/** Dimensionless native coordinates in R⁴; the sphere radius is supplied separately. */
export type S3Point = readonly [number, number, number, number];
export type StereoPoint = readonly [number, number, number];
export interface S3MeasurementInput {
  from: S3Point;
  to: S3Point;
  radius: number;
  unit: string;
}
export interface S3Measurement {
  schema: 'hcc.s3-measurement/1';
  status: 'CONDITIONAL';
  metric: 'round-spatial-s3';
  from: number[];
  to: number[];
  radius: number;
  unit: string;
  length: number;
  angle_rad: number;
  precision: 'float64';
  shortest_path_unique: boolean;
  assumptions: string[];
  provenance: { equation: string; source: string };
}
export declare function stereographicToS3(chart: StereoPoint): S3Point;
export declare function s3ToStereographic(point: S3Point): StereoPoint;
export declare function s3ConformalFactor(chart: StereoPoint): number;
/** All quaternions use [x,y,z,w], scalar last. */
export declare function s3RotateSpin4(point: S3Point, left: S3Point, right: S3Point): S3Point;
export declare function s3StereographicDifferential(point: S3Point, tangent: S3Point, radius?: number): StereoPoint;
export declare function s3GeodesicDistance(from: S3Point, to: S3Point, radius?: number): number;
export declare function hopfBase(point: S3Point): StereoPoint;
export declare function measureS3(input: S3MeasurementInput): S3Measurement;
