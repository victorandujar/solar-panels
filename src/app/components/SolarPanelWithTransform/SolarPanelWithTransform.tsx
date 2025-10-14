"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useThree, ThreeEvent } from "@react-three/fiber";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import * as THREE from "three";
import { useTranslationSnap, useSolarPanelStore } from "@/store/useStore";

interface SolarPanelWithTransformProps {
  position: [number, number, number];
  rotation: [number, number, number];
  groupId: string;
  panelId: string;
  dimensions: { length: number; width: number };
  color: number;
  isSelected: boolean;
  isActive: boolean;
  onClick?: (panelData: any, event?: any) => void;
  onPositionChange?: (
    panelId: string,
    newPosition: [number, number, number],
  ) => void;
}

const SolarPanelWithTransform: React.FC<SolarPanelWithTransformProps> = ({
  position,
  rotation,
  groupId,
  panelId,
  dimensions,
  color,
  isSelected,
  isActive,
  onClick,
  onPositionChange,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const { scene, camera, gl } = useThree();
  const translationSnap = useTranslationSnap();
  const groups = useSolarPanelStore((state) => state.groups);

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (!onClick) return;
      event.stopPropagation();
      const panelData = {
        id: panelId,
        groupId,
        panelId,
        position: { x: position[0], y: position[1], z: position[2] },
        dimensions,
      };
      onClick(panelData, event);
    },
    [groupId, panelId, position, dimensions, onClick],
  );

  // Función para encontrar el punto de snap más cercano (MEJORADO - snap magnético agresivo)
  const findMagneticSnapPoint = useCallback(
    (x: number, y: number, z: number): [number, number, number] => {
      // Radio de atracción MUY GRANDE - snap agresivo
      const magneticThreshold = dimensions.length * 10;

      // Recopilar todas las posiciones de paneles existentes
      const panelPositions: Array<{ x: number; y: number }> = [];
      groups.forEach((group) => {
        group.panels.forEach((panel) => {
          if (panel.id !== panelId) {
            panelPositions.push({ x: panel.position.X, y: panel.position.Y });
          }
        });
      });

      if (panelPositions.length === 0) {
        // Si no hay paneles, redondear a la cuadrícula de snap
        return [
          Math.round(x / translationSnap) * translationSnap,
          Math.round(y / translationSnap) * translationSnap,
          z,
        ];
      }

      // Detectar filas (alineación en Y) - TOLERANCIA MUY PEQUEÑA para filas perfectas
      const rowMap = new Map<number, number[]>();
      const rowTolerance = 0.001; // Tolerancia microscópica (1mm) - filas PERFECTAS

      panelPositions.forEach((pos) => {
        let foundRow = false;
        rowMap.forEach((xs, rowY) => {
          if (Math.abs(pos.y - rowY) < rowTolerance) {
            xs.push(pos.x);
            foundRow = true;
          }
        });
        if (!foundRow) {
          rowMap.set(pos.y, [pos.x]);
        }
      });

      // === PASO 1: SNAP AGRESIVO A FILA MÁS CERCANA ===
      let closestRowY: number | null = null;
      let closestRowDistance = Infinity;

      rowMap.forEach((_, rowY) => {
        const distance = Math.abs(y - rowY);
        if (distance < closestRowDistance) {
          closestRowDistance = distance;
          closestRowY = rowY;
        }
      });

      // Si hay una fila dentro del radio magnético, SNAP AUTOMÁTICO
      let finalY = y;
      if (closestRowY !== null && closestRowDistance < magneticThreshold) {
        finalY = closestRowY; // Alineación PERFECTA automática
      } else {
        // Si no hay fila cercana, redondear al snap
        finalY = Math.round(y / translationSnap) * translationSnap;
      }

      // === PASO 2: SNAP AGRESIVO A COLUMNA MÁS CERCANA EN LA FILA ===
      let finalX = x;
      if (closestRowY !== null && rowMap.has(closestRowY)) {
        const columnXs = rowMap.get(closestRowY)!.sort((a, b) => a - b);

        // Calcular el espaciado EXACTO promedio entre columnas
        let avgSpacing = dimensions.length;
        if (columnXs.length > 1) {
          const spacings = [];
          for (let i = 1; i < columnXs.length; i++) {
            spacings.push(columnXs[i] - columnXs[i - 1]);
          }
          avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
        }

        // Generar TODAS las posiciones posibles de snap en esta fila
        const allSnapPositions: number[] = [];

        // 1. Columnas existentes
        allSnapPositions.push(...columnXs);

        // 2. Espacios entre columnas
        for (let i = 0; i < columnXs.length - 1; i++) {
          const x1 = columnXs[i];
          const x2 = columnXs[i + 1];
          const spacing = x2 - x1;
          const numSlots = Math.round(spacing / avgSpacing);

          for (let j = 1; j < numSlots; j++) {
            const snapX = x1 + avgSpacing * j;
            if (snapX > x1 + 0.1 && snapX < x2 - 0.1) {
              allSnapPositions.push(snapX);
            }
          }
        }

        // 3. Extensiones a izquierda (hasta 20 posiciones)
        if (columnXs.length > 0) {
          for (let i = 1; i <= 20; i++) {
            allSnapPositions.push(columnXs[0] - avgSpacing * i);
          }

          // 4. Extensiones a derecha (hasta 20 posiciones)
          for (let i = 1; i <= 20; i++) {
            allSnapPositions.push(
              columnXs[columnXs.length - 1] + avgSpacing * i,
            );
          }
        }

        // Encontrar la posición de snap MÁS CERCANA
        let closestSnapX = allSnapPositions[0];
        let minDistance = Math.abs(x - closestSnapX);

        allSnapPositions.forEach((snapX) => {
          const distance = Math.abs(x - snapX);
          if (distance < minDistance) {
            minDistance = distance;
            closestSnapX = snapX;
          }
        });

        // SNAP AUTOMÁTICO si está dentro del radio magnético
        if (minDistance < magneticThreshold) {
          finalX = closestSnapX;
        } else {
          finalX = Math.round(x / translationSnap) * translationSnap;
        }
      } else {
        // Si no hay fila cercana, redondear al snap
        finalX = Math.round(x / translationSnap) * translationSnap;
      }

      // Redondear a 8 decimales para máxima precisión
      return [
        Math.round(finalX * 100000000) / 100000000,
        Math.round(finalY * 100000000) / 100000000,
        z,
      ];
    },
    [translationSnap, groups, panelId, dimensions],
  );

  // Material properties
  const materialProps = React.useMemo(() => {
    let emissiveIntensity = 0.25;
    let opacity = 1;
    let transparent = false;
    let finalColor = new THREE.Color(color);

    if (!isActive) {
      finalColor = new THREE.Color(0xcccccc);
      emissiveIntensity = 0.1;
      opacity = 0.6;
      transparent = true;
    } else if (isSelected) {
      emissiveIntensity = 2.0;
      opacity = 1;
      transparent = true;
      finalColor = new THREE.Color(0x00ff00);
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
  }, [color, isSelected, isActive]);

  // Setup TransformControls
  useEffect(() => {
    if (!meshRef.current || !isSelected) return;

    // Create TransformControls
    const controls = new TransformControls(camera, gl.domElement);
    transformControlsRef.current = controls;

    // Configure TransformControls
    controls.setMode("translate"); // Solo modo traducción
    controls.showX = true; // Mostrar eje X
    controls.showY = true; // Mostrar eje Y
    controls.showZ = false; // NO mostrar eje Z (no queremos movimiento en Z)
    controls.setSpace("world"); // Espacio mundial
    controls.setTranslationSnap(null); // NO aplicar snap durante el arrastre (movimiento fluido)

    // Attach to mesh
    controls.attach(meshRef.current);
    scene.add(controls as any);

    // Event handlers
    const handleDraggingChanged = (event: any) => {
      // Deshabilitar los controles de órbita cuando se está arrastrando
      const orbitControls = (gl.domElement as any).__orbitControls;
      if (orbitControls) {
        orbitControls.enabled = !event.value;
      }

      // Cuando se SUELTA la placa (event.value = false), aplicar snap magnético
      if (!event.value && meshRef.current && onPositionChange) {
        const currentPos = meshRef.current.position;

        // Aplicar snap magnético SOLO al soltar
        const snappedPos = findMagneticSnapPoint(
          currentPos.x,
          currentPos.y,
          currentPos.z,
        );

        // Actualizar posición con snap magnético perfecto
        meshRef.current.position.set(
          snappedPos[0],
          snappedPos[1],
          snappedPos[2],
        );

        // Notificar el cambio de posición final
        onPositionChange(panelId, snappedPos);
      }
    };

    controls.addEventListener("dragging-changed", handleDraggingChanged);

    // Cleanup
    return () => {
      controls.removeEventListener("dragging-changed", handleDraggingChanged);
      controls.detach();
      scene.remove(controls as any);
      controls.dispose();
    };
  }, [
    isSelected,
    scene,
    camera,
    gl,
    panelId,
    onPositionChange,
    findMagneticSnapPoint,
  ]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      userData={{
        panelId,
        groupId,
        isDraggable: true,
      }}
    >
      <planeGeometry args={[dimensions.length, dimensions.width]} />
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
};

export default SolarPanelWithTransform;
