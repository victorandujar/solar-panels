// src/components/SolarPanelLayout.tsx
"use client";

import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  createElement,
  useEffect,
} from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import solarData from "../../../utils/ObjEyeshot.json";
import Modal from "../Modal/Modal";
import SolarPanelDetail from "../SolarPanelDetail/SolarPanelDetail";
import GroupDetail3D from "../GroupDetail3D/GroupDetail3D";
import { useRegisterScene } from "../../hooks/useRegisterScene";

interface Point {
  X: number;
  Y: number;
  Z: number;
}

interface Agrupacion {
  [key: string]: Point[];
}

interface SolarData {
  agrupaciones: Agrupacion;
  longitud: number;
  ancho: number;
  parcela: Point[];
  tilt: number;
}

interface SolarPanelProps {
  position: [number, number, number];
  rotation: [number, number, number];
  groupId: string;
  panelId: string;
  dimensions: { length: number; width: number };
  inclination: number;
  color: number;
  isSelected: boolean;
  isGroupSelected: boolean;
  isHighlighted: boolean;
  onClick: (panelData: any) => void;
}

const SolarPanel: React.FC<SolarPanelProps> = ({
  position,
  rotation,
  groupId,
  panelId,
  dimensions,
  inclination,
  color,
  isSelected,
  isGroupSelected,
  isHighlighted,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const materialProps = useMemo(() => {
    let emissiveIntensity = 0.25;
    let opacity = 1;
    let transparent = false;
    let finalColor = new THREE.Color(color);

    if (isHighlighted) {
      emissiveIntensity = 3.0;
      opacity = 1;
      transparent = true;
      finalColor = new THREE.Color(0xffff00);
    } else if (isGroupSelected) {
      emissiveIntensity = 1.5;
      opacity = 1;
      transparent = true;
    } else if (isSelected) {
      emissiveIntensity = 0.1;
      opacity = 0.9;
      transparent = true;
    }

    return {
      color: finalColor,
      side: THREE.DoubleSide,
      metalness: 0.2,
      roughness: 0.2,
      emissive: finalColor,
      emissiveIntensity,
      opacity,
      transparent,
    };
  }, [color, isSelected, isGroupSelected, isHighlighted]);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      const panelData = {
        groupId,
        panelId,
        position: { x: position[0], y: position[1], z: position[2] },
        inclination,
        dimensions,
      };
      onClick(panelData);
    },
    [groupId, panelId, position, inclination, dimensions, onClick],
  );

  return createElement(
    "mesh" as any,
    {
      ref: meshRef,
      position,
      rotation,
      onClick: handleClick,
    },
    createElement("planeGeometry" as any, {
      args: [dimensions.length, dimensions.width],
    }),
    createElement("meshStandardMaterial" as any, materialProps),
  );
};

interface TerrainProps {
  parcela: Point[];
}

const Terrain: React.FC<TerrainProps> = ({ parcela }) => {
  const shape = useMemo(() => {
    const parcelPoints = parcela.map((p) => new THREE.Vector2(p.X, p.Y));
    return new THREE.Shape(parcelPoints);
  }, [parcela]);

  return createElement(
    "group" as any,
    {},
    createElement(
      "mesh" as any,
      { position: [0, 0, -0.2] },
      createElement("shapeGeometry" as any, { args: [shape] }),
      createElement("meshPhongMaterial" as any, {
        side: THREE.DoubleSide,
        color: 0x404040,
        transparent: true,
        opacity: 0.8,
      }),
    ),
    createElement(
      "lineLoop" as any,
      { position: [0, 0, -0.1] },
      createElement("shapeGeometry" as any, { args: [shape] }),
      createElement("lineBasicMaterial" as any, { color: 0x000000 }),
    ),
  );
};

interface DynamicControlsProps {
  centroid: { x: number; y: number; z: number };
  maxDistance: number;
}

