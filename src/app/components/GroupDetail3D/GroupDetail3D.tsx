"use client";

import React, { useMemo, useRef, useState, createElement } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  useSolarPanelStore,
  usePanelActive,
  type SolarPanelState,
} from "../../../store/useStore";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import NotificationDialog from "../NotificationDialog/NotificationDialog";
import { useDialog } from "../../hooks/useDialog";

interface PanelData {
  panelId: string;
  groupId: string;
  position: { x: number; y: number; z: number };
  inclination: number;
  dimensions: { length: number; width: number };
}

interface GroupDetail3DProps {
  groupData: {
    groupId: string;
    allPanelsInGroup: PanelData[];
  };
  selectedPanels: Set<string>;
  onPanelSelect: (panelIds: Set<string>) => void;
  onClose: () => void;
  onOpenManagement?: () => void;
}

interface GroupPanelProps {
  panelData: PanelData;
  index: number;
  isSelected: boolean;
  onPanelClick: (panelId: string) => void;
  localPosition: [number, number, number];
}

const GroupPanel: React.FC<GroupPanelProps> = ({
  panelData,
  index,
  isSelected,
  onPanelClick,
  localPosition,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const isActive = usePanelActive(panelData.panelId);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onPanelClick(panelData.panelId);
  };

  const numberTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = 256;
    canvas.height = 128;

    context.fillStyle = "rgba(255, 255, 255, 0.95)";
    context.fillRect(0, 0, 256, 128);
    context.strokeStyle = "rgba(0, 0, 0, 0.9)";
    context.lineWidth = 4;
    context.strokeRect(4, 4, 248, 120);

    context.shadowColor = "rgba(0, 0, 0, 0.7)";
    context.shadowBlur = 6;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    context.fillStyle = "rgba(0, 0, 0, 0.95)";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.fillText(`${index + 1}`, 128, 85);

    return new THREE.CanvasTexture(canvas);
  }, [index]);

  return (
    <>
      {createElement(
        "mesh" as any,
        {
          ref: meshRef,
          position: localPosition,
          rotation: [0, 0, 0],
          scale: [
            panelData.dimensions.length * 0.9,
            panelData.dimensions.width * 0.9,
            1,
          ],
          onClick: handleClick,
          userData: panelData,
        },
        createElement("planeGeometry" as any, { args: [1, 1] }),
        createElement("meshStandardMaterial" as any, {
          color: !isActive ? 0xcccccc : isSelected ? 0xffff00 : 0x4682b4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: !isActive ? 0.5 : isSelected ? 1 : 0.9,
        }),
      )}

      {createElement(
        "sprite" as any,
        {
          position: [localPosition[0], localPosition[1], 1],
          scale: [2, 1, 1],
        },
        createElement("spriteMaterial" as any, {
          map: numberTexture,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        }),
      )}
    </>
  );
};

interface GroupSceneProps {
  groupData: {
    groupId: string;
    allPanelsInGroup: PanelData[];
  };
  selectedPanels: Set<string>;
  onPanelSelect: (panelIds: Set<string>) => void;
}

const GroupScene: React.FC<GroupSceneProps> = ({
  groupData,
  selectedPanels,
  onPanelSelect,
}) => {
  const handlePanelClick = (panelId: string) => {
    const newSelectedPanels = new Set(selectedPanels);
    if (newSelectedPanels.has(panelId)) {
      newSelectedPanels.delete(panelId);
    } else {
      newSelectedPanels.add(panelId);
    }
    onPanelSelect(newSelectedPanels);
  };

  const { centerX, centerY, frustumSize } = useMemo(() => {
    if (
      !groupData.allPanelsInGroup ||
      groupData.allPanelsInGroup.length === 0
    ) {
      return { centerX: 0, centerY: 0, frustumSize: 10 };
    }

    const positions = groupData.allPanelsInGroup.map((p) => p.position);
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y));

    const centerX = (minX + maxX) / 2;
    const centerY = minY + (maxY - minY) * 0.2;
    const groupWidth = maxX - minX;
    const groupHeight = maxY - minY;

    const safeWidth = Math.max(groupWidth, 1);
    const safeHeight = Math.max(groupHeight, 1);
    const groupSize = Math.max(safeWidth, safeHeight);

    const frustumSize = Math.max(1, groupSize * 1.9);

    return { centerX, centerY, frustumSize };
  }, [groupData]);

  const aspectRatio = 600 / 400;
  const cameraZ = Math.max(25, frustumSize * 0.15);

  return (
    <>
      {createElement("ambientLight" as any, { intensity: 0.8 })}
      {createElement("directionalLight" as any, {
        position: [5, 10, 5],
        intensity: 1.0,
      })}
      {createElement("directionalLight" as any, {
        position: [-5, 5, -5],
        intensity: 0.5,
      })}

      <OrthographicCamera
        makeDefault
        left={(frustumSize * aspectRatio) / -2}
        right={(frustumSize * aspectRatio) / 2}
        top={frustumSize / 2}
        bottom={frustumSize / -2}
        near={0.1}
        far={1000}
        position={[0, 0, Math.max(40, cameraZ)]}
        onUpdate={(camera) => {
          camera.lookAt(0, 0, 0);
          camera.up.set(0, 1, 0);
        }}
      />

      {groupData.allPanelsInGroup.map((panelData, index) => {
        const localX = panelData.position.x - centerX;
        const localY = panelData.position.y - centerY;
        return (
          <GroupPanel
            key={panelData.panelId}
            panelData={panelData}
            index={index}
            localPosition={[localX, localY, 0]}
            isSelected={selectedPanels.has(panelData.panelId)}
            onPanelClick={handlePanelClick}
          />
        );
      })}
    </>
  );
};

