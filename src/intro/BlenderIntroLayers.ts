import { Group, Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export interface BlenderIntroLayers {
  background: Group;
  strands: Group;
}

/** Both Blender files use the same meter scale and doorway origin. */
export async function loadBlenderIntroLayers(
  parent: Object3D,
  placement: "study" | "game" = "study"
): Promise<BlenderIntroLayers> {
  const loader = new GLTFLoader();
  const [voidLayer, strandLayer] = await Promise.all([
    loader.loadAsync("/assets/intro/void-background.glb"),
    loader.loadAsync("/assets/intro/dreamweaver-strands.glb"),
  ]);
  const place = (source: Group): Group => {
    const layer = new Group();
    if (placement === "game") {
      layer.position.set(0, -2.62, -3);
      layer.scale.setScalar(0.6);
    } else {
      layer.position.z = -18.53;
      layer.scale.z = 1.67;
    }
    layer.add(source);
    layer.visible = false;
    parent.add(layer);
    return layer;
  };
  return {
    background: place(voidLayer.scene),
    strands: place(strandLayer.scene),
  };
}
