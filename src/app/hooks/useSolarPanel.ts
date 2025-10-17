"use client";

import { useRef, useCallback, useState, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useDrag } from "@use-gesture/react";
import * as THREE from "three";
import solarData from "../../utils/ObjEyeshot.json";
import { SolarData } from "../types/solar-types";
import { useTranslationSnap } from "@/store/useStore";

interface UseSolarPanelProps {
  position: [number, number, number];
  groupId: string;
  panelId: string;
  dimensions: { length: number; width: number };
  color: number;
  isSelected: boolean;
  isGroupSelected: boolean;
  isHighlighted: boolean;
  isSelectedForDeletion?: boolean;
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
  isSelectedForDeletion = false,
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
  const translationSnap = useTranslationSnap();

  const { parcela } = solarData as SolarData;

  // Apply translation snap to coordinates
  const applyTranslationSnap = useCallback(
    (x: number, y: number, z: number): [number, number, number] => {
      if (translationSnap === null || translationSnap === 0) {
        return [x, y, z];
      }
      return [
        Math.round(x / translationSnap) * translationSnap,
        Math.round(y / translationSnap) * translationSnap,
        Math.round(z / translationSnap) * translationSnap,
      ];
    },
    [translationSnap],
  );

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

  const isPointInFence = useCallback(
    (x: number, y: number): boolean => {
      if (!parcela || parcela.length === 0) return false;

      let inside = false;
      const n = parcela.length;

      for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = parcela[i].X;
        const yi = parcela[i].Y;
        const xj = parcela[j].X;
        const yj = parcela[j].Y;

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }

      return inside;
    },
    [parcela],
  );

  const isPointInParcel = useCallback(
    (x: number, y: number, z: number): boolean => {
      if (!isPointInFence(x, y)) {
        return false;
      }

      const bounds = getParcelBounds();
      return z >= bounds.minZ && z <= bounds.maxZ;
    },
    [isPointInFence, getParcelBounds],
  );

  const findClosestPointInFence = useCallback(
    (x: number, y: number): [number, number] => {
      if (!parcela || parcela.length === 0) return [x, y];

      if (isPointInFence(x, y)) {
        return [x, y];
      }

      let closestPoint: [number, number] = [x, y];
      let minDistance = Infinity;

      for (let i = 0; i < parcela.length; i++) {
        const p1 = parcela[i];
        const p2 = parcela[(i + 1) % parcela.length];

        const A = x - p1.X;
        const B = y - p1.Y;
        const C = p2.X - p1.X;
        const D = p2.Y - p1.Y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        let param = -1;
        if (lenSq !== 0) {
          param = dot / lenSq;
        }

        let xx, yy;
        if (param < 0) {
          xx = p1.X;
          yy = p1.Y;
        } else if (param > 1) {
          xx = p2.X;
          yy = p2.Y;
        } else {
          xx = p1.X + param * C;
          yy = p1.Y + param * D;
        }

        const distance = Math.sqrt((x - xx) * (x - xx) + (y - yy) * (y - yy));
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = [xx, yy];
        }
      }

      return closestPoint;
    },
    [parcela, isPointInFence],
  );

  const clampToParcel = useCallback(
    (x: number, y: number, z: number): [number, number, number] => {
      const bounds = getParcelBounds();
      const clampedZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, z));

      if (isPointInFence(x, y)) {
        return [x, y, clampedZ];
      }

      const [clampedX, clampedY] = findClosestPointInFence(x, y);
      return [clampedX, clampedY, clampedZ];
    },
    [getParcelBounds, isPointInFence, findClosestPointInFence],
  );

  const applyBoundaryResistance = useCallback(
    (x: number, y: number, z: number): [number, number, number] => {
      if (isPointInFence(x, y)) {
        return [x, y, z];
      }

      const [closestX, closestY] = findClosestPointInFence(x, y);
      const distanceToEdge = Math.sqrt(
        (x - closestX) * (x - closestX) + (y - closestY) * (y - closestY),
      );

      const resistanceZone = 50;
      const resistanceFactor = Math.min(distanceToEdge / resistanceZone, 1);

      const resistedX =
        closestX + (x - closestX) * (1 - resistanceFactor * 0.8);
      const resistedY =
        closestY + (y - closestY) * (1 - resistanceFactor * 0.8);

      return [resistedX, resistedY, z];
    },
    [isPointInFence, findClosestPointInFence],
  );

  // ESPACIADO FIJO BASADO EN EL JSON ORIGINAL
  // Del JSON: X va de 290.506 a 304.486 = 13.98 metros
  // Del JSON: Y va de 177.070 a 168.070 = 9 metros
  const GRID_STEP_X = 13.98; // Espaciado horizontal FIJO
  const GRID_STEP_Y = 9.0; // Espaciado vertical FIJO

  const getRealGridSpacing = useCallback((): {
    stepX: number;
    stepY: number;
  } => {
    return {
      stepX: GRID_STEP_X,
      stepY: GRID_STEP_Y,
    };
  }, []);

  const applySnapping = useCallback(
    (
      x: number,
      y: number,
      z: number,
    ): { position: [number, number, number]; isSnapping: boolean } => {
      const { stepX, stepY } = getRealGridSpacing();
      const snappingDistance = Math.max(stepX, stepY) * 0.8;
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
            // Usar spacing REAL en lugar de dimensiones
            const possiblePositions = [
              { x: child.position.x + stepX, y: child.position.y },
              { x: child.position.x - stepX, y: child.position.y },
              { x: child.position.x, y: child.position.y + stepY },
              { x: child.position.x, y: child.position.y - stepY },
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
    [scene, getRealGridSpacing],
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

    const { stepX } = getRealGridSpacing();

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
          spacing: stepX,
        });
      }
    });

    rows.forEach((row) => {
      // SIEMPRE usar stepX fijo del JSON, no promediar
      row.spacing = stepX;
    });

    return rows;
  }, [dimensions.width, scene, getRealGridSpacing]);

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

        // Apply translation snap to the final position
        const snappedPosition = applyTranslationSnap(
          clampedPosition[0],
          clampedPosition[1],
          clampedPosition[2],
        );

        const isValid = isPointInParcel(
          snappedPosition[0],
          snappedPosition[1],
          snappedPosition[2],
        );

        return {
          position: snappedPosition,
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
      applyTranslationSnap,
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
    } else if (isSelectedForDeletion) {
      emissiveIntensity = 2.5;
      opacity = 0.8;
      transparent = true;
      finalColor = new THREE.Color(0xff4444); // Rojo para selección de eliminación
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
    isSelectedForDeletion,
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
