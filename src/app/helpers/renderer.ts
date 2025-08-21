import * as THREE from "three";

let renderer: THREE.WebGLRenderer | null = null;
let scenes: Map<
  string,
  { scene: THREE.Scene; camera: THREE.Camera; viewport: THREE.Vector4 }
> = new Map();
let isRenderLoopActive = false;

export function getRenderer(): THREE.WebGLRenderer {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    if (typeof window !== "undefined") {
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.autoClear = false;
  }
  return renderer;
}

export function getCanvas(): HTMLCanvasElement | undefined {
  return renderer?.domElement;
}

export function registerScene(
  id: string,
  scene: THREE.Scene,
  camera: THREE.Camera,
  viewport: THREE.Vector4,
) {
  scenes.set(id, { scene, camera, viewport });

  if (!isRenderLoopActive) {
    startRenderLoop();
  }
}

export function unregisterScene(id: string) {
  scenes.delete(id);

  if (scenes.size === 0) {
    isRenderLoopActive = false;
  }
}

export function updateSceneViewport(id: string, viewport: THREE.Vector4) {
  const sceneData = scenes.get(id);
  if (sceneData) {
    sceneData.viewport = viewport;
  }
}

function startRenderLoop() {
  if (!renderer) return;

  isRenderLoopActive = true;

  function animate() {
    if (!isRenderLoopActive || !renderer) return;

    renderer.clear();

    scenes.forEach(({ scene, camera, viewport }) => {
      if (!renderer) return;

      renderer.setViewport(viewport.x, viewport.y, viewport.z, viewport.w);
      renderer.setScissor(viewport.x, viewport.y, viewport.z, viewport.w);
      renderer.setScissorTest(true);

      renderer.render(scene, camera);
    });

    requestAnimationFrame(animate);
  }

  animate();
}

export function handleResize() {
  if (!renderer || typeof window === "undefined") return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  scenes.forEach((sceneData, id) => {
    if (id === "solar-plant-main") {
      sceneData.viewport.set(0, 0, width, height);
    }
  });
}
