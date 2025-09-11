"use client";

import React, { useMemo, createElement } from "react";
import * as THREE from "three";
import { useSolarPanelStore } from "../../../store/useStore";

import { Point } from "../../types/solar-types";

interface TerrainWithCorridorsProps {
  parcela: Point[];
  offset?: number;
}

const TerrainWithCorridors: React.FC<TerrainWithCorridorsProps> = ({
  parcela,
  offset = 25,
}) => {
  const vials = useSolarPanelStore((state) => state.vials);

  const { terrainShape, corridorShapes } = useMemo(() => {
    if (!parcela || parcela.length === 0) {
      return {
        terrainShape: new THREE.Shape(),
        corridorShapes: [] as THREE.Shape[],
      };
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

    const baseShape = new THREE.Shape(expandedPoints);

    const corridorShapes: THREE.Shape[] = [];

    vials.forEach((vial, index) => {
      if (vial.start && vial.end && vial.lineWidth && vial.lineWidth > 0) {
        const dx = vial.end.X - vial.start.X;
        const dy = vial.end.Y - vial.start.Y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 0) {
          const ux = dx / length;
          const uy = dy / length;

          const px = -uy;
          const py = ux;

          const halfWidth = vial.lineWidth / 2;

          const corridorPoints = [
            new THREE.Vector2(
              vial.start.X + px * halfWidth,
              vial.start.Y + py * halfWidth,
            ),
            new THREE.Vector2(
              vial.end.X + px * halfWidth,
              vial.end.Y + py * halfWidth,
            ),
            new THREE.Vector2(
              vial.end.X - px * halfWidth,
              vial.end.Y - py * halfWidth,
            ),
            new THREE.Vector2(
              vial.start.X - px * halfWidth,
              vial.start.Y - py * halfWidth,
            ),
          ];

          const corridorShape = new THREE.Shape(corridorPoints);
          corridorShapes.push(corridorShape);

          baseShape.holes.push(corridorShape);
        } else {
        }
      } else {
      }
    });

    return {
      terrainShape: baseShape,
      corridorShapes,
    };
  }, [parcela, offset, vials]);

  return createElement(
    "group" as any,
    {},
    createElement(
      "mesh" as any,
      { position: [0, 0, -0.2] },
      createElement("shapeGeometry" as any, { args: [terrainShape] }),
      createElement("meshPhongMaterial" as any, {
        side: THREE.DoubleSide,
        color: 0x404040,
        transparent: true,
        opacity: 0.8,
      }),
    ),
    ...corridorShapes.map((shape, index) =>
      createElement(
        "mesh" as any,
        {
          key: `corridor-${index}`,
          position: [0, 0, -0.15],
        },
        createElement("shapeGeometry" as any, { args: [shape] }),
        createElement("meshPhongMaterial" as any, {
          side: THREE.DoubleSide,
          color: 0x8b4513,
          transparent: false,
          opacity: 1.0,
        }),
      ),
    ),
  );
};

export default TerrainWithCorridors;
