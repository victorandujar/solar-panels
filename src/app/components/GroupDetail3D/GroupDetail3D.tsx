import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface PanelData {
  panelId: string;
  groupId: string;
  position: { x: number; y: number; z: number };
  inclination: number;
  dimensions: { length: number; width: number };
}

interface GroupDetail3DProps {
  groupData: {
    groupId: string;
    allPanelsInGroup: PanelData[];
  };
  selectedPanels: Set<string>;
  onPanelSelect: (panelIds: Set<string>) => void;
  onClose: () => void;
}

const GroupDetail3D: React.FC<GroupDetail3DProps> = ({
  groupData,
  selectedPanels,
  onPanelSelect,
  onClose,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const panelMeshesRef = useRef<THREE.Mesh[]>([]);

  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(500, 400);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    const positions = groupData.allPanelsInGroup.map((p) => p.position);
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;
    const groupSize = Math.max(groupWidth, groupHeight);

    const aspectRatio = 500 / 400;
    const frustumSize = groupSize * 1.2;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspectRatio) / -2,
      (frustumSize * aspectRatio) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000,
    );

    camera.position.set(centerX, centerY, 10);
    camera.lookAt(centerX, centerY, 0);
    camera.up.set(0, 1, 0);
    cameraRef.current = camera;

    const panelMeshes: THREE.Mesh[] = [];
    const panelGeometry = new THREE.PlaneGeometry(1, 1);

    groupData.allPanelsInGroup.forEach((panelData, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: selectedPanels.has(panelData.panelId) ? 0xffff00 : 0x4682b4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: selectedPanels.has(panelData.panelId) ? 1 : 0.9,
      });

      const panel = new THREE.Mesh(panelGeometry, material);

      panel.scale.set(
        panelData.dimensions.length * 0.9,
        panelData.dimensions.width * 0.9,
        1,
      );

      panel.position.set(panelData.position.x, panelData.position.y, 0);

      panel.rotation.set(0, 0, 0);

      (panel as any).userData = panelData;

      panelMeshes.push(panel);
      scene.add(panel);

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.width = 256;
      canvas.height = 128;

      context.fillStyle = "rgba(255, 255, 255, 0.95)";
      context.fillRect(0, 0, 256, 128);
      context.strokeStyle = "rgba(0, 0, 0, 0.9)";
      context.lineWidth = 4;
      context.strokeRect(4, 4, 248, 120);

      context.shadowColor = "rgba(0, 0, 0, 0.7)";
      context.shadowBlur = 6;
      context.shadowOffsetX = 2;
      context.shadowOffsetY = 2;

      context.fillStyle = "rgba(0, 0, 0, 0.95)";
      context.font = "bold 48px Arial";
      context.textAlign = "center";
      context.fillText(`${index + 1}`, 128, 85);

      const texture = new THREE.CanvasTexture(canvas);
      const textMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(textMaterial);
      sprite.position.set(panelData.position.x, panelData.position.y, 1);
      sprite.scale.set(2, 1, 1);
      scene.add(sprite);
    });

    panelMeshesRef.current = panelMeshes;

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(panelMeshes);

      if (intersects.length > 0) {
        const clickedPanel = intersects[0].object;
        const userData = clickedPanel.userData;
        const panelId = userData.panelId;

        const newSelectedPanels = new Set(selectedPanels);
        if (newSelectedPanels.has(panelId)) {
          newSelectedPanels.delete(panelId);
        } else {
          newSelectedPanels.add(panelId);
        }
        onPanelSelect(newSelectedPanels);
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener("click", handleClick);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [groupData, selectedPanels, onPanelSelect]);

  useEffect(() => {
    panelMeshesRef.current.forEach((panel) => {
      const material = panel.material as THREE.MeshStandardMaterial;
      const userData = (panel as any).userData;

      if (selectedPanels.has(userData.panelId)) {
        material.color.setHex(0xffff00);
        material.opacity = 1;
      } else {
        material.color.setHex(0x4682b4);
        material.opacity = 0.8;
      }
    });
  }, [selectedPanels]);

  const handleRangeSelect = () => {
    if (!rangeStart || !rangeEnd) return;

    const startIndex = parseInt(rangeStart);
    const endIndex = parseInt(rangeEnd);

    if (isNaN(startIndex) || isNaN(endIndex)) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    const newSelectedPanels = new Set(selectedPanels);
    for (let i = minIndex; i <= maxIndex; i++) {
      const panelId = `${groupData.groupId}-${i}`;
      if (groupData.allPanelsInGroup.some((p) => p.panelId === panelId)) {
        newSelectedPanels.add(panelId);
      }
    }

    onPanelSelect(newSelectedPanels);
  };

  const clearSelection = () => {
    onPanelSelect(new Set());
  };

  return (
    <div className="fixed top-32 right-4 w-[600px] h-[85vh] flex flex-col justify-between bg-white/95 backdrop-blur-lg rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-[9999]">
      <div className="bg-black text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Grupo {groupData.groupId}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-sm opacity-90">
          {groupData.allPanelsInGroup.length} paneles en este grupo
        </p>
      </div>

      <div className="p-4 bg-white/10 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
        <div ref={mountRef} className="w-full  rounded-lg bg-gray-50"></div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-black">
          <h3 className="text-sm font-semibold mb-2 text-gray-800">
            Selección por Rango
          </h3>
          <div className="flex space-x-2 mb-2">
            <input
              type="number"
              placeholder="ID Inicio"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="ID Fin"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleRangeSelect}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Seleccionar Rango
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Limpiar Selección
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-600">
          <p>• Haz clic en las placas para seleccionarlas individualmente</p>
          <p>• Usa los inputs para seleccionar un rango de placas</p>
          <p>• Placas seleccionadas: {selectedPanels.size}</p>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail3D;
