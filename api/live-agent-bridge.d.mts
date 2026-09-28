export interface SceneSnapshot {
  schema: 'hcc.agent-scene/1';
  version: string;
  build: string;
  worldId: string;
  labId: string | null;
  selectedObjectId: string | null;
}
export interface LiveAtlasAPI {
  schema: 'hcc.api/2';
  version: string;
  build: string;
  ready(options?: {timeout?: number}): Promise<unknown>;
  describe(id: string): unknown;
  report(id: string, input: Record<string, unknown>): unknown;
}
export interface LiveAtlasNavigation {
  worlds(): readonly {id: string}[];
  labs(): readonly {id: string; parentWorld: string}[];
  find(query: string, limit?: number): unknown[];
  go(worldId: string, labId?: string | null): unknown;
  layer(layer: string): boolean;
  open(key: string): boolean;
}
export interface LiveAtlasBridge {
  ready(timeout?: number): Promise<SceneSnapshot>;
  snapshot(): SceneSnapshot;
  findObjects(query: string, limit?: number): unknown[];
  navigate(worldId: string, labId?: string | null): SceneSnapshot;
  setScaleLayer(layer: 'local' | 'galactic' | 'andromeda' | 'cosmic'): SceneSnapshot;
  openObject(key: string): SceneSnapshot;
  runInstrument(id: string, input?: Record<string, unknown>): unknown;
}
export declare function connectLiveAtlas(options?: {
  api?: LiveAtlasAPI;
  nav?: LiveAtlasNavigation;
  ctx?: {worldId: string; labId: string | null; selectedObjectId: string | null};
}): LiveAtlasBridge;
