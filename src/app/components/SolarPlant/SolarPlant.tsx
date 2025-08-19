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
import GroupSelector from "../GroupSelector/GroupSelector";
import PanelStats from "../PanelStats/PanelStats";
import QuickControls from "../QuickControls/QuickControls";
import { useRegisterScene } from "../../hooks/useRegisterScene";
import {
  useSolarPanelStore,
  useAllPanelStates,
  type SolarPanelState,
} from "../../../store/useStore";

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
  isActive: boolean;
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
  isActive,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const materialProps = useMemo(() => {
    let emissiveIntensity = 0.25;
    let opacity = 1;
    let transparent = false;
    let finalColor = new THREE.Color(color);

    if (!isActive) {
      finalColor = new THREE.Color(0xcccccc);
      emissiveIntensity = 0.1;
      opacity = 0.6;
      transparent = true;
    } else if (isHighlighted) {
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
  }, [color, isSelected, isGroupSelected, isHighlighted, isActive]);

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
      enableZoom={true}
      enableRotate={true}
    />
  );
};

interface SolarPlantSceneProps {
  selectedGroup: string;
  selectedPanels: Set<string>;
  onPanelClick: (panelData: any) => void;
  onCameraUpdate: (
    legendData: Array<{ key: string; color: string; count: number }>,
  ) => void;
}

const SolarPlantScene: React.FC<SolarPlantSceneProps> = ({
  selectedGroup,
  selectedPanels,
  onPanelClick,
  onCameraUpdate,
}) => {
  const { agrupaciones, longitud, ancho, parcela, tilt } =
    solarData as SolarData;

  const panelStates = useAllPanelStates();

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
      const count = agrupaciones[key].length;
      return { key, color: colorHex, count };
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
          isActive={panelStates[panel.panelId] ?? true}
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
    Array<{ key: string; color: string; count: number }>
  >([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState<any>(null);

  const initializePanels = useSolarPanelStore(
    (state: SolarPanelState) => state.initializePanels,
  );

  const rootRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    initializePanels();
  }, [initializePanels]);

  const handlePanelClick = useCallback((panelData: any) => {
    setSelectedPanel(panelData);
    setIsModalOpen(true);
    setShowGroupDetail(false);
    setSelectedGroupData(null);
  }, []);

  const handleCameraUpdate = useCallback(
    (legendData: Array<{ key: string; color: string; count: number }>) => {
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

    const distance = maxDistance * 1.8;
    const angle = Math.PI / 3;

    const x = centroid.x;
    const y = centroid.y - distance * Math.sin(angle);
    const z = centroid.z + distance * Math.cos(angle);

    return [x, y, z] as [number, number, number];
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
        className={`h-screen overflow-hidden relative transition-all duration-300 font-mono ${
          showGroupDetail ? "w-1/2" : "w-full"
        }`}
        style={{ pointerEvents: "auto" }}
      ></div>

      <GroupSelector
        legendData={legendData}
        selectedGroup={selectedGroup}
        onGroupChange={handleGroupChange}
      />

      <PanelStats className="fixed top-[30%] left-[21%] z-20 min-w-[200px]" />

      <QuickControls className="fixed top-[14.5%] left-[21%] z-20 min-w-[200px]" />

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
            setSelectedGroup("");
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