const GroupDetail3D: React.FC<GroupDetail3DProps> = ({
  groupData,
  selectedPanels,
  onPanelSelect,
  onClose,
  onOpenManagement,
}) => {
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");

  const {
    confirmDialog,
    showConfirm,
    hideConfirm,
    notificationDialog,
    showNotification,
    hideNotification,
  } = useDialog();

  const disablePanels = useSolarPanelStore(
    (state: SolarPanelState) => state.disablePanels,
  );
  const enablePanels = useSolarPanelStore(
    (state: SolarPanelState) => state.enablePanels,
  );
  const disableGroup = useSolarPanelStore(
    (state: SolarPanelState) => state.disableGroup,
  );
  const enableGroup = useSolarPanelStore(
    (state: SolarPanelState) => state.enableGroup,
  );
  const panels = useSolarPanelStore((state: SolarPanelState) => state.panels);

  const handleRangeSelect = () => {
    if (!rangeStart || !rangeEnd) return;

    const startIndex = parseInt(rangeStart);
    const endIndex = parseInt(rangeEnd);

    if (isNaN(startIndex) || isNaN(endIndex)) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    const newSelectedPanels = new Set(selectedPanels);
    for (let i = minIndex; i <= maxIndex; i++) {
      const panelId = `${groupData.groupId}-${i}`;
      if (groupData.allPanelsInGroup.some((p) => p.panelId === panelId)) {
        newSelectedPanels.add(panelId);
      }
    }

    onPanelSelect(newSelectedPanels);
  };

  const clearSelection = () => {
    onPanelSelect(new Set());
    setRangeEnd("");
    setRangeStart("");
  };

  const handleDisableSelected = async () => {
    if (selectedPanels.size === 0) {
      showNotification({
        message: "Por favor, selecciona al menos un panel para deshabilitar",
        variant: "warning",
        title: "Paneles requeridos",
      });
      return;
    }

    const panelIds = Array.from(selectedPanels);

    const confirmed = await showConfirm({
      message: `¿Estás seguro que quieres deshabilitar ${panelIds.length} panel${panelIds.length > 1 ? "es" : ""} seleccionado${panelIds.length > 1 ? "s" : ""}?`,
      title: "Confirmar deshabilitación",
      variant: "warning",
      confirmText: "Deshabilitar",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      disablePanels(panelIds);
      clearSelection();

      showNotification({
        message: `${panelIds.length} panel${panelIds.length > 1 ? "es" : ""} deshabilitado${panelIds.length > 1 ? "s" : ""}`,
        variant: "success",
        title: "Paneles deshabilitados",
        autoClose: true,
      });
    }
  };

  const handleEnableSelected = async () => {
    if (selectedPanels.size === 0) {
      showNotification({
        message: "Por favor, selecciona al menos un panel para habilitar",
        variant: "warning",
        title: "Paneles requeridos",
      });
      return;
    }

    const panelIds = Array.from(selectedPanels);
    enablePanels(panelIds);
    clearSelection();

    showNotification({
      message: `${panelIds.length} panel${panelIds.length > 1 ? "es" : ""} habilitado${panelIds.length > 1 ? "s" : ""}`,
      variant: "success",
      title: "Paneles habilitados",
      autoClose: true,
    });
  };

  const handleDisableGroup = async () => {
    const confirmed = await showConfirm({
      message: `¿Estás seguro que quieres deshabilitar todo el grupo ${groupData.groupId}?`,
      title: "Confirmar deshabilitación del grupo",
      variant: "danger",
      confirmText: "Deshabilitar grupo",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      disableGroup(groupData.groupId);
      clearSelection();

      showNotification({
        message: `Grupo ${groupData.groupId} deshabilitado completamente`,
        variant: "success",
        title: "Grupo deshabilitado",
        autoClose: true,
      });
    }
  };

  const handleEnableGroup = async () => {
    const confirmed = await showConfirm({
      message: `¿Estás seguro que quieres habilitar todo el grupo ${groupData.groupId}?`,
      title: "Confirmar habilitación del grupo",
      variant: "success",
      confirmText: "Habilitar grupo",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      enableGroup(groupData.groupId);
      clearSelection();

      showNotification({
        message: `Grupo ${groupData.groupId} habilitado completamente`,
        variant: "success",
        title: "Grupo habilitado",
        autoClose: true,
      });
    }
  };

  const hasInactiveSelectedPanels = Array.from(selectedPanels).some(
    (panelId) => {
      const panel = panels.find((p) => p.id === panelId);
      return panel && !panel.active;
    },
  );

  const hasInactivePanelsInGroup = panels.some(
    (panel) => panel.groupId === groupData.groupId && !panel.active,
  );

  return (
    <div className="fixed top-0 right-0 w-1/2 h-full flex flex-col bg-white/10 backdrop-blur-lg shadow-2xl border-l border-gray-200 overflow-hidden z-50">
      <div className="bg-black text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Grupo {groupData.groupId}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-sm opacity-90">
          {groupData.allPanelsInGroup.length} paneles en este grupo
        </p>
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <Canvas
            style={{ width: "100%", height: "100%" }}
            camera={{ position: [0, 0, 30], near: 0.1, far: 1000 }}
          >
            <GroupScene
              groupData={groupData}
              selectedPanels={selectedPanels}
              onPanelSelect={onPanelSelect}
            />
          </Canvas>
        </div>

        <div
          className="absolute bottom-4 left-4 right-4 2xl:text-sm md:text-xs"
          style={{ zIndex: 10 }}
        >
          <div className="p-3 bg-gray-50/90 rounded-lg text-black backdrop-blur-sm">
            <h3 className="font-semibold mb-2 text-gray-800">
              Selección por Rango
            </h3>

            <div className="flex space-x-2 mb-2">
              <input
                type="number"
                placeholder="ID Inicio"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="ID Fin"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2 mb-2">
              <button
                onClick={handleRangeSelect}
                className="px-3 py-1 text-s bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Seleccionar Rango
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-s bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Limpiar Selección
              </button>
            </div>
            {onOpenManagement && (
              <div className="flex space-x-2 mb-2">
                <button
                  onClick={onOpenManagement}
                  className="px-3 py-1 text-s bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  title="Abrir gestor de grupos para reorganizar paneles"
                >
                  🔧 Gestionar Grupo
                </button>
              </div>
            )}
            <section className="flex space-x-2 mb-1">
              <button
                onClick={handleDisableSelected}
                disabled={selectedPanels.size === 0}
                className="px-3 py-1 text-s bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Deshabilitar Seleccionados
              </button>
              <button
                onClick={handleEnableSelected}
                disabled={
                  selectedPanels.size === 0 || !hasInactiveSelectedPanels
                }
                className="px-3 py-1 text-s bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Habilitar Seleccionados
              </button>

              <button
                onClick={handleDisableGroup}
                className="px-3 py-1 text-s bg-red-800 text-white rounded hover:bg-red-900 transition-colors"
              >
                Deshabilitar Grupo
              </button>
              <button
                onClick={handleEnableGroup}
                disabled={!hasInactivePanelsInGroup}
                className="px-3 py-1 text-s bg-green-800 text-white rounded hover:bg-green-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Habilitar Grupo
              </button>
            </section>

            <div className="text-s text-gray-700">
              <p>
                • Haz clic en las placas para seleccionarlas individualmente
              </p>
              <p>• Usa los inputs para seleccionar un rango de placas</p>
              <p>• Placas seleccionadas: {selectedPanels.size}</p>
              <p>
                • Paneles inactivos en el grupo:{" "}
                {
                  panels.filter(
                    (p) => p.groupId === groupData.groupId && !p.active,
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog {...confirmDialog} onClose={hideConfirm} />

      <NotificationDialog {...notificationDialog} onClose={hideNotification} />
    </div>
  );
};

export default GroupDetail3D;
