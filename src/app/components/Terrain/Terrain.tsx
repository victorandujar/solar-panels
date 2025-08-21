"use client";

import React, { useMemo, createElement } from "react";
import * as THREE from "three";

import { Point } from "../../types/solar-types";

interface TerrainProps {
  parcela: Point[];
}

const Terrain: React.FC<TerrainProps> = ({ parcela }) => {
  const shape = useMemo(() => {
    const parcelPoints = parcela.map((p) => new THREE.Vector2(p.X, p.Y));
    return new THREE.Shape(parcelPoints);
  }, [parcela]);

  return createElement(
    "group" as any,
    {},
    createElement(
      "mesh" as any,
      { position: [0, 0, -0.2] },
      createElement("shapeGeometry" as any, { args: [shape] }),
      createElement("meshPhongMaterial" as any, {
        side: THREE.DoubleSide,
        color: 0x404040,
        transparent: true,
        opacity: 0.8,
      }),
    ),
    createElement(
      "lineLoop" as any,
      { position: [0, 0, -0.1] },
      createElement("shapeGeometry" as any, { args: [shape] }),
      createElement("lineBasicMaterial" as any, { color: 0x000000 }),
    ),
  );
};

export default Terrain;
