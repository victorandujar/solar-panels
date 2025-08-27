"use client";

import React, { useMemo, createElement } from "react";
import * as THREE from "three";

import { Point } from "../../types/solar-types";

interface TerrainProps {
  parcela: Point[];
  offset?: number;
}

const Terrain: React.FC<TerrainProps> = ({ parcela, offset = 25 }) => {
  const parcelShape = useMemo(() => {
    if (!parcela || parcela.length === 0) {
      return new THREE.Shape();
    }

    const expandedPoints: THREE.Vector2[] = [];

    for (let i = 0; i < parcela.length; i++) {
      const current = parcela[i];
      const next = parcela[(i + 1) % parcela.length];
      const prev = parcela[(i - 1 + parcela.length) % parcela.length];

      const dx1 = next.X - current.X;
      const dy1 = next.Y - current.Y;
      const length1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

      const dx2 = current.X - prev.X;
      const dy2 = current.Y - prev.Y;
      const length2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      const nx1 = dy1 / length1;
      const ny1 = -dx1 / length1;

      const nx2 = dy2 / length2;
      const ny2 = -dx2 / length2;

      const nx = (nx1 + nx2) / 2;
      const ny = (ny1 + ny2) / 2;

      const normalLength = Math.sqrt(nx * nx + ny * ny);
      const nx_norm = nx / normalLength;
      const ny_norm = ny / normalLength;

      expandedPoints.push(
        new THREE.Vector2(
          current.X + nx_norm * offset,
          current.Y + ny_norm * offset,
        ),
      );
    }

    return new THREE.Shape(expandedPoints);
  }, [parcela, offset]);

  return createElement(
    "group" as any,
    {},
    createElement(
      "mesh" as any,
      { position: [0, 0, -0.2] },
      createElement("shapeGeometry" as any, { args: [parcelShape] }),
      createElement("meshPhongMaterial" as any, {
        side: THREE.DoubleSide,
        color: 0x404040,
        transparent: true,
        opacity: 0.8,
      }),
    ),
  );
};

export default Terrain;
