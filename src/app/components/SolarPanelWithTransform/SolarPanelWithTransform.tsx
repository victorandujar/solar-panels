"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { Line } from "@react-three/drei";
import { useThree, ThreeEvent } from "@react-three/fiber";
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
  modifyLayout?: boolean;
  onClick?: (panelData: any, event?: any) => void;
  onPositionChange?: (
    panelId: string,
    newPosition: [number, number, number],
  ) => void;
}

interface NearbyPanel {
  position: [number, number, number];
  isAlignedX: boolean;
  isAlignedY: boolean;
}

interface SlotMarker {
  position: [number, number, number];
  occupied: boolean;
}

interface PanelPosition {
  x: number;
  y: number;
  z: number;
}

// ============ CONFIGURACIÓN DE GAP FIJO ============
// Gap entre paneles (espacio vacío entre bordes de paneles)
const PANEL_GAP_X = 0.0; // Gap horizontal en metros (0 = sin espacio)
const PANEL_GAP_Y = 0.0; // Gap vertical en metros (0 = sin espacio)
// ===================================================

/**
 * SolarPanelWithTransform
 *
 * Componente simplificado con GAP FIJO entre paneles.
 *
 * El espaciado entre paneles se calcula como:
 * - Horizontal (X): posición_vecino + longitud_panel + PANEL_GAP_X
 * - Vertical (Y): posición_vecino + ancho_panel + PANEL_GAP_Y
 *
 * Esto garantiza un espaciado uniforme y consistente en toda la cuadrícula.
 */
