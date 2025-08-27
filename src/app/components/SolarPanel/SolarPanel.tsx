"use client";

import React, { useCallback, createElement } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { useSolarPanel } from "../../hooks/useSolarPanel";

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
  modifyLayout: boolean;
  onPositionChange?: (
    panelId: string,
    newPosition: [number, number, number],
  ) => void;
  onGroupChange?: (panelId: string, newGroupId: string) => void;
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
  modifyLayout,
  onPositionChange,
  onGroupChange,
}) => {
  const { meshRef, materialProps, bind } = useSolarPanel({
    position,
    groupId,
    panelId,
    dimensions,
    color,
    isSelected,
    isGroupSelected,
    isHighlighted,
    isActive,
    modifyLayout,
    onPositionChange,
    onGroupChange,
  });

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (modifyLayout) return;

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
    [
      groupId,
      panelId,
      position,
      inclination,
      dimensions,
      onClick,
      modifyLayout,
    ],
  );

  return createElement(
    "mesh" as any,
    {
      ref: meshRef,
      position,
      rotation,
      onClick: handleClick,
      userData: {
        panelId,
        groupId,
        isDraggable: modifyLayout,
      },
      ...(modifyLayout ? bind() : {}),
    },
    createElement("planeGeometry" as any, {
      args: [dimensions.length, dimensions.width],
    }),
    createElement("meshStandardMaterial" as any, materialProps),
  );
};

export default SolarPanel;
