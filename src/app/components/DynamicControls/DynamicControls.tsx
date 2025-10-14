"use client";

import React, { useRef, useMemo, useCallback, useEffect } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import solarData from "../../../utils/ObjEyeshot.json";

import { SolarData } from "../../types/solar-types";

interface DynamicControlsProps {
  centroid: { x: number; y: number; z: number };
  maxDistance: number;
  modifyLayout: boolean;
}

const DynamicControls: React.FC<DynamicControlsProps> = ({
  centroid,
  maxDistance,
  modifyLayout,
}) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  // Guardar la posición original de la cámara
  const originalCameraPosition = useRef({ x: 0, y: 0, z: 0 });
  const originalTarget = useRef({ x: 0, y: 0, z: 0 });

  // Guardar referencia a los controles en el canvas para TransformControls
  useEffect(() => {
    if (controlsRef.current) {
      (gl.domElement as any).__orbitControls = controlsRef.current;
    }
  }, [gl]);

  // Cuando entra en modo edición, cambiar a vista superior y hacer zoom más cercano
  useEffect(() => {
    if (!controlsRef.current) return;

    if (modifyLayout) {
      // Guardar posición actual SOLO la primera vez que se activa modo edición
      if (
        originalCameraPosition.current.x === 0 &&
        originalCameraPosition.current.y === 0 &&
        originalCameraPosition.current.z === 0
      ) {
        originalCameraPosition.current = {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        };
        originalTarget.current = {
          x: controlsRef.current.target.x,
          y: controlsRef.current.target.y,
          z: controlsRef.current.target.z,
        };
      }

      // Cambiar a vista superior (ortogonal desde arriba) con zoom equilibrado
      // Un poco más alejado para que no corte con el header (1.25 en lugar de 1.1)
      const topViewHeight = maxDistance * 1.25; // Equilibrado y sin que corte el header
      camera.position.set(centroid.x, centroid.y, topViewHeight);
      controlsRef.current.target.set(centroid.x, centroid.y, 0);
      camera.up.set(0, 1, 0); // Asegurar que el "arriba" sea el eje Y
      controlsRef.current.update();
    } else if (
      originalCameraPosition.current.x !== 0 ||
      originalCameraPosition.current.y !== 0 ||
      originalCameraPosition.current.z !== 0
    ) {
      // Solo restaurar si hemos guardado una posición previamente
      camera.position.set(
        originalCameraPosition.current.x,
        originalCameraPosition.current.y,
        originalCameraPosition.current.z,
      );
      controlsRef.current.target.set(
        originalTarget.current.x,
        originalTarget.current.y,
        originalTarget.current.z,
      );
      controlsRef.current.update();
    }
  }, [modifyLayout, camera, centroid, maxDistance]);

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
      enabled={true}
      enableDamping={true}
      enablePan={true}
      enableZoom={true}
      enableRotate={!modifyLayout} // Solo permitir rotación cuando NO esté en modo edición
      dampingFactor={0.1}
      screenSpacePanning
      minDistance={10}
      maxDistance={maxDistance * 3}
      target={[centroid.x, centroid.y, centroid.z]}
      maxPolarAngle={Math.PI * 0.8} // Límite normal de rotación
      minPolarAngle={Math.PI * 0.1} // Límite normal de rotación
      panSpeed={modifyLayout ? 1.5 : 1.0}
      rotateSpeed={0.8}
      zoomSpeed={modifyLayout ? 1.2 : 0.8}
      onChange={modifyLayout ? undefined : handleZoom}
    />
  );
};

export default DynamicControls;
