"use client";

import React, { useMemo, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useSolarPanelStore, useTranslationSnap } from "@/store/useStore";

interface SnapGridProps {
  visible: boolean;
  parcela: Array<{ X: number; Y: number; Z: number }>;
  panelDimensions: { length: number; width: number };
}

const SnapGrid: React.FC<SnapGridProps> = ({
  visible,
  parcela,
  panelDimensions,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const groups = useSolarPanelStore((state) => state.groups);
  const translationSnap = useTranslationSnap();

  // Calcular límites de la parcela
  const bounds = useMemo(() => {
    if (!parcela || parcela.length === 0) {
      return { minX: -100, maxX: 100, minY: -100, maxY: 100, avgZ: 0 };
    }

    const minX = Math.min(...parcela.map((p) => p.X));
    const maxX = Math.max(...parcela.map((p) => p.X));
    const minY = Math.min(...parcela.map((p) => p.Y));
    const maxY = Math.max(...parcela.map((p) => p.Y));
    const avgZ = parcela.reduce((sum, p) => sum + p.Z, 0) / parcela.length;

    return { minX, maxX, minY, maxY, avgZ };
  }, [parcela]);

  // Detectar filas y columnas existentes de paneles
  const { rows, columns } = useMemo(() => {
    const rowPositions = new Set<number>();
    const columnPositions = new Set<number>();
    const tolerance = panelDimensions.width * 0.3;

    groups.forEach((group) => {
      group.panels.forEach((panel) => {
        // Redondear a la cuadrícula de snap
        const snapY =
          Math.round(panel.position.Y / translationSnap) * translationSnap;
        const snapX =
          Math.round(panel.position.X / translationSnap) * translationSnap;

        rowPositions.add(snapY);
        columnPositions.add(snapX);
      });
    });

    return {
      rows: Array.from(rowPositions).sort((a, b) => a - b),
      columns: Array.from(columnPositions).sort((a, b) => a - b),
    };
  }, [groups, translationSnap, panelDimensions.width]);

  // Función para verificar si un punto está dentro de la parcela
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

  // Función para verificar si una posición está ocupada
  const isPositionOccupied = useCallback(
    (x: number, y: number): boolean => {
      const tolerance =
        Math.min(panelDimensions.length, panelDimensions.width) * 0.4;

      for (const group of groups) {
        for (const panel of group.panels) {
          const distance = Math.sqrt(
            Math.pow(x - panel.position.X, 2) +
              Math.pow(y - panel.position.Y, 2),
          );
          if (distance < tolerance) {
            return true;
          }
        }
      }
      return false;
    },
    [groups, panelDimensions],
  );

  // Generar puntos SOLO donde están los paneles existentes (SIMPLE)
  const snapPoints = useMemo(() => {
    const points: Array<[number, number, number]> = [];
    const pointSize: number[] = [];
    const pointColors: number[] = [];

    // Usar un Set para evitar duplicados
    const uniquePositions = new Set<string>();

    groups.forEach((group) => {
      group.panels.forEach((panel) => {
        const x = panel.position.X;
        const y = panel.position.Y;
        const z = panel.position.Z;

        // Crear clave única redondeada para evitar duplicados
        const key = `${Math.round(x * 100)},${Math.round(y * 100)}`;

        if (!uniquePositions.has(key)) {
          uniquePositions.add(key);

          points.push([x, y, z + 0.3]); // Elevado sobre la placa
          pointSize.push(6.0); // Tamaño fijo
          pointColors.push(0, 1, 0); // VERDE
        }
      });
    });

    return { points, pointSize, pointColors };
  }, [groups]);

  // Crear geometría de puntos
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(snapPoints.points.length * 3);
    const sizes = new Float32Array(snapPoints.pointSize);
    const colors = new Float32Array(snapPoints.pointColors);

    snapPoints.points.forEach((point, i) => {
      positions[i * 3] = point[0];
      positions[i * 3 + 1] = point[1];
      positions[i * 3 + 2] = point[2];
    });

    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return geom;
  }, [snapPoints]);

  if (!visible) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={3}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation={false}
        depthWrite={false}
      />
    </points>
  );
};

export default SnapGrid;
