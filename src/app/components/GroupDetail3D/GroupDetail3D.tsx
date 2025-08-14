import React, { useMemo, useRef, useState, createElement } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
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

interface GroupPanelProps {
  panelData: PanelData;
  index: number;
  isSelected: boolean;
  onPanelClick: (panelId: string) => void;
  localPosition: [number, number, number];
}

const GroupPanel: React.FC<GroupPanelProps> = ({
  panelData,
  index,
  isSelected,
  onPanelClick,
  localPosition,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onPanelClick(panelData.panelId);
  };

  const numberTexture = useMemo(() => {
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

    return new THREE.CanvasTexture(canvas);
  }, [index]);

  return (
    <>
      {createElement(
        "mesh" as any,
        {
          ref: meshRef,
          position: localPosition,
          rotation: [0, 0, 0],
          scale: [
            panelData.dimensions.length * 0.9,
            panelData.dimensions.width * 0.9,
            1,
          ],
          onClick: handleClick,
          userData: panelData,
        },
        createElement("planeGeometry" as any, { args: [1, 1] }),
        createElement("meshStandardMaterial" as any, {
          color: isSelected ? 0xffff00 : 0x4682b4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 1 : 0.9,
        }),
      )}

      {createElement(
        "sprite" as any,
        {
          position: [localPosition[0], localPosition[1], 1],
          scale: [2, 1, 1],
        },
        createElement("spriteMaterial" as any, {
          map: numberTexture,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      )}
    </>
  );
};

interface GroupSceneProps {
  groupData: {
    groupId: string;
    allPanelsInGroup: PanelData[];
  };
  selectedPanels: Set<string>;
  onPanelSelect: (panelIds: Set<string>) => void;
}

const GroupScene: React.FC<GroupSceneProps> = ({
  groupData,
  selectedPanels,
  onPanelSelect,
}) => {
  const handlePanelClick = (panelId: string) => {
    const newSelectedPanels = new Set(selectedPanels);
    if (newSelectedPanels.has(panelId)) {
      newSelectedPanels.delete(panelId);
    } else {
      newSelectedPanels.add(panelId);
    }
    onPanelSelect(newSelectedPanels);
  };

  const { centerX, centerY, frustumSize } = useMemo(() => {
    if (
      !groupData.allPanelsInGroup ||
      groupData.allPanelsInGroup.length === 0
    ) {
      return { centerX: 0, centerY: 0, frustumSize: 10 };
    }

    const positions = groupData.allPanelsInGroup.map((p) => p.position);
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;

    const safeWidth = Math.max(groupWidth, 1);
    const safeHeight = Math.max(groupHeight, 1);
    const groupSize = Math.max(safeWidth, safeHeight);

    const frustumSize = Math.max(1, groupSize * 1.15);

    return { centerX, centerY, frustumSize };
  }, [groupData]);

  const aspectRatio = 600 / 400;
  const cameraZ = Math.max(15, frustumSize * 0.08);

  return (
    <>
      {createElement("ambientLight" as any, { intensity: 0.8 })}
      {createElement("directionalLight" as any, {
        position: [5, 10, 5],
        intensity: 1.0,
      })}
      {createElement("directionalLight" as any, {
        position: [-5, 5, -5],
        intensity: 0.5,
      })}

      <OrthographicCamera
        makeDefault
        left={(frustumSize * aspectRatio) / -2}
        right={(frustumSize * aspectRatio) / 2}
        top={frustumSize / 2}
        bottom={frustumSize / -2}
        near={0.1}
        far={1000}
        position={[0, 0, Math.max(30, cameraZ)]}
        onUpdate={(camera) => {
          camera.lookAt(0, 0, 0);
          camera.up.set(0, 1, 0);
        }}
      />

      {groupData.allPanelsInGroup.map((panelData, index) => {
        const localX = panelData.position.x - centerX;
        const localY = panelData.position.y - centerY;
        return (
          <GroupPanel
            key={panelData.panelId}
            panelData={panelData}
            index={index}
            localPosition={[localX, localY, 0]}
            isSelected={selectedPanels.has(panelData.panelId)}
            onPanelClick={handlePanelClick}
          />
        );
      })}
    </>
  );
};

const GroupDetail3D: React.FC<GroupDetail3DProps> = ({
  groupData,
  selectedPanels,
  onPanelSelect,
  onClose,
}) => {
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");

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
    <div className="fixed top-32 right-4 w-[600px] md:h-[78vh] 2xl:w-[85vh] h-[85vh] flex flex-col justify-between bg-white/10 backdrop-blur-lg rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-[9999] overflow-y-auto">
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

      <div className="p-4">
        <div className="w-full h-[400px] rounded-lg bg-gray-50 overflow-hidden">
          <Canvas
            gl={{
              antialias: true,
              alpha: true,
            }}
            style={{ background: "transparent" }}
          >
            <GroupScene
              groupData={groupData}
              selectedPanels={selectedPanels}
              onPanelSelect={onPanelSelect}
            />
          </Canvas>
        </div>

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

        <div className="text-xs text-black font-bold">
          <p>• Haz clic en las placas para seleccionarlas individualmente</p>
          <p>• Usa los inputs para seleccionar un rango de placas</p>
          <p>• Placas seleccionadas: {selectedPanels.size}</p>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail3D;
