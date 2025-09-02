"use client";

import React, {
  useMemo,
  useRef,
  useState,
  createElement,
  useCallback,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { usePanelActive } from "../../../store/useStore";
import SolarPlantScene from "../SolarPlantScene/SolarPlantScene";
import { useSolarPlant } from "../../hooks/useSolarPlant";

interface PanelData {
  panelId: string;
  groupId: string;
  position: { x: number; y: number; z: number };
  inclination: number;
  dimensions: { length: number; width: number };
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

  const isActive = usePanelActive(panelData.panelId);

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
    context.strokeStyle = "rgba(255, 255, 255, 0.9)";
    context.lineWidth = 4;
    context.strokeRect(4, 4, 248, 120);

    context.shadowColor = "rgba(0, 0, 0, 0.7)";
    context.shadowBlur = 6;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.fillText(`${index + 1}`, 128, 85);

    return new THREE.CanvasTexture(canvas);
  }, [index]);

  return (
    <>
      <mesh
        ref={meshRef}
        position={localPosition}
        rotation={[0, 0, 0]}
        scale={[
          panelData.dimensions.length * 0.9,
          panelData.dimensions.width * 0.9,
          1,
        ]}
        onClick={handleClick}
        userData={panelData}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={!isActive ? 0xcccccc : isSelected ? 0xffff00 : 0x39ff14}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={!isActive ? 0.5 : isSelected ? 1 : 0.9}
        />
      </mesh>

      <sprite
        position={[localPosition[0], localPosition[1], 1]}
        scale={[2, 1, 1]}
      >
        <spriteMaterial
          map={numberTexture}
          transparent={true}
          depthTest={false}
          depthWrite={false}
        />
      </sprite>
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

interface PlantOverviewSceneProps {
  groupData: {
    groupId: string;
    allPanelsInGroup: PanelData[];
  };
}

const PlantOverviewScene: React.FC<PlantOverviewSceneProps> = React.memo(
  ({ groupData }) => {
    const {
      state,
      handlePanelClick,
      handleCameraUpdate,
      handlePositionChange,
      handlePanelGroupChange,
      sceneConfig: baseSceneConfig,
      cameraPosition,
    } = useSolarPlant();

    const sceneContent = useMemo(
      () => (
        <>
          <PerspectiveCamera
            makeDefault
            fov={75}
            near={0.1}
            far={5000}
            position={cameraPosition}
          />
          <SolarPlantScene
            selectedGroup={state.selectedGroup}
            selectedPanels={state.selectedPanels}
            selectedPanelsForDeletion={state.selectedPanelsForDeletion}
            onPanelClick={handlePanelClick}
            onCameraUpdate={handleCameraUpdate}
            modifyLayout={state.modifyLayout}
            onPositionChange={handlePositionChange}
            onGroupChange={handlePanelGroupChange}
          />
        </>
      ),
      [
        cameraPosition,
        state.selectedGroup,
        state.selectedPanels,
        state.selectedPanelsForDeletion,
        handlePanelClick,
        handleCameraUpdate,
        state.modifyLayout,
        handlePositionChange,
        handlePanelGroupChange,
      ],
    );

    return sceneContent;
  },
);

PlantOverviewScene.displayName = "PlantOverviewScene";

const GroupSceneComponent: React.FC<GroupSceneProps> = ({
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

    const frustumSize = Math.max(1, groupSize * 1.5);

    return { centerX, centerY, frustumSize };
  }, [groupData]);

  const aspectRatio = 600 / 400;
  const cameraZ = Math.max(30, frustumSize * 0.2);

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
        position={[0, 0, Math.max(40, cameraZ)]}
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

const GroupScene = React.memo(GroupSceneComponent);

export { GroupScene, PlantOverviewScene };
export default GroupScene;
