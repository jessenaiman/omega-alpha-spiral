import { Group, Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface IntroBlenderExtras {
  portal: Group;
  floorGlyph: Group;
}

/** Load the authored threshold portal and its ground glyph as hidden scene groups. */
export async function loadIntroBlenderExtras(
  parent: Object3D
): Promise<IntroBlenderExtras> {
  const loader = new GLTFLoader();
  const [portalAsset, glyphAsset] = await Promise.all([
    loader.loadAsync("/assets/intro/intro-portal.glb"),
    loader.loadAsync("/assets/intro/intro-floor-glyph.glb"),
  ]);

  const portal = new Group();
  portal.name = "IntroBlenderPortal";
  portal.position.set(0, -1.82, -6.0);
  portal.scale.setScalar(0.65);
  portal.visible = false;
  portal.add(portalAsset.scene);

  const floorGlyph = new Group();
  floorGlyph.name = "IntroBlenderFloorGlyph";
  floorGlyph.position.set(0, -1.79, -6.22);
  floorGlyph.scale.setScalar(0.65);
  floorGlyph.visible = false;
  floorGlyph.add(glyphAsset.scene);

  parent.add(portal, floorGlyph);
  return { portal, floorGlyph };
}
