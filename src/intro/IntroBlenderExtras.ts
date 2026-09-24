import { Group, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Texture } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface IntroBlenderExtras {
  portal: Group;
  floorGlyph: Group;
  preview: Mesh<PlaneGeometry, MeshBasicMaterial>;
}

/** Load the authored threshold portal and its ground glyph as hidden scene groups. */
export async function loadIntroBlenderExtras(
  parent: Object3D,
  previewTexture: Texture
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
  const coveredParts = new Set([
    "Intro_VoidBacking",
    "Intro_DoorLeaf_L", "Intro_DoorLeaf_R",
    "Intro_DoorInset_L", "Intro_DoorInset_R",
    "Intro_DoorEdge_L", "Intro_DoorEdge_R",
  ]);
  portalAsset.scene.traverse((part: Object3D): void => {
    if (coveredParts.has(part.name)) part.visible = false;
  });
  portal.add(portalAsset.scene);
  const preview = new Mesh(
    new PlaneGeometry(6.1, 8.4),
    new MeshBasicMaterial({
      map: previewTexture,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      toneMapped: false,
    })
  );
  preview.name = "ActualChapterTwoThresholdView";
  preview.position.set(0, 2.8, -0.28);
  portal.add(preview);

  const floorGlyph = new Group();
  floorGlyph.name = "IntroBlenderFloorGlyph";
  floorGlyph.position.set(0, -1.79, -6.22);
  floorGlyph.scale.setScalar(0.65);
  floorGlyph.visible = false;
  floorGlyph.add(glyphAsset.scene);

  parent.add(portal, floorGlyph);
  return { portal, floorGlyph, preview };
}