const DynamicControls: React.FC<DynamicControlsProps> = ({
  centroid,
  maxDistance,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const lastGroupCenter = useMemo(() => {
    const { agrupaciones } = solarData as SolarData;
    const lastGroupKey = "10";
    const lastGroup = agrupaciones[lastGroupKey];

    return lastGroup
      ? lastGroup.reduce(
          (acc, p) => ({
            x: acc.x + p.X / lastGroup.length,
            y: acc.y + p.Y / lastGroup.length,
            z: acc.z + p.Z / lastGroup.length,
          }),
          { x: 0, y: 0, z: 0 },
        )
      : centroid;
  }, [centroid]);

  const handleZoom = useCallback(() => {
    if (!controlsRef.current) return;

    const currentDistance = camera.position.distanceTo(
      controlsRef.current.target,
    );
    const minZoomDistance = 10;

    if (currentDistance > maxDistance * 1.8) {
      const firstPhaseRatio = Math.max(
        0,
        Math.min(
          (maxDistance * 3 - currentDistance) /
            (maxDistance * 3 - maxDistance * 1.8),
          1,
        ),
      );

      const firstGroupsCenter = {
        x: centroid.x + (lastGroupCenter.x - centroid.x) * 0.2,
        y: centroid.y + (lastGroupCenter.y - centroid.y) * 0.2,
        z: centroid.z + (lastGroupCenter.z - centroid.z) * 0.2,
      };

      const targetX =
        centroid.x + (firstGroupsCenter.x - centroid.x) * firstPhaseRatio;
      const targetY =
        centroid.y + (firstGroupsCenter.y - centroid.y) * firstPhaseRatio;
      const targetZ =
        centroid.z + (firstGroupsCenter.z - centroid.z) * firstPhaseRatio;

      controlsRef.current.target.set(targetX, targetY, targetZ);
    } else if (
      currentDistance <= maxDistance * 1.8 &&
      currentDistance > minZoomDistance
    ) {
      const secondPhaseRatio = Math.max(
        0,
        Math.min(
          (maxDistance * 1.8 - currentDistance) /
            (maxDistance * 1.8 - minZoomDistance),
          1,
        ),
      );

      const firstGroupsCenter = {
        x: centroid.x + (lastGroupCenter.x - centroid.x) * 0.2,
        y: centroid.y + (lastGroupCenter.y - centroid.y) * 0.2,
        z: centroid.z + (lastGroupCenter.z - centroid.z) * 0.2,
      };

      const targetX =
        firstGroupsCenter.x +
        (lastGroupCenter.x - firstGroupsCenter.x) * secondPhaseRatio;
      const targetY =
        firstGroupsCenter.y +
        (lastGroupCenter.y - firstGroupsCenter.y) * secondPhaseRatio;
      const targetZ =
        firstGroupsCenter.z +
        (lastGroupCenter.z - firstGroupsCenter.z) * secondPhaseRatio;

      controlsRef.current.target.set(targetX, targetY, targetZ);
    }
  }, [camera, centroid, lastGroupCenter, maxDistance]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      screenSpacePanning
      minDistance={10}
      maxDistance={maxDistance * 3}
      target={[centroid.x, centroid.y, centroid.z]}
      maxPolarAngle={Math.PI * 0.8}
      minPolarAngle={Math.PI * 0.1}
      enablePan
      panSpeed={1.0}
      rotateSpeed={0.8}
      zoomSpeed={0.8}
      onChange={handleZoom}
    />
  );
};

interface SolarPlantSceneProps {
  selectedGroup: string;
  selectedPanels: Set<string>;
  onPanelClick: (panelData: any) => void;
  onCameraUpdate: (legendData: Array<{ key: string; color: string }>) => void;
}

const SolarPlantScene: React.FC<SolarPlantSceneProps> = ({
  selectedGroup,
  selectedPanels,
  onPanelClick,
  onCameraUpdate,
}) => {
  const { agrupaciones, longitud, ancho, parcela, tilt } =
    solarData as SolarData;

  const { centroid, legendData, panels, maxDistance } = useMemo(() => {
    const colorPalette = [
      0x4682b4, 0x32cd32, 0xffa500, 0x8a2be2, 0xff69b4, 0x20b2aa, 0xff6347,
      0x1e90ff, 0x228b22, 0xffd700,
    ];

    const centroid = parcela.reduce(
      (acc, p) => ({
        x: acc.x + p.X / parcela.length,
        y: acc.y + p.Y / parcela.length,
        z: acc.z + p.Z / parcela.length,
      }),
      { x: 0, y: 0, z: 0 },
    );

    const allPoints = [...parcela, ...Object.values(agrupaciones).flat()];
    const maxDistance = Math.max(
      ...allPoints.map((p) =>
        Math.sqrt(
          Math.pow(p.X - centroid.x, 2) +
            Math.pow(p.Y - centroid.y, 2) +
            Math.pow(p.Z - centroid.z, 2),
        ),
      ),
    );

    const agrupacionKeys = Object.keys(agrupaciones);
    const legendItems = agrupacionKeys.map((key, idx) => {
      const color = colorPalette[idx % colorPalette.length];
      const colorHex = "#" + color.toString(16).padStart(6, "0");
      return { key, color: colorHex };
    });

    const tiltRad = (tilt * Math.PI) / 180;
    const panelsList: any[] = [];

    agrupacionKeys.forEach((key, idx) => {
      const color = colorPalette[idx % colorPalette.length];
      const points = agrupaciones[key];

      points.forEach((point, panelIdx) => {
        panelsList.push({
          groupId: key,
          panelId: `${key}-${panelIdx}`,
          position: [point.X, point.Y, point.Z + ancho / 2] as [
            number,
            number,
            number,
          ],
          rotation: [tiltRad, 0, 0] as [number, number, number],
          color,
          dimensions: { length: longitud, width: ancho },
          inclination: tilt,
        });
      });
    });

    return {
      centroid,
      legendData: legendItems,
      panels: panelsList,
      maxDistance,
    };
  }, [agrupaciones, longitud, ancho, parcela, tilt]);

  React.useEffect(() => {
    onCameraUpdate(legendData);
  }, [legendData, onCameraUpdate]);

  return (
    <>
      {createElement("ambientLight" as any, { intensity: 0.4 })}
      {createElement("directionalLight" as any, {
        position: [0, 0, 1000],
        intensity: 0.6,
      })}
      {createElement("axesHelper" as any, { args: [100] })}

      <Terrain parcela={parcela} />

      {panels.map((panel) => (
        <SolarPanel
          key={panel.panelId}
          position={panel.position}
          rotation={panel.rotation}
          groupId={panel.groupId}
          panelId={panel.panelId}
          dimensions={panel.dimensions}
          inclination={panel.inclination}
          color={panel.color}
          isSelected={!!selectedGroup && selectedGroup !== panel.groupId}
          isGroupSelected={selectedGroup === panel.groupId}
          isHighlighted={selectedPanels.has(panel.panelId)}
          onClick={onPanelClick}
        />
      ))}

      <DynamicControls centroid={centroid} maxDistance={maxDistance} />
    </>
  );
};

const SolarPanelLayout: React.FC = () => {
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [legendData, setLegendData] = useState<
    Array<{ key: string; color: string }>
  >([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState<any>(null);

  const rootRef = useRef<HTMLDivElement>(null!);

  const handlePanelClick = useCallback((panelData: any) => {
    setSelectedPanel(panelData);
    setIsModalOpen(true);
    setShowGroupDetail(false);
    setSelectedGroupData(null);
  }, []);

  const handleCameraUpdate = useCallback(
    (legendData: Array<{ key: string; color: string }>) => {
      setLegendData(legendData);
    },
    [],
  );

  const handleGroupChange = useCallback((groupId: string) => {
    setSelectedGroup(groupId);
    setIsModalOpen(false);
    setSelectedPanel(null);

    if (groupId) {
      const { agrupaciones } = solarData as SolarData;
      const groupPanels =
        agrupaciones[groupId]?.map((point, panelIdx) => ({
          groupId: groupId,
          panelId: `${groupId}-${panelIdx}`,
          position: { x: point.X, y: point.Y, z: point.Z },
          inclination: (solarData as SolarData).tilt,
          dimensions: {
            length: (solarData as SolarData).longitud,
            width: (solarData as SolarData).ancho,
          },
        })) || [];

      setSelectedGroupData({
        groupId: groupId,
        allPanelsInGroup: groupPanels,
      });
      setShowGroupDetail(true);
    } else {
      setShowGroupDetail(false);
      setSelectedGroupData(null);
    }
  }, []);

  const { agrupaciones, parcela } = solarData as SolarData;

  const cameraPosition = useMemo(() => {
    const centroid = parcela.reduce(
      (acc, p) => ({
        x: acc.x + p.X / parcela.length,
        y: acc.y + p.Y / parcela.length,
        z: acc.z + p.Z / parcela.length,
      }),
      { x: 0, y: 0, z: 0 },
    );

    const allPoints = [...parcela, ...Object.values(agrupaciones).flat()];
    const maxDistance = Math.max(
      ...allPoints.map((p) =>
        Math.sqrt(
          Math.pow(p.X - centroid.x, 2) +
            Math.pow(p.Y - centroid.y, 2) +
            Math.pow(p.Z - centroid.z, 2),
        ),
      ),
    );

    return [centroid.x, centroid.y, maxDistance * 2.5] as [
      number,
      number,
      number,
    ];
  }, [parcela, agrupaciones]);

  useEffect(() => {
    const resizeHandler = () => {};
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  const sceneContent = useMemo(
    () => (
      <>
        <PerspectiveCamera
          makeDefault
          fov={75}
          near={0.1}
          far={10000}
          position={cameraPosition}
        />
        <SolarPlantScene
          selectedGroup={selectedGroup}
          selectedPanels={selectedPanels}
          onPanelClick={handlePanelClick}
          onCameraUpdate={handleCameraUpdate}
        />
      </>
    ),
    [
      cameraPosition,
      selectedGroup,
      selectedPanels,
      handlePanelClick,
      handleCameraUpdate,
    ],
  );

  const sceneConfig = useMemo(
    () => ({
      content: sceneContent,
      cameraType: "perspective" as const,
      cameraSettings: {
        position: cameraPosition,
        makeDefault: true,
      },
    }),
    [sceneContent, cameraPosition],
  );

  useRegisterScene("solar-plant-main", sceneConfig);

  return (
    <>
      <div
        ref={rootRef}
        className={`h-screen overflow-hidden relative transition-all duration-300 ${
          showGroupDetail ? "w-1/2" : "w-full"
        }`}
        style={{ pointerEvents: "auto" }}
      >
        {/* El contenido 3D ahora se renderiza en el Canvas global */}
      </div>

      <div className="absolute top-32 left-5 border border-white/30 bg-white/10 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-lg p-4 text-black z-10">
        <h3 className="text-sm font-semibold mb-3 flex items-center text-gray-800 drop-shadow-sm">
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
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
            />
          </svg>
          Agrupaciones
        </h3>

        <div className="mb-4">
          <select
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white/20 border border-white/30 rounded-lg text-gray-800 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">Todas las agrupaciones</option>
            {legendData.map((item) => (
              <option key={item.key} value={item.key}>
                Grupo {item.key}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-600 mb-2">
          • Selecciona un grupo para ver detalles en el popup
        </div>

        <div className="space-y-2 max-h-90 md:h-64 2xl:h-full overflow-y-auto">
          {legendData.map((item) => (
            <div
              key={item.key}
              className={`flex items-center space-x-3 text-xs p-2 rounded-lg transition-all duration-200 ${
                selectedGroup === item.key
                  ? "bg-white/30 border border-white/50"
                  : "hover:bg-white/10"
              }`}
            >
              <div
                className="w-4 h-4 rounded border border-white/50 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-gray-800 drop-shadow-sm">
                Grupo {item.key}
              </span>
              {selectedGroup === item.key && (
                <svg
                  className="w-3 h-3 ml-auto text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalle de Placa Solar"
      >
        {selectedPanel && <SolarPanelDetail panelData={selectedPanel} />}
      </Modal>

      {showGroupDetail && selectedGroupData && (
        <GroupDetail3D
          groupData={selectedGroupData}
          selectedPanels={selectedPanels}
          onClose={() => {
            setShowGroupDetail(false);
            setSelectedGroupData(null);
            setSelectedPanels(new Set());
          }}
          onPanelSelect={(panelIds: Set<string>) => {
            setSelectedPanels(panelIds);
          }}
        />
      )}
    </>
  );
};

export default SolarPanelLayout;
