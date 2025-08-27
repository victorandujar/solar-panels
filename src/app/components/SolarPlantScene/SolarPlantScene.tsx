"use client";

import React, { useMemo, createElement } from "react";
import * as THREE from "three";
import solarData from "../../../utils/ObjEyeshot.json";
import SolarPanel from "../SolarPanel/SolarPanel";
import Terrain from "../Terrain/Terrain";
import DynamicControls from "../DynamicControls/DynamicControls";
import {
  useAllPanelStates,
  useSolarPanelStore,
  type SolarPanelState,
} from "../../../store/useStore";

import { SolarData, LegendItem } from "../../types/solar-types";

interface SolarPlantSceneProps {
  selectedGroup: string;
  selectedPanels: Set<string>;
  onPanelClick: (panelData: any) => void;
  onCameraUpdate: (legendData: LegendItem[]) => void;
  modifyLayout: boolean;
  onPositionChange?: (
    panelId: string,
    newPosition: [number, number, number],
  ) => void;
  onGroupChange?: (panelId: string, newGroupId: string) => void;
}

const SolarPlantScene: React.FC<SolarPlantSceneProps> = ({
  selectedGroup,
  selectedPanels,
  onPanelClick,
  onCameraUpdate,
  modifyLayout,
  onPositionChange,
  onGroupChange,
}) => {
  const { agrupaciones, longitud, ancho, parcela, tilt } =
    solarData as SolarData;

  const panelStates = useAllPanelStates();
  const groups = useSolarPanelStore((state: SolarPanelState) => state.groups);

  const { centroid, legendData, panels, maxDistance } = useMemo(() => {
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

    const legendItems: LegendItem[] = groups.map((group) => {
      let color: number;

      if (group.color) {
        color = parseInt(group.color.replace("#", ""), 16);
      } else {
        color = 0xcccccc;
      }

      const colorHex = "#" + color.toString(16).padStart(6, "0");
      return { key: group.id, color: colorHex, count: group.panels.length };
    });

    const tiltRad = (tilt * Math.PI) / 180;
    const panelsList: any[] = [];

    groups.forEach((group) => {
      let color: number;

      if (group.color) {
        color = parseInt(group.color.replace("#", ""), 16);
      } else {
        color = 0xcccccc;
      }

      group.panels.forEach((panel) => {
        panelsList.push({
          groupId: panel.groupId,
          panelId: panel.id,
          position: [
            panel.position.X,
            panel.position.Y,
            panel.position.Z + ancho / 2,
          ] as [number, number, number],
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
  }, [agrupaciones, longitud, ancho, parcela, tilt, groups]);

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
          modifyLayout={modifyLayout}
          onPositionChange={onPositionChange}
          onGroupChange={onGroupChange}
        />
      ))}

      <DynamicControls
        centroid={centroid}
        maxDistance={maxDistance}
        modifyLayout={modifyLayout}
      />
    </>
  );
};

export default SolarPlantScene;
