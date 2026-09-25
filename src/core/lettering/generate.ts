// Skeleton → atlas. One authored skeleton, rasterised at each era shader's fidelity.
import { CanvasTexture, LinearFilter, NearestFilter } from "three";
import { assertEraShaderBuilt } from "../../era-shaders/registry";
import { SKELETON, type Glyph } from "./skeleton";
import type { EraShaderDefinition } from "../../era-shaders";

export const GLYPHS =
  Array.from({ length: 96 }, (_, i) => String.fromCharCode(i + 32)).join("") +
  "∞◊Ω≋※—↑↓↵‘’“”…";

const COLS = 16;
const ROWS = 7;

function trace(
  ctx: CanvasRenderingContext2D,
  glyph: Glyph,
  [cw, ch]: readonly [number, number],
  round: boolean
) {
  ctx.beginPath();
  for (const s of glyph) {
    if (s.length < 4) continue;
    const pts: [number, number][] = [];
    for (let i = 0; i < s.length; i += 2) pts.push([s[i] * cw, s[i + 1] * ch]);
    const last = pts[pts.length - 1];
    ctx.moveTo(pts[0][0], pts[0][1]);
    if (round && pts.length > 2) {
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
    } else {
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.lineTo(last[0], last[1]);
  }
  ctx.stroke();
}

/** A glyph we have not authored yet — visible, never a silent blank. */
function tofu(
  ctx: CanvasRenderingContext2D,
  [cw, ch]: readonly [number, number]
) {
  ctx.strokeRect(cw * 0.22, ch * 0.22, cw * 0.56, ch * 0.56);
}

function harden(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] > 110 ? 255 : 0;
  ctx.putImageData(img, 0, 0);
}

export function makeAtlas(eraShader: EraShaderDefinition): CanvasTexture {
  assertEraShaderBuilt(eraShader);
  const [cw, ch] = eraShader.cell;
  const smooth = eraShader.round > 0.5;
  const canvas = document.createElement("canvas");
  canvas.width = cw * COLS;
  canvas.height = ch * ROWS;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = Math.max(1, eraShader.weight * ch);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const pad = ctx.lineWidth / 2 + 0.5;
  for (let i = 0; i < GLYPHS.length; i++) {
    const ch2 = GLYPHS[i];
    ctx.save();
    ctx.translate((i % COLS) * cw, Math.floor(i / COLS) * ch);
    ctx.translate(pad, pad);
    ctx.scale((cw - pad * 2) / cw, (ch - pad * 2) / ch);
    const glyph = SKELETON[ch2];
    if (ch2 === " ") {
      // nothing
    } else if (glyph && glyph.length) trace(ctx, glyph, eraShader.cell, smooth);
    else tofu(ctx, eraShader.cell);
    ctx.restore();
  }
  if (!smooth) harden(ctx, canvas.width, canvas.height);
  const tex = new CanvasTexture(canvas);
  tex.minFilter = smooth ? LinearFilter : NearestFilter;
  tex.magFilter = tex.minFilter;
  tex.generateMipmaps = false;
  return tex;
}
