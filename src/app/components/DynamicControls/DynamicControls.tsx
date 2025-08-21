"use client";

import React, { useRef, useMemo, useCallback } from "react";
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
      enabled={!modifyLayout}
      enableDamping={!modifyLayout}
      enablePan={!modifyLayout}
      enableZoom={!modifyLayout}
      enableRotate={!modifyLayout}
      dampingFactor={0.1}
      screenSpacePanning
      minDistance={10}
      maxDistance={maxDistance * 3}
      target={[centroid.x, centroid.y, centroid.z]}
      maxPolarAngle={Math.PI * 0.8}
      minPolarAngle={Math.PI * 0.1}
      panSpeed={1.0}
      rotateSpeed={0.8}
      zoomSpeed={0.8}
      onChange={modifyLayout ? undefined : handleZoom}
    />
  );
};

export default DynamicControls;
