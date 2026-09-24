// Fixed segment identities let the same line art assemble, break and return.
export const filamentVertex = /* glsl */ `
attribute vec3 logoPosition;
attribute vec3 ink;
attribute vec3 emblemInk;
attribute vec2 trace;
uniform float uTime;
uniform float uDepth;
uniform float uConverge;
uniform float uShatter;
uniform float uPointScale;
varying vec3 vInk;
varying vec2 vTrace;
void main() {
  vec3 source = position;
  source.z *= uDepth;
  source.z += sin(uTime * 0.28 + trace.y * 17.0) * 0.035 * uDepth;
  vec3 p = mix(source, logoPosition, uConverge);
  // Dissolve along sight lines into depth, retaining filament direction.
  // No random radial debris: the logo opens a passage through its crossing.
  float travel = uShatter * (0.55 + fract(trace.y * 7.13) * 0.45);
  p.xy *= 1.0 + travel * 2.8;
  p.z += travel * 7.0;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * view;
  gl_PointSize = clamp(uPointScale / max(1.0, -view.z), 1.0, 9.0);
  vInk = mix(ink, emblemInk, uConverge);
  vTrace = trace;
}
`;

export const filamentFragment = /* glsl */ `
uniform float uTime;
uniform float uShatter;
uniform float uOpacity;
varying vec3 vInk;
varying vec2 vTrace;
void main() {
  float head = fract(vTrace.x - uTime * (0.065 + 0.018 * fract(vTrace.y * 3.17)) + vTrace.y);
  float pulse = exp(-head * 34.0);
  float body = 0.12 + 0.13 * sin(vTrace.x * 17.0 + vTrace.y * 11.0);
  float intensity = 0.25 + max(0.0, body) + pulse * 1.7;
  float alpha = uOpacity * mix(0.65, 0.85, pulse);
  #ifdef FILAMENT_POINTS
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    alpha *= exp(-radius * radius * 5.0) * (0.2 + pulse);
  #else
    alpha *= 1.0 - smoothstep(0.25, 1.0, uShatter);
  #endif
  gl_FragColor = vec4(vInk * intensity, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
