import * as THREE from './vendor/three.module.js';

// Review-only animation. Source frames are OpenAI outputs; all motion below is
// deterministic Three.js/GSAP compositing, not model-generated video.
// Background-motion studies ONLY. Door meshes and controllable twinkling live
// separately in the game; no extra particle/star layer is baked into these clips.
const style = document.body.dataset.style;
const root = document.querySelector('[data-composition-id]');
const canvas = document.querySelector('canvas');
const prefix = { a: 'style-a-live-plate', b: 'style-b-lowtech-pixel', c: 'style-c-max-tech' }[style];
const renderer = new THREE.WebGLRenderer({ canvas, antialias: style !== 'b', preserveDrawingBuffer: true });
renderer.setSize(1920, 1080, false);
renderer.setPixelRatio(1);
renderer.setClearColor(0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 5);
camera.position.z = 1;
const textures = await Promise.all(Array.from({ length: 5 }, (_, i) => new THREE.TextureLoader().loadAsync(`./frames/${prefix}/motion-${style}-${String(i + 1).padStart(2, '0')}.webp`)));
for (const texture of textures) {
  texture.colorSpace = THREE.SRGBColorSpace;
  if (style === 'b') { texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter; texture.generateMipmaps = false; }
}
const material = new THREE.ShaderMaterial({
  uniforms: { first: { value: textures[0] }, next: { value: textures[1] }, blend: { value: 0 }, phase: { value: 0 }, mode: { value: style === 'c' ? 2 : style === 'b' ? 1 : 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `
    uniform sampler2D first;
    uniform sampler2D next;
    uniform float blend;
    uniform float phase;
    uniform float mode;
    varying vec2 vUv;
    vec3 plate(vec2 uv){ return mix(texture2D(first,uv).rgb,texture2D(next,uv).rgb,blend); }
    void main(){
      vec2 core=vec2(.64,.51);
      vec2 p=vUv-core;
      float travel=.5-.5*cos(phase);
      float zoom=1.025+travel*(mode>1.5?.19:.07);
      if(mode>.5 && mode<1.5) zoom=1.+floor(travel*5.)*.0125;
      float angle=sin(phase)*(mode>1.5?.035:.012);
      mat2 turn=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
      vec2 uv=core+turn*p/zoom;
      uv+=vec2(sin(phase),sin(phase)*cos(phase))*.006;
      vec3 color=plate(clamp(uv,vec2(.001),vec2(.999)));
      if(mode>1.5){
        vec2 shift=normalize(p+vec2(.0001))*.0017*travel;
        color.r=plate(clamp(uv+shift,vec2(.001),vec2(.999))).r;
        color.b=plate(clamp(uv-shift,vec2(.001),vec2(.999))).b;

      }
      gl_FragColor=vec4(color,1.);
      #include <colorspace_fragment>
    }`,
  depthTest: false, depthWrite: false,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
const clock = { t: 0 };
function render(){
  const t = ((clock.t % 20) + 20) % 20;
  const step = t / 4;
  const index = Math.floor(step);
  const fractional = step - index;
  material.uniforms.first.value = textures[index];
  material.uniforms.next.value = textures[(index + 1) % textures.length];
  material.uniforms.blend.value = style === 'b' ? (fractional >= .85 ? 1 : 0) : fractional * fractional * (3 - 2 * fractional);
  material.uniforms.phase.value = t / 20 * Math.PI * 2;
  renderer.render(scene, camera);
}
const tl = gsap.timeline({ paused: true });
tl.to(clock, { t: 20, duration: 20, ease: 'none', onUpdate: render }, 0);
window.__timelines = window.__timelines || {};
window.__timelines[root.dataset.compositionId] = tl;
window.__motionReview = { ready: true, style, seek(seconds){ tl.seek(seconds); render(); }, getState(){ return {time:clock.t, images:textures.length, renderer:renderer.info.render}; } };
render();
// Re-render after runtime seeks with suppressed callbacks; time belongs ONLY to
// the paused HyperFrames timeline, never requestAnimationFrame wall-clock time.
function draw(){ render(); requestAnimationFrame(draw); }
requestAnimationFrame(draw);
