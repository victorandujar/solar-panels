"use client";

import React, { useRef, useMemo, useCallback, createElement } from "react";
import { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { Point } from "../../types/solar-types";

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

export default SolarPanel;
