"use client";

import { useRef, useCallback, useState, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useDrag } from "@use-gesture/react";
import * as THREE from "three";
import solarData from "../../utils/ObjEyeshot.json";
import { SolarData } from "../types/solar-types";

interface UseSolarPanelProps {
  position: [number, number, number];
  groupId: string;
  panelId: string;
  dimensions: { length: number; width: number };
  color: number;
  isSelected: boolean;
  isGroupSelected: boolean;
  isHighlighted: boolean;
  isActive: boolean;
  modifyLayout: boolean;
  onPositionChange?: (
    panelId: string,
    newPosition: [number, number, number],
  ) => void;
  onGroupChange?: (panelId: string, newGroupId: string) => void;
}

export const useSolarPanel = ({
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
}: UseSolarPanelProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [nearbyGroupId, setNearbyGroupId] = useState<string | null>(null);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isRowSnapping, setIsRowSnapping] = useState(false);
  const { camera, raycaster, scene } = useThree();

  const { parcela } = solarData as SolarData;

  const getParcelBounds = useCallback(() => {
    if (!parcela || parcela.length === 0) {
      return {
        minX: -1000,
        maxX: 1000,
        minY: -1000,
        maxY: 1000,
        minZ: -10,
        maxZ: 10,
      };
    }

    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    parcela.forEach((point) => {
      minX = Math.min(minX, point.X);
      maxX = Math.max(maxX, point.X);
      minY = Math.min(minY, point.Y);
      maxY = Math.max(maxY, point.Y);
      minZ = Math.min(minZ, point.Z);
      maxZ = Math.max(maxZ, point.Z);
    });

    const margin = 20;
    return {
      minX: minX - margin,
      maxX: maxX + margin,
      minY: minY - margin,
      maxY: maxY + margin,
      minZ: minZ - 5,
      maxZ: maxZ + 5,
    };
  }, [parcela]);

  const isPointInParcel = useCallback(
    (x: number, y: number, z: number): boolean => {
      const bounds = getParcelBounds();
      return (
        x >= bounds.minX &&
        x <= bounds.maxX &&
        y >= bounds.minY &&
        y <= bounds.maxY &&
        z >= bounds.minZ &&
        z <= bounds.maxZ
      );
    },
    [getParcelBounds],
  );

  const clampToParcel = useCallback(
    (x: number, y: number, z: number): [number, number, number] => {
      const bounds = getParcelBounds();
      return [
        Math.max(bounds.minX, Math.min(bounds.maxX, x)),
        Math.max(bounds.minY, Math.min(bounds.maxY, y)),
        Math.max(bounds.minZ, Math.min(bounds.maxZ, z)),
      ];
    },
    [getParcelBounds],
  );

  const applyBoundaryResistance = useCallback(
    (x: number, y: number, z: number): [number, number, number] => {
      const bounds = getParcelBounds();
      const resistanceZone = 50;

      let clampedX = x;
      let clampedY = y;
      let clampedZ = z;

      if (x < bounds.minX + resistanceZone) {
        const factor = (x - bounds.minX) / resistanceZone;
        clampedX = bounds.minX + (x - bounds.minX) * Math.max(0.1, factor);
      } else if (x > bounds.maxX - resistanceZone) {
        const factor = (bounds.maxX - x) / resistanceZone;
        clampedX = bounds.maxX - (bounds.maxX - x) * Math.max(0.1, factor);
      }

      if (y < bounds.minY + resistanceZone) {
        const factor = (y - bounds.minY) / resistanceZone;
        clampedY = bounds.minY + (y - bounds.minY) * Math.max(0.1, factor);
      } else if (y > bounds.maxY - resistanceZone) {
        const factor = (bounds.maxY - y) / resistanceZone;
        clampedY = bounds.maxY - (bounds.maxY - y) * Math.max(0.1, factor);
      }

      return [clampedX, clampedY, clampedZ];
    },
    [getParcelBounds],
  );

  const applySnapping = useCallback(
    (
      x: number,
      y: number,
      z: number,
    ): { position: [number, number, number]; isSnapping: boolean } => {
      const snappingDistance = dimensions.length * 0.8;
      const snappingTolerance = 8;
      let snappedX = x;
      let snappedY = y;
      let snappedZ = z;
      let isSnapping = false;
      let bestSnapDistance = snappingTolerance;

      scene.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child !== meshRef.current &&
          child.userData.panelId
        ) {
          const distance = Math.sqrt(
            Math.pow(child.position.x - x, 2) +
              Math.pow(child.position.y - y, 2),
          );

          if (distance < snappingDistance && distance > 0) {
            const panelWidth = dimensions.width;
            const panelLength = dimensions.length;

            const possiblePositions = [
              { x: child.position.x + panelLength, y: child.position.y },
              { x: child.position.x - panelLength, y: child.position.y },
              { x: child.position.x, y: child.position.y + panelWidth },
              { x: child.position.x, y: child.position.y - panelWidth },
            ];

            for (const pos of possiblePositions) {
              const snapDistance = Math.sqrt(
                Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2),
              );

              if (
                snapDistance < snappingTolerance &&
                snapDistance < bestSnapDistance
              ) {
                snappedX = pos.x;
                snappedY = pos.y;
                isSnapping = true;
                bestSnapDistance = snapDistance;
              }
            }
          }
        }
      });

      return {
        position: [snappedX, snappedY, snappedZ],
        isSnapping,
      };
    },
    [dimensions.length, dimensions.width, scene],
  );

  const detectRows = useCallback(() => {
    const panels: Array<{ x: number; y: number; id: string; groupId: string }> =
      [];
    const rowTolerance = dimensions.width * 0.3;

    scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child !== meshRef.current &&
        child.userData.panelId
      ) {
        panels.push({
          x: child.position.x,
          y: child.position.y,
          id: child.userData.panelId,
          groupId: child.userData.groupId,
        });
      }
    });

    const rows: Array<{
      y: number;
      panels: Array<{ x: number; y: number; id: string; groupId: string }>;
      minX: number;
      maxX: number;
      spacing: number;
    }> = [];

    panels.forEach((panel) => {
      let foundRow = false;

      for (const row of rows) {
        if (Math.abs(panel.y - row.y) < rowTolerance) {
          row.panels.push(panel);
          row.minX = Math.min(row.minX, panel.x);
          row.maxX = Math.max(row.maxX, panel.x);
          foundRow = true;
          break;
        }
      }

      if (!foundRow) {
        rows.push({
          y: panel.y,
          panels: [panel],
          minX: panel.x,
          maxX: panel.x,
          spacing: dimensions.length,
        });
      }
    });

    rows.forEach((row) => {
      if (row.panels.length > 1) {
        const sortedPanels = row.panels.sort((a, b) => a.x - b.x);
        const spacings: number[] = [];

        for (let i = 1; i < sortedPanels.length; i++) {
          spacings.push(sortedPanels[i].x - sortedPanels[i - 1].x);
        }

        row.spacing =
          spacings.reduce((sum, spacing) => sum + spacing, 0) / spacings.length;
      }
    });

    return rows;
  }, [dimensions.width, dimensions.length, scene]);

  const isVeryCloseToRow = useCallback(
    (x: number, y: number): boolean => {
      const rows = detectRows();
      const closeThreshold = 8;

      for (const row of rows) {
        const distanceToRow = Math.abs(y - row.y);
        if (distanceToRow < closeThreshold) {
          return true;
        }
      }

      return false;
    },
    [detectRows],
  );

  const applyRowSnapping = useCallback(
    (
      x: number,
      y: number,
      z: number,
    ): {
      position: [number, number, number];
      isSnapping: boolean;
      forceSnapping: boolean;
    } => {
      const rows = detectRows();
      const rowSnappingTolerance = 15;
      const forceSnappingThreshold = 8;
      let bestPosition: [number, number, number] = [x, y, z];
      let isSnapping = false;
      let forceSnapping = false;
      let bestDistance = rowSnappingTolerance;

      for (const row of rows) {
        const distanceToRow = Math.abs(y - row.y);

        if (
          distanceToRow < rowSnappingTolerance &&
          distanceToRow < bestDistance
        ) {
          const sortedPanels = row.panels.sort((a, b) => a.x - b.x);

          let bestX = x;
          let minDistance = Infinity;

          for (let i = 0; i < sortedPanels.length - 1; i++) {
            const gap = sortedPanels[i + 1].x - sortedPanels[i].x;
            if (gap > row.spacing * 1.5) {
              const gapCenter = sortedPanels[i].x + gap / 2;
              const distance = Math.abs(x - gapCenter);
              if (distance < minDistance && distance < rowSnappingTolerance) {
                bestX = gapCenter;
                minDistance = distance;
              }
            }
          }

          const startExtension = sortedPanels[0].x - row.spacing;
          const startDistance = Math.abs(x - startExtension);
          if (
            startDistance < minDistance &&
            startDistance < rowSnappingTolerance
          ) {
            bestX = startExtension;
            minDistance = startDistance;
          }

          const endExtension =
            sortedPanels[sortedPanels.length - 1].x + row.spacing;
          const endDistance = Math.abs(x - endExtension);
          if (endDistance < minDistance && endDistance < rowSnappingTolerance) {
            bestX = endExtension;
            minDistance = endDistance;
          }

          if (minDistance < rowSnappingTolerance) {
            bestPosition = [bestX, row.y, z];
            isSnapping = true;
            forceSnapping = distanceToRow < forceSnappingThreshold;
            bestDistance = distanceToRow;
          }
        }
      }

      return {
        position: bestPosition,
        isSnapping,
        forceSnapping,
      };
    },
    [detectRows],
  );

  const getTerrainIntersection = useCallback(
    (
      mouseX: number,
      mouseY: number,
      originalZ: number,
    ): {
      position: [number, number, number];
      isValid: boolean;
      isSnapping: boolean;
      isRowSnapping: boolean;
      forceSnapping: boolean;
    } => {
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -originalZ);

      const mouse = new THREE.Vector2(
        (mouseX / window.innerWidth) * 2 - 1,
        -(mouseY / window.innerHeight) * 2 + 1,
      );

      raycaster.setFromCamera(mouse, camera);
      const intersection = new THREE.Vector3();
      const intersects = raycaster.ray.intersectPlane(plane, intersection);

      if (intersects) {
        const resistedPosition = applyBoundaryResistance(
          intersection.x,
          intersection.y,
          intersection.z,
        );

        const rowSnappingResult = applyRowSnapping(
          resistedPosition[0],
          resistedPosition[1],
          resistedPosition[2],
        );

        const afterRowSnap = rowSnappingResult.isSnapping
          ? rowSnappingResult.position
          : resistedPosition;

        let finalPosition = afterRowSnap;
        let snappingResult = { position: afterRowSnap, isSnapping: false };

        if (!rowSnappingResult.forceSnapping) {
          snappingResult = applySnapping(
            afterRowSnap[0],
            afterRowSnap[1],
            afterRowSnap[2],
          );

          finalPosition = snappingResult.isSnapping
            ? snappingResult.position
            : afterRowSnap;
        }

        const clampedPosition = clampToParcel(
          finalPosition[0],
          finalPosition[1],
          finalPosition[2],
        );
        const isValid = isPointInParcel(
          finalPosition[0],
          finalPosition[1],
          finalPosition[2],
        );

        return {
          position: clampedPosition,
          isValid,
          isSnapping: snappingResult.isSnapping || rowSnappingResult.isSnapping,
          isRowSnapping: rowSnappingResult.isSnapping,
          forceSnapping: rowSnappingResult.forceSnapping || false,
        };
      }

      return {
        position: [position[0], position[1], position[2]],
        isValid: false,
        isSnapping: false,
        isRowSnapping: false,
        forceSnapping: false,
      };
    },
    [
      camera,
      raycaster,
      isPointInParcel,
      clampToParcel,
      applyBoundaryResistance,
      applySnapping,
      applyRowSnapping,
      position,
    ],
  );

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
    } else if (isDragging && isOutOfBounds) {
      emissiveIntensity = 2.0;
      opacity = 0.7;
      transparent = true;
      finalColor = new THREE.Color(0xff0000);
    } else if (isDragging && isRowSnapping) {
      emissiveIntensity = 3.0;
      opacity = 0.95;
      transparent = true;
      finalColor = new THREE.Color(0xff6b35);
    } else if (isDragging && isSnapping) {
      emissiveIntensity = 2.5;
      opacity = 0.9;
      transparent = true;
      finalColor = new THREE.Color(0x00ffff);
    } else if (isDragging) {
      emissiveIntensity = 2.0;
      opacity = 0.8;
      transparent = true;
      finalColor = nearbyGroupId
        ? new THREE.Color(0xffa500)
        : new THREE.Color(0x00ff00);
    } else if (nearbyGroupId && !isDragging) {
      emissiveIntensity = 1.8;
      opacity = 0.9;
      transparent = true;
      finalColor = new THREE.Color(0xffa500);
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
  }, [
    color,
    isSelected,
    isGroupSelected,
    isHighlighted,
    isActive,
    isDragging,
    nearbyGroupId,
    isOutOfBounds,
    isSnapping,
    isRowSnapping,
  ]);

  const detectGroupCollision = useCallback(
    (currentPosition: [number, number, number]): string | null => {
      if (!meshRef.current || !scene) return null;

      const currentMesh = meshRef.current;
      const distanceThreshold = dimensions.length * 1.5;
      let closestGroupId: string | null = null;
      let closestDistance = Infinity;

      scene.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child !== currentMesh &&
          child.userData.panelId
        ) {
          const distance = currentMesh.position.distanceTo(child.position);

          if (distance < distanceThreshold && distance < closestDistance) {
            closestDistance = distance;
            closestGroupId = child.userData.groupId;
          }
        }
      });

      return closestGroupId;
    },
    [dimensions.length, scene],
  );

  const bind = useDrag(
    ({ active, movement: [x, y], event }) => {
      if (!modifyLayout || !meshRef.current) return;

      event.stopPropagation();

      if (active) {
        setIsDragging(true);

        let clientX = 0,
          clientY = 0;

        if ("clientX" in event && "clientY" in event) {
          clientX = event.clientX;
          clientY = event.clientY;
        } else if (event instanceof MouseEvent) {
          clientX = event.clientX;
          clientY = event.clientY;
        }

        const intersection = getTerrainIntersection(
          clientX,
          clientY,
          position[2],
        );

        const newPosition: [number, number, number] = intersection.position;
        const isValidPosition = intersection.isValid;
        const isCurrentlySnapping = intersection.isSnapping;
        const isCurrentlyRowSnapping = intersection.isRowSnapping;
        const isForceSnapping = intersection.forceSnapping;

        setIsOutOfBounds(!isValidPosition);
        setIsSnapping(
          isCurrentlySnapping && !isCurrentlyRowSnapping && !isForceSnapping,
        );
        setIsRowSnapping(isCurrentlyRowSnapping || isForceSnapping);

        meshRef.current.position.set(...newPosition);

        if (isValidPosition) {
          const nearbyGroup = detectGroupCollision(newPosition);
          setNearbyGroupId(nearbyGroup);
        } else {
          setNearbyGroupId(null);
        }

        if (onPositionChange) {
          onPositionChange(panelId, newPosition);
        }
      } else {
        setIsDragging(false);

        const currentPosition = meshRef.current.position.toArray() as [
          number,
          number,
          number,
        ];
        const isValidPosition = isPointInParcel(
          currentPosition[0],
          currentPosition[1],
          currentPosition[2],
        );

        if (isValidPosition) {
          const collidedGroupId = detectGroupCollision(currentPosition);

          if (collidedGroupId && collidedGroupId !== groupId && onGroupChange) {
            onGroupChange(panelId, collidedGroupId);
          }
        } else {
          meshRef.current.position.set(position[0], position[1], position[2]);
          if (onPositionChange) {
            onPositionChange(panelId, position);
          }
        }

        setNearbyGroupId(null);
        setIsOutOfBounds(false);
        setIsSnapping(false);
        setIsRowSnapping(false);
      }
    },
    { filterTaps: true },
  );

  return {
    meshRef,
    materialProps,
    bind,
    isDragging,
    nearbyGroupId,
    isOutOfBounds,
    isSnapping,
    isRowSnapping,
  };
};