const SolarPanelWithTransform: React.FC<SolarPanelWithTransformProps> = ({
  position,
  rotation,
  groupId,
  panelId,
  dimensions,
  color,
  isSelected,
  isActive,
  modifyLayout = false,
  onClick,
  onPositionChange,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { scene, camera, gl, raycaster } = useThree();
  const translationSnap = useTranslationSnap();
  const groups = useSolarPanelStore((state) => state.groups);

  // Estado para las líneas guía y el sistema de drag
  const [nearbyPanels, setNearbyPanels] = useState<NearbyPanel[]>([]);
  const [isDraggingNow, setIsDraggingNow] = useState(false);
  const [currentDragPos, setCurrentDragPos] =
    useState<[number, number, number]>(position);
  const [slotMarkers, setSlotMarkers] = useState<SlotMarker[]>([]);

  // Referencia para tracking del estado de drag
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPos: new THREE.Vector3(),
    dragPlane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
  });

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

  /**
   * Calcula el espaciado REAL analizando la cuadrícula existente
   * NO usa dimensions porque pueden estar escaladas visualmente
   */
  const calculateRealGridSpacing = useCallback((): {
    stepX: number;
    stepY: number;
  } => {
    // Obtener todas las posiciones de paneles (excepto el actual)
    const positions: PanelPosition[] = [];
    groups.forEach((group) => {
      group.panels.forEach((panel) => {
        if (panel.id !== panelId) {
          positions.push({
            x: panel.position.X,
            y: panel.position.Y,
            z: panel.position.Z,
          });
        }
      });
    });

    if (positions.length < 2) {
      // Fallback: usar dimensiones + gap
      return {
        stepX: dimensions.length + PANEL_GAP_X,
        stepY: dimensions.width + PANEL_GAP_Y,
      };
    }

    // Agrupar por filas (mismo Y) y calcular diferencias en X
    const rows = new Map<number, number[]>();
    positions.forEach((p) => {
      const rowKey = Math.round(p.y * 100) / 100; // agrupar a 1cm
      if (!rows.has(rowKey)) rows.set(rowKey, []);
      rows.get(rowKey)!.push(p.x);
    });

    // Calcular diferencias consecutivas en cada fila
    const dxValues: number[] = [];
    rows.forEach((xPositions, rowY) => {
      const sorted = [...xPositions].sort((a, b) => a - b);

      for (let i = 1; i < sorted.length; i++) {
        const diff = sorted[i] - sorted[i - 1];
        if (diff > 0.01) {
          dxValues.push(diff);
        }
      }
    });

    // Agrupar por columnas (mismo X) y calcular diferencias en Y
    const cols = new Map<number, number[]>();
    positions.forEach((p) => {
      const colKey = Math.round(p.x * 100) / 100;
      if (!cols.has(colKey)) cols.set(colKey, []);
      cols.get(colKey)!.push(p.y);
    });

    const dyValues: number[] = [];
    cols.forEach((yPositions) => {
      const sorted = [...yPositions].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        const diff = sorted[i] - sorted[i - 1];
        if (diff > 0.01) dyValues.push(diff);
      }
    });

    // Usar la diferencia más común (moda)
    const getMode = (values: number[]): number => {
      if (values.length === 0) return 0;

      const rounded = values.map((v) => Math.round(v * 1000) / 1000);
      const counts = new Map<number, number>();

      rounded.forEach((v) => {
        counts.set(v, (counts.get(v) || 0) + 1);
      });

      let maxCount = 0;
      let mode = 0;

      counts.forEach((count, value) => {
        if (count > maxCount) {
          maxCount = count;
          mode = value;
        }
      });

      return mode || rounded[0];
    };

    const stepX =
      dxValues.length > 0 ? getMode(dxValues) : dimensions.length + PANEL_GAP_X;
    const stepY =
      dyValues.length > 0 ? getMode(dyValues) : dimensions.width + PANEL_GAP_Y;

    return { stepX, stepY };
  }, [groups, panelId, dimensions]);

  /**
   * Sistema de snap que usa el espaciado REAL de la cuadrícula
   */
  const findMagneticSnapPoint = useCallback(
    (
      x: number,
      y: number,
      z: number,
    ): {
      position: [number, number, number];
      nearby: NearbyPanel[];
      dx: number;
      dy: number;
      neighborX?: number;
      neighborY?: number;
    } => {
      const { stepX, stepY } = calculateRealGridSpacing();

      const SNAP_DISTANCE = Math.max(dimensions.length, dimensions.width) * 4;
      const ALIGN_TOLERANCE = 0.01;
      const ROW_TOLERANCE = dimensions.width * 0.4;
      const COL_TOLERANCE = dimensions.length * 0.4;

      // Obtener todas las posiciones de paneles (excepto el actual)
      const panelPositions: PanelPosition[] = [];
      groups.forEach((group) => {
        group.panels.forEach((panel) => {
          if (panel.id !== panelId) {
            panelPositions.push({
              x: panel.position.X,
              y: panel.position.Y,
              z: panel.position.Z,
            });
          }
        });
      });

      // Si no hay otros paneles, devolver la posición actual
      if (panelPositions.length === 0) {
        return {
          position: [x, y, z],
          nearby: [],
          dx: stepX,
          dy: stepY,
        };
      }

      // Buscar paneles cercanos
      const nearbyPanels = panelPositions.filter((pos) => {
        const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        return dist < SNAP_DISTANCE;
      });

      if (nearbyPanels.length === 0) {
        return {
          position: [x, y, z],
          nearby: [],
          dx: stepX,
          dy: stepY,
        };
      }

      // Encontrar el panel más cercano
      const closestPanel = nearbyPanels.reduce((closest, panel) => {
        const distCurrent = Math.sqrt((x - panel.x) ** 2 + (y - panel.y) ** 2);
        const distClosest = Math.sqrt(
          (x - closest.x) ** 2 + (y - closest.y) ** 2,
        );
        return distCurrent < distClosest ? panel : closest;
      });

      let snappedX = x;
      let snappedY = y;

      // Si estamos cerca de una fila, alinear a esa fila
      if (Math.abs(y - closestPanel.y) < ROW_TOLERANCE) {
        snappedY = closestPanel.y;

        // Obtener TODOS los paneles en esta fila, ordenados por X
        const rowPanels = panelPositions
          .filter((p) => Math.abs(p.y - snappedY) < ALIGN_TOLERANCE)
          .sort((a, b) => a.x - b.x);

        if (rowPanels.length === 0) {
          snappedX = x;
        } else {
          // Determinar dirección
          const goingRight = x > closestPanel.x;

          if (goingRight) {
            // A la derecha: usar el último panel de la fila
            const lastPanel = rowPanels[rowPanels.length - 1];

            if (x > lastPanel.x) {
              // Más a la derecha que todos: colocar después del último
              snappedX = lastPanel.x + stepX;
            } else {
              // Buscar huecos
              let foundSlot = false;
              for (let i = 0; i < rowPanels.length - 1; i++) {
                const actualGap = rowPanels[i + 1].x - rowPanels[i].x;

                if (actualGap > stepX * 1.5) {
                  const slotX = rowPanels[i].x + stepX;
                  if (x >= rowPanels[i].x && x <= rowPanels[i + 1].x) {
                    snappedX = slotX;
                    foundSlot = true;
                    break;
                  }
                }
              }
              if (!foundSlot) {
                snappedX = lastPanel.x + stepX;
              }
            }
          } else {
            // A la izquierda: usar el primer panel de la fila
            const firstPanel = rowPanels[0];

            if (x < firstPanel.x) {
              // Más a la izquierda que todos: colocar antes del primero
              snappedX = firstPanel.x - stepX;
            } else {
              // Buscar huecos
              let foundSlot = false;
              for (let i = rowPanels.length - 1; i > 0; i--) {
                const actualGap = rowPanels[i].x - rowPanels[i - 1].x;

                if (actualGap > stepX * 1.5) {
                  const slotX = rowPanels[i].x - stepX;
                  if (x <= rowPanels[i].x && x >= rowPanels[i - 1].x) {
                    snappedX = slotX;
                    foundSlot = true;
                    break;
                  }
                }
              }
              if (!foundSlot) {
                snappedX = firstPanel.x - stepX;
              }
            }
          }
        }
      }
      // Si estamos cerca de una columna, alinear a esa columna
      else if (Math.abs(x - closestPanel.x) < COL_TOLERANCE) {
        snappedX = closestPanel.x;

        // Obtener TODOS los paneles en esta columna, ordenados por Y
        const colPanels = panelPositions
          .filter((p) => Math.abs(p.x - snappedX) < ALIGN_TOLERANCE)
          .sort((a, b) => a.y - b.y);

        if (colPanels.length === 0) {
          snappedY = y;
        } else {
          const goingUp = y > closestPanel.y;

          if (goingUp) {
            // Arriba: usar el último panel de la columna
            const lastPanel = colPanels[colPanels.length - 1];

            if (y > lastPanel.y) {
              snappedY = lastPanel.y + stepY;
            } else {
              let foundSlot = false;
              for (let i = 0; i < colPanels.length - 1; i++) {
                const actualGap = colPanels[i + 1].y - colPanels[i].y;

                if (actualGap > stepY * 1.5) {
                  const slotY = colPanels[i].y + stepY;
                  if (y >= colPanels[i].y && y <= colPanels[i + 1].y) {
                    snappedY = slotY;
                    foundSlot = true;
                    break;
                  }
                }
              }
              if (!foundSlot) {
                snappedY = lastPanel.y + stepY;
              }
            }
          } else {
            // Abajo: usar el primer panel de la columna
            const firstPanel = colPanels[0];

            if (y < firstPanel.y) {
              snappedY = firstPanel.y - stepY;
            } else {
              let foundSlot = false;
              for (let i = colPanels.length - 1; i > 0; i--) {
                const actualGap = colPanels[i].y - colPanels[i - 1].y;

                if (actualGap > stepY * 1.5) {
                  const slotY = colPanels[i].y - stepY;
                  if (y <= colPanels[i].y && y >= colPanels[i - 1].y) {
                    snappedY = slotY;
                    foundSlot = true;
                    break;
                  }
                }
              }
              if (!foundSlot) {
                snappedY = firstPanel.y - stepY;
              }
            }
          }
        }
      }

      // Preparar información de paneles cercanos para las guías visuales
      const nearbyInfo: NearbyPanel[] = [closestPanel].map((pos) => ({
        position: [pos.x, pos.y, pos.z],
        isAlignedX: Math.abs(snappedX - pos.x) < ALIGN_TOLERANCE,
        isAlignedY: Math.abs(snappedY - pos.y) < ALIGN_TOLERANCE,
      }));

      return {
        position: [snappedX, snappedY, z],
        nearby: nearbyInfo,
        dx: stepX,
        dy: stepY,
        neighborX: closestPanel.x,
        neighborY: closestPanel.y,
      };
    },
    [groups, panelId, dimensions, calculateRealGridSpacing],
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

  // Setup del sistema de drag y controls mejorado
  useEffect(() => {
    if (!meshRef.current || !modifyLayout) {
      return;
    }

    const orbitControls = (gl.domElement as any).__orbitControls;
    const domElement = gl.domElement;
    const dragState = dragStateRef.current; // Copiar ref al inicio del effect

    // Raycaster para detectar intersecciones
    const raycasterLocal = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // ============ MANEJADORES DE EVENTOS =============

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return; // Solo botón izquierdo

      // Calcular posición del ratón normalizada
      const rect = domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycasting para ver si clickeamos en la placa
      raycasterLocal.setFromCamera(mouse, camera);
      const intersects = raycasterLocal.intersectObject(meshRef.current!);

      if (intersects.length > 0) {
        dragStateRef.current.isDragging = true;
        dragStateRef.current.startX = event.clientX;
        dragStateRef.current.startY = event.clientY;
        dragStateRef.current.startPos.copy(meshRef.current!.position);

        // Activar estado de drag para mostrar las líneas guía
        setIsDraggingNow(true);
        setCurrentDragPos([
          meshRef.current!.position.x,
          meshRef.current!.position.y,
          meshRef.current!.position.z,
        ]);

        // Marcar que estamos en drag
        (domElement as any).__isDragging = true;

        // Deshabilitar OrbitControls durante el drag
        if (orbitControls) {
          orbitControls.enabled = false;
        }

        event.preventDefault();
        event.stopPropagation();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStateRef.current.isDragging || !meshRef.current) return;

      // Sistema de raycasting al plano del terreno
      const rect = domElement.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterLocal.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      // Plano horizontal en la Z original del panel (mantener altura)
      const originalZ = dragStateRef.current.startPos.z;
      const groundPlane = new THREE.Plane(
        new THREE.Vector3(0, 0, 1),
        -originalZ,
      );
      const intersectPoint = new THREE.Vector3();

      raycasterLocal.ray.intersectPlane(groundPlane, intersectPoint);

      if (intersectPoint && meshRef.current) {
        // Calcular candidato de snap
        const snapResult = findMagneticSnapPoint(
          intersectPoint.x,
          intersectPoint.y,
          originalZ,
        );

        // Activación tardía del snap: solo aplicar si estamos cerca
        const distX = Math.abs(intersectPoint.x - snapResult.position[0]);
        const distY = Math.abs(intersectPoint.y - snapResult.position[1]);
        const activateThresholdX = Math.max(0.15, snapResult.dx * 0.25);
        const activateThresholdY = Math.max(0.15, snapResult.dy * 0.25);

        const shouldSnapX = distX <= activateThresholdX;
        const shouldSnapY = distY <= activateThresholdY;

        const targetX = shouldSnapX ? snapResult.position[0] : intersectPoint.x;
        const targetY = shouldSnapY ? snapResult.position[1] : intersectPoint.y;

        // Movimiento suave hacia el objetivo (da sensación de control + imán al final)
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const current = meshRef.current.position;
        const smoothFactor = 0.35; // cuanto mayor, más magnético
        current.x = lerp(current.x, targetX, smoothFactor);
        current.y = lerp(current.y, targetY, smoothFactor);
        current.z = originalZ;

        // Guías visibles incluso si aún no se activó el snap
        setCurrentDragPos([current.x, current.y, current.z]);
        setNearbyPanels(snapResult.nearby);

        // Generar marcadores de slots libres alrededor del vecino seleccionado
        const markers: SlotMarker[] = [];
        if (
          typeof snapResult.neighborX === "number" &&
          typeof snapResult.neighborY === "number"
        ) {
          const baseX = snapResult.neighborX;
          const baseY = snapResult.neighborY;
          const occupySet = new Set(
            Array.from((groups || []) as any)
              .flatMap((g: any) => g.panels)
              .map(
                (p: any) =>
                  `${Math.round(p.position.X * 1000)},${Math.round(p.position.Y * 1000)}`,
              ),
          );

          for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            const px = baseX + i * snapResult.dx;
            const py = baseY;
            const key = `${Math.round(px * 1000)},${Math.round(py * 1000)}`;
            const occupied = occupySet.has(key);
            markers.push({ position: [px, py, originalZ + 0.6], occupied });
          }
        }
        setSlotMarkers(markers);
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button !== 0 || !dragStateRef.current.isDragging) return;

      dragStateRef.current.isDragging = false;

      // Snap preciso al soltar: calcular hueco exacto más cercano
      if (meshRef.current) {
        const originalZ = dragStateRef.current.startPos.z;

        const snapResult = findMagneticSnapPoint(
          meshRef.current.position.x,
          meshRef.current.position.y,
          originalZ,
        );

        meshRef.current.position.set(
          snapResult.position[0],
          snapResult.position[1],
          snapResult.position[2],
        );

        setCurrentDragPos(snapResult.position);
        setNearbyPanels(snapResult.nearby);

        // Guardar posición final exacta en el store
        if (onPositionChange) {
          onPositionChange(panelId, snapResult.position);
        }
      }

      // Remover el flag de drag
      (domElement as any).__isDragging = false;

      // Limpiar guías tras un pequeño retraso para que se aprecie el snap final
      setTimeout(() => {
        setIsDraggingNow(false);
        setNearbyPanels([]);
      }, 30);

      // Rehabilitar OrbitControls
      if (orbitControls) {
        orbitControls.enabled = true;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    // ============ LISTENERS =============
    domElement.addEventListener("mousedown", handleMouseDown);
    domElement.addEventListener("mousemove", handleMouseMove);
    domElement.addEventListener("mouseup", handleMouseUp);

    // ============ CLEANUP =============
    return () => {
      domElement.removeEventListener("mousedown", handleMouseDown);
      domElement.removeEventListener("mousemove", handleMouseMove);
      domElement.removeEventListener("mouseup", handleMouseUp);

      // Asegurar que los controles estén rehabilitados
      if (orbitControls) {
        orbitControls.enabled = true;
      }
      dragState.isDragging = false;
      setIsDraggingNow(false);
      setNearbyPanels([]);
    };
  }, [
    modifyLayout,
    camera,
    gl,
    groups,
    panelId,
    onPositionChange,
    findMagneticSnapPoint,
  ]);

  return (
    <>
      {/* Renderizar las líneas guía cuando estamos en drag */}
      {isDraggingNow && nearbyPanels.length > 0 && (
        <>
          {/* Marcadores de slots libres/ocupados en la fila del vecino */}
          {slotMarkers.map((m, i) => (
            <mesh key={`slot-${i}`} position={m.position}>
              <boxGeometry args={[0.3, 0.3, 0.02]} />
              <meshBasicMaterial
                color={m.occupied ? 0xff4444 : 0x44ff44}
                transparent
                opacity={0.9}
                depthTest={false}
              />
            </mesh>
          ))}

          {nearbyPanels.map((p, idx) => {
            const z = (currentDragPos?.[2] ?? position[2]) + 0.5;
            const xPoints: [number, number, number][] = [
              [p.position[0], p.position[1], z],
              [currentDragPos[0], p.position[1], z],
            ];
            const yPoints: [number, number, number][] = [
              [p.position[0], p.position[1], z],
              [p.position[0], currentDragPos[1], z],
            ];

            return (
              <group key={`guides-${idx}`}>
                <Line
                  points={xPoints}
                  color={p.isAlignedX ? "#00ff00" : "#ff0000"}
                  lineWidth={3}
                  transparent
                  opacity={0.95}
                  depthTest={false}
                />
                <Line
                  points={yPoints}
                  color={p.isAlignedY ? "#00ff00" : "#ff0000"}
                  lineWidth={3}
                  transparent
                  opacity={0.95}
                  depthTest={false}
                />
              </group>
            );
          })}
        </>
      )}

      {/* Panel solar con dimensiones reales (sin padding artificial) */}
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
    </>
  );
};

export default SolarPanelWithTransform;
