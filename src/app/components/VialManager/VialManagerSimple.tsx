"use client";

import React, { useState, useCallback } from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useSolarPanelStore } from "../../../store/useStore";

interface VialManagerProps {
  isCreatingVial: boolean;
  onVialCreated?: (vialId: string) => void;
  onVialDeleted?: (vialId: string) => void;
  isTrenchMode?: boolean;
  trenchParams?: {
    depth: number;
    width: number;
    length: number;
    direction: number;
  };
  onPanelVialClick?: (clickHandler: (point: THREE.Vector3) => void) => void;
  showNotification?: (
    title: string,
    message: string,
    variant?: "success" | "warning" | "info",
  ) => void;
  showConfirm?: (
    title: string,
    message: string,
    variant?: "default" | "danger" | "warning" | "success",
  ) => Promise<boolean>;
}

const VialManager: React.FC<VialManagerProps> = ({
  isCreatingVial,
  onVialCreated,
  isTrenchMode = false,
  trenchParams = { depth: 1.5, width: 2.0, length: 10.0, direction: 0 },
  onPanelVialClick,
  showNotification,
  showConfirm,
}) => {
  const [firstPoint, setFirstPoint] = useState<THREE.Vector3 | null>(null);
  const [secondPoint, setSecondPoint] = useState<THREE.Vector3 | null>(null);
  const [mousePosition, setMousePosition] = useState<THREE.Vector3 | null>(
    null,
  );
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);

  const permanentlyDeletePanelsInArea = useSolarPanelStore(
    (state) => state.permanentlyDeletePanelsInArea,
  );

  const handleVialClick = useCallback(
    (point: THREE.Vector3) => {
      if (!point) {
        return;
      }

      if (!isCreatingVial && !isTrenchMode) {
        return;
      }

      if (!firstPoint) {
        setFirstPoint(point.clone());
      } else if (!secondPoint && !isAwaitingConfirmation) {
        const fixedSecondPoint = point.clone();
        setSecondPoint(fixedSecondPoint);
        setMousePosition(null); // Detener el preview del mouse
        setIsAwaitingConfirmation(true);

        const start = {
          X: firstPoint.x,
          Y: firstPoint.y,
          Z: firstPoint.z,
        };

        const end = {
          X: fixedSecondPoint.x,
          Y: fixedSecondPoint.y,
          Z: fixedSecondPoint.z,
        };

        if (isTrenchMode) {
          if (showNotification) {
            showNotification(
              "Funcionalidad en desarrollo",
              "La funcionalidad de zanjas está en desarrollo y estará disponible próximamente.",
              "info",
            );
          }
          setFirstPoint(null);
          setSecondPoint(null);
          setMousePosition(null);
          setIsAwaitingConfirmation(false);
        } else {
          const confirmDelete = async () => {
            if (showConfirm) {
              const confirmed = await showConfirm(
                "Confirmar eliminación de paneles",
                "¿Estás seguro de que quieres eliminar todos los paneles solares en el área seleccionada? Esta acción no se puede deshacer.",
                "danger",
              );

              if (!confirmed) {
                setFirstPoint(null);
                setSecondPoint(null);
                setMousePosition(null);
                setIsAwaitingConfirmation(false);
                return;
              }
            }

            const vialWidth = 6.0;
            const deletedPanels = permanentlyDeletePanelsInArea(
              start,
              end,
              vialWidth,
            );

            if (deletedPanels.length > 0) {
              if (showNotification) {
                showNotification(
                  "Vial creado exitosamente",
                  `Se han eliminado ${deletedPanels.length} paneles solares del área seleccionada.`,
                  "success",
                );
              }
            } else {
              if (showNotification) {
                showNotification(
                  "Vial creado",
                  "No había paneles solares en el área seleccionada.",
                  "info",
                );
              }
            }

            setFirstPoint(null);
            setSecondPoint(null);
            setMousePosition(null);
            setIsAwaitingConfirmation(false);

            if (onVialCreated) {
              onVialCreated("vial-" + Date.now());
            }
          };

          confirmDelete();
        }
      } else if (isAwaitingConfirmation) {
        return;
      }
    },
    [
      isCreatingVial,
      isTrenchMode,
      firstPoint,
      secondPoint,
      isAwaitingConfirmation,
      permanentlyDeletePanelsInArea,
      onVialCreated,
      showNotification,
      showConfirm,
    ],
  );

  const handleMouseMove = (event: ThreeEvent<PointerEvent>) => {
    if (
      isCreatingVial &&
      firstPoint &&
      !isAwaitingConfirmation &&
      !secondPoint
    ) {
      setMousePosition(
        new THREE.Vector3(event.point.x, event.point.y, event.point.z),
      );
    }
  };

  const handleTerrainClick = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const point = event.point as THREE.Vector3;
      handleVialClick(point);
    },
    [handleVialClick],
  );

  React.useEffect(() => {
    if (onPanelVialClick) {
      onPanelVialClick(handleVialClick);
    }
  }, [handleVialClick, onPanelVialClick]);

  React.useEffect(() => {
    if (!isCreatingVial && !isTrenchMode) {
      setFirstPoint(null);
      setSecondPoint(null);
      setMousePosition(null);
      setIsAwaitingConfirmation(false);
    }
  }, [isCreatingVial, isTrenchMode]);

  return (
    <>
      {(isCreatingVial || isTrenchMode) && (
        <mesh position={[0, 0, 5]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color="#ff00ff" />
        </mesh>
      )}

      {firstPoint && (
        <mesh
          position={[firstPoint.x, firstPoint.y + 0.5, firstPoint.z]}
          renderOrder={1000}
        >
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
        </mesh>
      )}

      {secondPoint && (
        <mesh
          position={[secondPoint.x, secondPoint.y + 0.5, secondPoint.z]}
          renderOrder={1000}
        >
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
        </mesh>
      )}

      {firstPoint && mousePosition && !secondPoint && (
        <Line
          points={[
            [firstPoint.x, firstPoint.y + 1.0, firstPoint.z],
            [mousePosition.x, mousePosition.y + 1.0, mousePosition.z],
          ]}
          color="#ffffff"
          lineWidth={5}
          renderOrder={1000}
        />
      )}

      {firstPoint && secondPoint && (
        <Line
          points={[
            [firstPoint.x, firstPoint.y + 1.0, firstPoint.z],
            [secondPoint.x, secondPoint.y + 1.0, secondPoint.z],
          ]}
          color="#ffffff"
          lineWidth={5}
          renderOrder={1000}
        />
      )}

      {(isCreatingVial || isTrenchMode) && (
        <mesh
          onClick={handleTerrainClick}
          onPointerMove={handleMouseMove}
          visible={false}
          position={[0, 0, 0.1]}
        >
          <planeGeometry args={[2000, 2000]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </>
  );
};

export default VialManager;
