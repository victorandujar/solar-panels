"use client";

import React, { useMemo, useRef, createElement, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  useSolarPanelStore,
  usePanelActive,
  type SolarPanelState,
} from "../../../store/useStore";

interface SolarPanelDetailProps {
  panelData: {
    position: { x: number; y: number; z: number };
    inclination: number;
    groupId: string;
    panelId: string;
    dimensions: { length: number; width: number };
  };
}

interface SolarCellProps {
  position: [number, number, number];
  width: number;
  height: number;
}

const SolarCell: React.FC<SolarCellProps> = ({ position, width, height }) => {
  return createElement(
    "mesh" as any,
    { position },
    createElement("planeGeometry" as any, {
      args: [width * 0.9, height * 0.9],
    }),
    createElement("meshStandardMaterial" as any, {
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
    }),
  );
};

interface AnimatedParticleProps {
  initialPosition: [number, number, number];
  index: number;
}

const AnimatedParticle: React.FC<AnimatedParticleProps> = ({
  initialPosition,
  index,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y =
        initialPosition[1] + Math.sin(Date.now() * 0.001 + index) * 0.0005;
      if (meshRef.current.material) {
        (meshRef.current.material as THREE.MeshStandardMaterial).opacity =
          0.5 + Math.sin(Date.now() * 0.002 + index) * 0.3;
      }
    }
  });

  return createElement(
    "mesh" as any,
    { ref: meshRef, position: initialPosition },
    createElement("sphereGeometry" as any, { args: [0.003, 8, 8] }),
    createElement("meshStandardMaterial" as any, {
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.9,
    }),
  );
};

interface SolarPanelSceneProps {
  panelData: SolarPanelDetailProps["panelData"];
}

