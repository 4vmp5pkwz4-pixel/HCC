/** Optional shader source. A supported extension still requires array framebuffer
 * attachments, compositor-compatible subimages and integration with the renderer.
 * No declaration here switches Three.js to single-pass XR.
 */
export const S3_MULTIVIEW_VERTEX=`#version 300 es
#extension GL_OVR_multiview2 : require
precision highp float;
layout(num_views=2) in;
layout(location=0) in vec4 aPointS3;
layout(location=1) in vec4 aTangentU;
layout(location=2) in vec4 aTangentV;
layout(location=3) in vec2 aUv;
uniform mat4 uViewMatrices[2],uProjMatrices[2];
uniform vec4 uQuatL,uQuatR;
uniform float uRadiusS3;
out vec2 vUv;
out vec3 vWorldPos,vNormal;
out float vChartValid;
vec4 multiplyQ(vec4 a,vec4 b){return vec4(a.w*b.xyz+b.w*a.xyz+cross(a.xyz,b.xyz),a.w*b.w-dot(a.xyz,b.xyz));}
vec4 rotate4(vec4 p,vec4 l,vec4 r){return multiplyQ(multiplyQ(l,p),vec4(-r.xyz,r.w));}
vec3 differential(vec4 q,vec4 t,float d){return uRadiusS3*(t.xyz+(q.xyz/d)*t.w)/d;}
void main(){
  vec4 l=normalize(uQuatL),r=normalize(uQuatR);
  vec4 q=rotate4(normalize(aPointS3),l,r);
  float denom=1.0-q.w;
  // A chart excludes its pole. This display also clips a small cap for finite rasterization.
  vChartValid=denom>1e-6?1.0:0.0;
  float d=max(denom,1e-6);
  vWorldPos=uRadiusS3*q.xyz/d;
  vec3 u=differential(q,rotate4(aTangentU,l,r),d);
  vec3 v=differential(q,rotate4(aTangentV,l,r),d);
  vec3 normal=cross(u,v);vNormal=normal/max(length(normal),1e-12);
  vUv=aUv;
  gl_Position=uProjMatrices[gl_ViewID_OVR]*uViewMatrices[gl_ViewID_OVR]*vec4(vWorldPos,1.0);
  if(vChartValid<0.5)gl_Position=vec4(2.0,2.0,2.0,1.0);
}`;

/** Only capability evidence. rendererIntegrated remains false until its own XR path is built. */
export function inspectS3Multiview(gl) {
  if(!gl?.getExtension)return {supported:false,maxViews:0,rendererIntegrated:false,reason:'no WebGL context'};
  const extension=gl.getExtension('OVR_multiview2');
  if(!extension)return {supported:false,maxViews:0,rendererIntegrated:false,reason:'OVR_multiview2 unavailable'};
  const maxViews=gl.getParameter(extension.MAX_VIEWS_OVR);
  return {supported:maxViews>=2,maxViews,rendererIntegrated:false,reason:'array framebuffer and XR compositor integration required'};
}
