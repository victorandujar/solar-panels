"use client";

import React, { useMemo, createElement } from "react";
import * as THREE from "three";
import { Point } from "../../types/solar-types";

interface FenceProps {
  parcela: Point[];
  height?: number;
  color?: number;
  lineWidth?: number;
}

const Fence: React.FC<FenceProps> = ({
  parcela,
  height = 1,
  color = 0x00ff00,
  lineWidth = 3,
}) => {
  const fenceGeometry = useMemo(() => {
    if (!parcela || parcela.length === 0) return null;

    const points = parcela.map(
      (point) => new THREE.Vector3(point.X, point.Y, point.Z + height),
    );
    points.push(points[0].clone());

    return points;
  }, [parcela, height]);

  if (!fenceGeometry) return null;

  return createElement(
    "line" as any,
    {},
    createElement("bufferGeometry" as any, {}, [
      createElement("bufferAttribute" as any, {
        key: "position-attribute",
        attach: "attributes-position",
        args: [
          new Float32Array(fenceGeometry.flatMap((p) => [p.x, p.y, p.z])),
          3,
        ],
      }),
    ]),
    createElement("lineBasicMaterial" as any, {
      color,
      linewidth: lineWidth,
    }),
  );
};

export default Fence;
