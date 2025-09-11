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
  isSelectedForDeletion?: boolean;
  isActive: boolean;
  onClick: (panelData: any, event?: any) => void;
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
  isSelectedForDeletion = false,
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
    isSelectedForDeletion,
    isActive,
    modifyLayout,
    onPositionChange,
    onGroupChange,
  });

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      const panelData = {
        id: panelId,
        groupId,
        panelId,
        position: { x: position[0], y: position[1], z: position[2] },
        inclination,
        dimensions,
      };

      // Siempre pasar el evento para que se pueda obtener la posición exacta del click
      onClick(panelData, event);
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
