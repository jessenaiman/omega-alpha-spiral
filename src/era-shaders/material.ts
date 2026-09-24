import { Color, DoubleSide, ShaderMaterial, type CanvasTexture } from "three";
import type { EraShaderDefinition } from "./types";

const ERA_TEXT_VERTEX = `attribute float aGlyph; varying vec2 vUv; varying float vGlyph;
  void main(){vUv=uv; vGlyph=aGlyph; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`;

const ERA_TEXT_FRAGMENT = `uniform sampler2D uAtlas; uniform vec3 uColor; uniform vec2 uCell; uniform float uTime,uOpacity,uScan,uDots,uHalo; varying vec2 vUv; varying float vGlyph;
  void main(){
    vec2 cell=vec2(mod(vGlyph,16.0),6.0-floor(vGlyph/16.0));
    vec2 p=(cell+vUv)/vec2(16.0,7.0);
    float a=texture2D(uAtlas,p).a;
    vec2 d=vec2(1.0)/(uCell*vec2(16.0,7.0));
    float halo=(texture2D(uAtlas,p+d).a+texture2D(uAtlas,p-d).a+texture2D(uAtlas,p+vec2(d.x,-d.y)).a+texture2D(uAtlas,p+vec2(-d.x,d.y)).a)*uHalo;
    vec2 dotPosition=fract(vUv*uCell)-.5;
    a*=mix(1.0,1.0-smoothstep(.32,.52,length(dotPosition)),uDots);
    float scan=1.0-uScan*(.5+.5*sin(vUv.y*170.0-uTime*.4));
    float alpha=(a+halo)*uOpacity*scan;
    if(alpha<.008) discard;
    gl_FragColor=vec4(uColor,alpha);
    #include <colorspace_fragment>
  }`;

export function createEraTextMaterial(
  shader: EraShaderDefinition,
  atlas: CanvasTexture,
  color: string
): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uAtlas: { value: atlas },
      uColor: { value: new Color(color) },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uScan: { value: shader.effects.scan },
      uDots: { value: shader.effects.dots },
      uHalo: { value: shader.effects.halo },
      uCell: { value: [...shader.cell] },
    },
    vertexShader: ERA_TEXT_VERTEX,
    fragmentShader: ERA_TEXT_FRAGMENT,
  });
}

export function applyEraTextMaterial(
  material: ShaderMaterial,
  shader: EraShaderDefinition,
  atlas: CanvasTexture
): void {
  material.uniforms.uAtlas.value = atlas;
  material.uniforms.uScan.value = shader.effects.scan;
  material.uniforms.uDots.value = shader.effects.dots;
  material.uniforms.uHalo.value = shader.effects.halo;
  material.uniforms.uCell.value = [...shader.cell];
}