const SolarPanelScene: React.FC<SolarPanelSceneProps> = ({ panelData }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(0x0a0a1a);
  }, [scene]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  const { length, width } = panelData.dimensions;
  const cellRows = 6;
  const cellCols = 10;
  const cellWidth = length / cellCols;
  const cellHeight = width / cellRows;

  const cellPositions = useMemo(() => {
    const positions: Array<[number, number, number]> = [];
    for (let row = 0; row < cellRows; row++) {
      for (let col = 0; col < cellCols; col++) {
        const x = (col - cellCols / 2 + 0.5) * cellWidth;
        const y = (row - cellRows / 2 + 0.5) * cellHeight;
        positions.push([x, y, 0.027]);
      }
    }
    return positions;
  }, [cellRows, cellCols, cellWidth, cellHeight]);

  const particlePositions = useMemo(() => {
    const positions: Array<[number, number, number]> = [];
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * length * 0.7;
      const y = (Math.random() - 0.5) * width * 0.7;
      positions.push([x, y, 0.029]);
    }
    return positions;
  }, [length, width]);

  const gridLines = useMemo(() => {
    const lines = [];

    for (let i = 1; i < cellCols; i++) {
      const x = (i - cellCols / 2) * cellWidth;
      lines.push({
        type: "vertical",
        position: [x, 0, 0.028] as [number, number, number],
        geometry: [0.002, width, 0.001] as [number, number, number],
      });
    }

    for (let i = 1; i < cellRows; i++) {
      const y = (i - cellRows / 2) * cellHeight;
      lines.push({
        type: "horizontal",
        position: [0, y, 0.028] as [number, number, number],
        geometry: [length, 0.002, 0.001] as [number, number, number],
      });
    }

    return lines;
  }, [cellRows, cellCols, cellWidth, cellHeight, length, width]);

  return (
    <>
      {createElement("ambientLight" as any, { args: [0x001122, 0.4] })}
      {createElement("directionalLight" as any, {
        args: [0x00aaff, 1.5],
        position: [6, 8, 6],
        castShadow: true,
      })}
      {createElement("pointLight" as any, {
        args: [0x00ffff, 2.0, 10],
        position: [0, 4, 0],
      })}
      {createElement("pointLight" as any, {
        args: [0x0088ff, 1.5, 8],
        position: [4, 0, 4],
      })}

      {createElement(
        "group" as any,
        {
          ref: groupRef,
          rotation: [(panelData.inclination * Math.PI) / 180, 0, 0],
        },
        createElement(
          "mesh" as any,
          { castShadow: true, receiveShadow: true },
          createElement("boxGeometry" as any, { args: [length, width, 0.05] }),
          createElement("meshStandardMaterial" as any, {
            color: 0x0a0a0a,
            metalness: 0.8,
            roughness: 0.1,
            transparent: true,
            opacity: 0.9,
          }),
        ),

        createElement(
          "mesh" as any,
          { position: [0, 0, 0.026] },
          createElement("planeGeometry" as any, { args: [length, width] }),
          createElement("meshStandardMaterial" as any, {
            color: 0x001122,
            metalness: 0.5,
            roughness: 0.05,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
          }),
        ),

        ...cellPositions.map((pos, index) =>
          createElement(SolarCell, {
            key: `cell-${index}`,
            position: pos,
            width: cellWidth,
            height: cellHeight,
          }),
        ),

        ...gridLines.map((line, index) =>
          createElement(
            "mesh" as any,
            { key: `line-${index}`, position: line.position },
            createElement("boxGeometry" as any, { args: line.geometry }),
            createElement("meshStandardMaterial" as any, {
              color: 0x00ffff,
              emissive: 0x00ffff,
              emissiveIntensity: 0.8,
              transparent: true,
              opacity: 0.9,
            }),
          ),
        ),

        ...particlePositions.map((pos, index) =>
          createElement(AnimatedParticle, {
            key: `particle-${index}`,
            initialPosition: pos,
            index,
          }),
        ),

        createElement(
          "mesh" as any,
          { position: [0, width / 2, 0.03] },
          createElement("boxGeometry" as any, { args: [length, 0.02, 0.01] }),
          createElement("meshStandardMaterial" as any, {
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0,
          }),
        ),
        createElement(
          "mesh" as any,
          { position: [0, -width / 2, 0.03] },
          createElement("boxGeometry" as any, { args: [length, 0.02, 0.01] }),
          createElement("meshStandardMaterial" as any, {
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0,
          }),
        ),
        createElement(
          "mesh" as any,
          { position: [-length / 2, 0, 0.03] },
          createElement("boxGeometry" as any, { args: [0.02, width, 0.01] }),
          createElement("meshStandardMaterial" as any, {
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0,
          }),
        ),
        createElement(
          "mesh" as any,
          { position: [length / 2, 0, 0.03] },
          createElement("boxGeometry" as any, { args: [0.02, width, 0.01] }),
          createElement("meshStandardMaterial" as any, {
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0,
          }),
        ),

        createElement(
          "mesh" as any,
          { position: [-length / 2 + 0.15, -width / 2 + 0.15, -0.6] },
          createElement("boxGeometry" as any, { args: [0.08, 0.08, 0.6] }),
          createElement("meshStandardMaterial" as any, {
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7,
          }),
        ),
        createElement(
          "mesh" as any,
          { position: [length / 2 - 0.15, -width / 2 + 0.15, -0.35] },
          createElement("boxGeometry" as any, { args: [0.08, 0.08, 0.6] }),
          createElement("meshStandardMaterial" as any, {
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7,
          }),
        ),
        createElement(
          "mesh" as any,
          { position: [0, -width / 2 + 0.15, -0.65] },
          createElement("boxGeometry" as any, {
            args: [length - 0.3, 0.04, 0.04],
          }),
          createElement("meshStandardMaterial" as any, {
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7,
          }),
        ),
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={20}
        target={[0, 0, 0]}
      />
    </>
  );
};

const SolarPanelDetail: React.FC<SolarPanelDetailProps> = ({ panelData }) => {
  // Zustand store para manejar el estado del panel
  const togglePanel = useSolarPanelStore(
    (state: SolarPanelState) => state.togglePanel,
  );
  const isActive = usePanelActive(panelData.panelId);

  const handleTogglePanel = () => {
    togglePanel(panelData.panelId);
  };

  return (
    <div className="space-y-4">
      <div className="bg-transparent rounded-lg p-6 shadow-2xl backdrop-blur-md border border-gray-500/20">
        {/* Control de Estado del Panel */}
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">
            Panel {panelData.panelId}
          </h3>
          <button
            onClick={handleTogglePanel}
            className={`px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
              isActive
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-600 hover:bg-gray-700 text-gray-200"
            }`}
          >
            {isActive ? "✓ Activo" : "✗ Inactivo"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="h-[250px] w-full">
              <div className="border border-gray-500/30 rounded-lg overflow-hidden bg-transparent backdrop-blur-md shadow-inner w-full h-full">
                <Canvas
                  style={{ width: "100%", height: "100%" }}
                  camera={{
                    fov: 75,
                    near: 0.1,
                    far: 1000,
                    position: [7, 4, 10],
                  }}
                >
                  <SolarPanelScene panelData={panelData} />
                </Canvas>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Información Técnica
            </h4>

            <div className="space-y-3 bg-gray-800/50 rounded-lg p-4 border border-gray-500/40">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Grupo:</span>
                  <span className="text-sm font-bold text-white px-2 py-1 rounded">
                    {panelData.groupId}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">ID Placa:</span>
                  <span className="text-sm font-bold text-white px-2 py-1 rounded">
                    {panelData.panelId}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Inclinación:</span>
                  <span className="text-sm font-bold text-white px-2 py-1 rounded">
                    {panelData.inclination}°
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Longitud:</span>
                  <span className="text-sm font-bold text-white px-2 py-1 rounded">
                    {panelData.dimensions.length}m
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Ancho:</span>
                  <span className="text-sm font-bold text-white px-2 py-1 rounded">
                    {panelData.dimensions.width}m
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-500/40">
              <h5 className="text-sm font-semibold text-white mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Posición
              </h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-white">X</div>
                  <div className="text-white font-bold">
                    {panelData.position.x.toFixed(2)}m
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white">Y</div>
                  <div className="text-white font-bold">
                    {panelData.position.y.toFixed(2)}m
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white">Z</div>
                  <div className="text-white font-bold">
                    {panelData.position.z.toFixed(2)}m
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarPanelDetail;
