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

  // Generar puntos de snap en las intersecciones de filas y columnas
  const snapPoints = useMemo(() => {
    const points: Array<[number, number, number]> = [];
    const pointSize: number[] = [];
    const pointColors: number[] = [];

    // Calcular espaciado entre columnas
    const columnSpacing =
      columns.length > 1 ? columns[1] - columns[0] : panelDimensions.length;
    const rowSpacing =
      rows.length > 1 ? rows[1] - rows[0] : panelDimensions.width * 2;

    // Generar filas extendidas (arriba y abajo)
    const allRows: number[] = [...rows];

    // Añadir filas arriba
    if (rows.length > 0) {
      for (let i = 1; i <= 5; i++) {
        const newY = rows[0] - rowSpacing * i;
        if (newY >= bounds.minY - 10) {
          allRows.unshift(newY);
        }
      }

      // Añadir filas abajo
      for (let i = 1; i <= 5; i++) {
        const newY = rows[rows.length - 1] + rowSpacing * i;
        if (newY <= bounds.maxY + 10) {
          allRows.push(newY);
        }
      }
    }

    // Generar columnas extendidas (izquierda y derecha)
    const allColumns: number[] = [...columns];

    if (columns.length > 0) {
      // Añadir columnas a la izquierda
      for (let i = 1; i <= 5; i++) {
        const newX = columns[0] - columnSpacing * i;
        if (newX >= bounds.minX - 10) {
          allColumns.unshift(newX);
        }
      }

      // Añadir columnas a la derecha
      for (let i = 1; i <= 5; i++) {
        const newX = columns[columns.length - 1] + columnSpacing * i;
        if (newX <= bounds.maxX + 10) {
          allColumns.push(newX);
        }
      }
    }

    // Generar puntos en todas las intersecciones
    allRows.forEach((y) => {
      allColumns.forEach((x) => {
        // Verificar si el punto está dentro de la parcela
        if (isPointInFence(x, y)) {
          const occupied = isPositionOccupied(x, y);

          points.push([x, y, bounds.avgZ + 0.5]); // Elevado para que se vea sobre el terreno
          pointSize.push(occupied ? 8.0 : 10.0); // Ocupados un poco más pequeños

          if (occupied) {
            pointColors.push(1, 0, 0); // ROJO para ocupados
          } else {
            pointColors.push(0, 1, 0); // VERDE para disponibles
          }
        }
      });
    });

    return { points, pointSize, pointColors };
  }, [
    rows,
    columns,
    bounds,
    panelDimensions,
    isPositionOccupied,
    isPointInFence,
  ]);

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
