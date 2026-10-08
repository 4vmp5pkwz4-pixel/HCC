/* Native S³ Center Lab optics — no charts, overlays, additive bloom or extra canvas.
 * Display-only geometry: true S³ radial geodesics projected by the existing S3M
 * chart. Scientific evaluations are owned by core/math/s3-cap-observability.mjs.
 */
export function mountS3CapObservability({THREE, S3M, parent, RU}) {
  const group = new THREE.Group();
  group.name = 'S³ cap observability · native geodesic field';
  group.visible = false;
  parent.add(group);

  const field = new THREE.LineSegments(new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.42,
      depthWrite: false, blending: THREE.NormalBlending
    }));
  field.name = 'radial witness · representative field samples';
  group.add(field);

  const rings = [0xdac78c, 0x8aafcb].map(color => {
    const line = new THREE.LineLoop(new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color, transparent: true, opacity: .72,
        depthWrite: false, blending: THREE.NormalBlending
      }));
    group.add(line);
    return line;
  });
  const tracer = new THREE.Mesh(new THREE.SphereGeometry(RU * .009, 12, 8),
    new THREE.MeshBasicMaterial({color: 0xfaf7ef, depthWrite: false}));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(RU * .019, 12, 8),
    new THREE.MeshBasicMaterial({
      color: 0xe4dbc5, transparent: true, opacity: .065,
      depthWrite: false, blending: THREE.NormalBlending
    }));
  group.add(halo, tracer);
  let markerPath = [], phase = 0, lastSignature = '';

  const toS3 = (a, v, t) => a.map((x, i) => Math.cos(t) * x + Math.sin(t) * v[i]);
  const dir = (frame, c) => frame[0].map((x, i) =>
    x * c[0] + frame[1][i] * c[1] + frame[2][i] * c[2]);
  const visiblePoint = q => {
    const p = S3M.stereo(q);
    return p && Number.isFinite(p.x) && p.length() < RU * 3.7 ? p : null;
  };
  function update({center, chi, L, enabled}) {
    group.visible = !!enabled;
    if (!enabled) return;
    if (!Number.isInteger(L) || L < 0 || L > 24 || !(chi > 0 && chi < Math.PI))
      throw new RangeError('S³ cap optics: invalid harmonic band / angular aperture');
    const A = S3M.norm(center);
    const key = [...A.map(x=>x.toFixed(7)),chi.toFixed(7),L].join('|');
    if (key === lastSignature) return;
    lastSignature = key;
    const frame = S3M.tangentBasis(A);
    if(frame.length !== 3) { group.visible = false; return; }

    const positions = [], colors = [], rays = 16, steps = 82;
    const tLimit = Math.min(Math.PI - .018, Math.max(1.8, chi + .68));
    const inner = new THREE.Color(0xb9a876);
    const outer = new THREE.Color(0x8fb1d8);
    const c = new THREE.Color();
    for(let r = 0; r < rays; r++) {
      const z = 1 - 2 * (r + .5) / rays;
      const a = r * Math.PI * (3 - Math.sqrt(5));
      const w = Math.sqrt(Math.max(0,1-z*z));
      const u = dir(frame, [w * Math.cos(a),w * Math.sin(a),z]);
      let prev = null, prevColor = null;
      for(let j = 0; j <= steps; j++) {
        const t = .007 + tLimit * j / steps;
        const p = visiblePoint(toS3(A,u,t));
        const f = Math.pow(Math.sin(t / 2), 2 * L);
        const luminance = .075 + .85 * Math.sqrt(f);
        c.copy(t<=chi ? inner : outer).multiplyScalar(luminance);
        if(p && prev && p.distanceTo(prev)<RU*.44) {
          positions.push(prev.x,prev.y,prev.z,p.x,p.y,p.z);
          colors.push(prevColor.r,prevColor.g,prevColor.b,c.r,c.g,c.b);
        }
        prev=p;
        prevColor=c.clone();
      }
    }
    field.geometry.dispose();
    field.geometry = new THREE.BufferGeometry();
    field.geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    field.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));

    markerPath = [];
    for(let k=0;k<rings.length;k++){
      const axes=k===0?[0,1]:[0,2], points=[];
      for(let j=0;j<128;j++){
        const a=2*Math.PI*j/128;
        const components=[0,0,0];
        components[axes[0]]=Math.cos(a);components[axes[1]]=Math.sin(a);
        const p=visiblePoint(toS3(A,dir(frame,components),chi));
        if(p) points.push(p);
      }
      rings[k].geometry.dispose();
      rings[k].geometry = new THREE.BufferGeometry().setFromPoints(points);
      rings[k].visible=points.length===128;
      if(k===0 && points.length===128) markerPath=points;
    }
    tracer.visible=halo.visible=markerPath.length>0;
  }
  function tick(dt) {
    if (!group.visible || !markerPath.length) return;
    phase = (phase + Math.max(0, Math.min(.08,dt)) * .055) % 1;
    const x=phase*markerPath.length, i=Math.floor(x), f=x-i;
    tracer.position.copy(markerPath[i]).lerp(markerPath[(i+1)%markerPath.length],f);
    halo.position.copy(tracer.position);
  }
  function dispose() {
    for (const o of [field,...rings,tracer,halo]) {
      o.geometry.dispose();o.material.dispose();
    }
    parent.remove(group);
  }
  return Object.freeze({update,tick,dispose,group});
}
