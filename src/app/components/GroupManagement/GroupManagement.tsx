"use client";

import React, { useState, useRef, useMemo, createElement } from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { useSolarPanelStore, usePanelActive } from "../../../store/useStore";
import { SolarPanelState } from "../../../store/types";
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

interface GroupManagementProps {
  groupData: {
    groupId: string;
    allPanelsInGroup: PanelData[];
  };
  selectedPanels: Set<string>;
  onPanelSelect: (panelIds: Set<string>) => void;
  onClose: () => void;
  onGroupChanged?: () => void;
}

interface ManagementPanelProps {
  panelData: PanelData;
  index: number;
  isSelected: boolean;
  onPanelClick: (panelId: string) => void;
  localPosition: [number, number, number];
}

const ManagementPanel: React.FC<ManagementPanelProps> = ({
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

    // Background color based on selection state
    context.fillStyle = isSelected
      ? "rgba(255, 255, 0, 0.95)"
      : "rgba(255, 255, 255, 0.95)";
    context.fillRect(0, 0, 256, 128);

    // Border
    context.strokeStyle = isSelected
      ? "rgba(255, 0, 0, 0.9)"
      : "rgba(0, 0, 0, 0.9)";
    context.lineWidth = isSelected ? 6 : 4;
    context.strokeRect(4, 4, 248, 120);

    context.shadowColor = "rgba(0, 0, 0, 0.7)";
    context.shadowBlur = 6;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    context.fillStyle = isSelected
      ? "rgba(255, 0, 0, 0.95)"
      : "rgba(0, 0, 0, 0.95)";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.fillText(`${index + 1}`, 128, 85);

    return new THREE.CanvasTexture(canvas);
  }, [index, isSelected]);

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
          color: !isActive ? 0xcccccc : isSelected ? 0xff4444 : 0x4682b4,
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

interface ManagementSceneProps {
  groupData: {
    groupId: string;
    allPanelsInGroup: PanelData[];
  };
  selectedPanels: Set<string>;
  onPanelSelect: (panelIds: Set<string>) => void;
}

const ManagementScene: React.FC<ManagementSceneProps> = ({
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
          <ManagementPanel
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

const GroupManagement: React.FC<GroupManagementProps> = ({
  groupData,
  selectedPanels,
  onPanelSelect,
  onClose,
  onGroupChanged,
}) => {
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMoveToGroup, setShowMoveToGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#4682b4");
  const [targetGroupId, setTargetGroupId] = useState("");

  const {
    confirmDialog,
    showConfirm,
    hideConfirm,
    notificationDialog,
    showNotification,
    hideNotification,
  } = useDialog();

  const groups = useSolarPanelStore((state: SolarPanelState) => state.groups);
  const createGroup = useSolarPanelStore(
    (state: SolarPanelState) => state.createGroup,
  );
  const movePanels = useSolarPanelStore(
    (state: SolarPanelState) => state.movePanels,
  );
  const moveGroup = useSolarPanelStore(
    (state: SolarPanelState) => state.moveGroup,
  );
  const deleteGroup = useSolarPanelStore(
    (state: SolarPanelState) => state.deleteGroup,
  );

  const availableColors = [
    { name: "Azul", value: "#4682b4" },
    { name: "Verde", value: "#32cd32" },
    { name: "Rojo", value: "#ff6347" },
    { name: "Dorado", value: "#ffd700" },
    { name: "Púrpura", value: "#9370db" },
    { name: "Aguamarina", value: "#20b2aa" },
    { name: "Rosa", value: "#ff69b4" },
    { name: "Carmesí", value: "#dc143c" },
    { name: "Turquesa", value: "#00ced1" },
    { name: "Naranja", value: "#ffa500" },
    { name: "Negro", value: "#000000" },
  ];

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

  const selectAllPanels = () => {
    const allPanelIds = new Set(
      groupData.allPanelsInGroup.map((p) => p.panelId),
    );
    onPanelSelect(allPanelIds);
  };

  const clearSelection = () => {
    onPanelSelect(new Set());
    setRangeEnd("");
    setRangeStart("");
  };

  const handleCreateGroup = () => {
    if (selectedPanels.size === 0) {
      showNotification({
        message:
          "Por favor, selecciona al menos un panel para crear un nuevo grupo",
        variant: "warning",
        title: "Paneles requeridos",
      });
      return;
    }

    if (!newGroupName.trim()) {
      showNotification({
        message: "Por favor, introduce un nombre para el nuevo grupo",
        variant: "warning",
        title: "Nombre requerido",
      });
      return;
    }

    const existingGroup = groups.find(
      (g) => g.name.toLowerCase() === newGroupName.trim().toLowerCase(),
    );
    if (existingGroup) {
      showNotification({
        message: `Ya existe un grupo con el nombre "${newGroupName}". Por favor, elige otro nombre.`,
        variant: "error",
        title: "Nombre duplicado",
      });
      return;
    }

    const panelIds = Array.from(selectedPanels);
    try {
      const newGroupId = createGroup(
        newGroupName.trim(),
        newGroupColor,
        panelIds,
      );

      setNewGroupName("");
      setNewGroupColor("#4682b4");
      setShowCreateGroup(false);
      clearSelection();

      if (onGroupChanged) {
        onGroupChanged();
      }

      showNotification({
        message: `Nuevo grupo "${newGroupName}" creado con ID ${newGroupId} y ${panelIds.length} paneles`,
        variant: "success",
        title: "Grupo creado exitosamente",
        autoClose: true,
      });
    } catch (error) {
      showNotification({
        message: `Error al crear el grupo: ${error}`,
        variant: "error",
        title: "Error",
      });
    }
  };

  const handleMoveToGroup = async () => {
    if (selectedPanels.size === 0) {
      showNotification({
        message: "Por favor, selecciona al menos un panel para mover",
        variant: "warning",
        title: "Paneles requeridos",
      });
      return;
    }

    if (!targetGroupId) {
      showNotification({
        message: "Por favor, selecciona un grupo destino",
        variant: "warning",
        title: "Grupo destino requerido",
      });
      return;
    }

    const panelIds = Array.from(selectedPanels);
    const targetGroup = groups.find((g) => g.id === targetGroupId);
    const targetGroupName = targetGroup?.name || targetGroupId;

    const confirmed = await showConfirm({
      message: `¿Estás seguro que quieres mover ${panelIds.length} panel${panelIds.length > 1 ? "es" : ""} al grupo "${targetGroupName}"?`,
      title: "Confirmar movimiento de paneles",
      variant: "warning",
      confirmText: "Mover paneles",
      cancelText: "Cancelar",
    });

    if (!confirmed) {
      return;
    }

    try {
      movePanels(panelIds, targetGroupId);

      setTargetGroupId("");
      setShowMoveToGroup(false);
      clearSelection();

      if (onGroupChanged) {
        onGroupChanged();
      }

      showNotification({
        message: `${panelIds.length} panel${panelIds.length > 1 ? "es" : ""} movido${panelIds.length > 1 ? "s" : ""} al grupo "${targetGroupName}"`,
        variant: "success",
        title: "Paneles movidos exitosamente",
        autoClose: true,
      });
    } catch (error) {
      showNotification({
        message: `Error al mover los paneles: ${error}`,
        variant: "error",
        title: "Error",
      });
    }
  };

  const handleMoveEntireGroup = async () => {
    if (!targetGroupId) {
      showNotification({
        message: "Por favor, selecciona un grupo destino",
        variant: "warning",
        title: "Grupo destino requerido",
      });
      return;
    }

    const confirmed = await showConfirm({
      message: `¿Estás seguro que quieres mover todo el grupo ${groupData.groupId} al grupo ${targetGroupId}?`,
      title: "Confirmar movimiento de grupo",
      variant: "warning",
      confirmText: "Mover grupo",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      moveGroup(groupData.groupId, targetGroupId);

      if (onGroupChanged) {
        onGroupChanged();
      }

      const targetGroup = groups.find((g) => g.id === targetGroupId);
      showNotification({
        message: `Grupo ${groupData.groupId} movido completamente al grupo "${targetGroup?.name || targetGroupId}"`,
        variant: "success",
        title: "Grupo movido exitosamente",
        autoClose: true,
      });
      onClose();
    }
  };

  const handleDeleteGroup = async () => {
    const confirmed = await showConfirm({
      message: `¿Estás seguro que quieres eliminar el grupo ${groupData.groupId}? Los paneles se moverán al grupo por defecto.`,
      title: "Confirmar eliminación de grupo",
      variant: "danger",
      confirmText: "Eliminar grupo",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      deleteGroup(groupData.groupId);

      if (onGroupChanged) {
        onGroupChanged();
      }

      showNotification({
        message: `Grupo ${groupData.groupId} eliminado. Los paneles se han movido al grupo por defecto.`,
        variant: "success",
        title: "Grupo eliminado",
        autoClose: true,
      });
      onClose();
    }
  };

  const availableTargetGroups = groups.filter(
    (g) => g.id !== groupData.groupId,
  );

  return (
    <div className="fixed top-0 right-0 w-1/2 h-full flex flex-col bg-white/10 backdrop-blur-lg shadow-2xl border-l border-gray-200 overflow-hidden z-[9999]">
      <div className="bg-black text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Gestión - Grupo {groupData.groupId}
          </h2>
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
          {groupData.allPanelsInGroup.length} paneles • {selectedPanels.size}{" "}
          seleccionados
        </p>
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <Canvas
            style={{ width: "100%", height: "100%" }}
            camera={{ position: [0, 0, 30], near: 0.1, far: 1000 }}
          >
            <ManagementScene
              groupData={groupData}
              selectedPanels={selectedPanels}
              onPanelSelect={onPanelSelect}
            />
          </Canvas>
        </div>

        <div className="absolute bottom-4 left-4 right-4 max-h-1/2 overflow-y-auto">
          <div
            className="p-4 bg-gray-50/95 rounded-lg text-black backdrop-blur-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-semibold mb-2 text-gray-800">Selección</h3>
              <div className="flex space-x-2 mb-2">
                <input
                  type="number"
                  placeholder="ID Inicio"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="ID Fin"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2 mb-2">
                <button
                  onClick={handleRangeSelect}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Seleccionar Rango
                </button>
                <button
                  onClick={selectAllPanels}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Seleccionar Todo
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-gray-800">
                Acciones de Grupo
              </h3>
              <div className="space-y-2">
                <div>
                  <button
                    onClick={() => setShowCreateGroup(!showCreateGroup)}
                    className="w-full px-3 py-2 text-s bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
                    disabled={selectedPanels.size === 0}
                  >
                    Crear Nuevo Grupo ({selectedPanels.size} paneles)
                  </button>

                  {showCreateGroup && (
                    <div className="mt-2 p-3 border border-gray-300 rounded bg-white">
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Nombre del nuevo grupo"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Color:</span>
                          <select
                            value={newGroupColor}
                            onChange={(e) => setNewGroupColor(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            {availableColors.map((color) => (
                              <option key={color.value} value={color.value}>
                                {color.name}
                              </option>
                            ))}
                          </select>
                          <div
                            className="w-6 h-6 rounded border border-gray-400"
                            style={{ backgroundColor: newGroupColor }}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleCreateGroup}
                            className="px-3 py-1 text-s bg-green-700 text-white rounded hover:bg-green-300 transition-colors"
                          >
                            Crear Grupo
                          </button>
                          <button
                            onClick={() => setShowCreateGroup(false)}
                            className="px-3 py-1 text-s bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => setShowMoveToGroup(!showMoveToGroup)}
                    className="w-full px-3 py-2 text-s bg-black text-white rounded hover:bg-black/80 transition-colors"
                    disabled={selectedPanels.size === 0}
                  >
                    Mover a Grupo Existente ({selectedPanels.size} paneles)
                  </button>

                  {showMoveToGroup && (
                    <div className="mt-2 p-3 border border-gray-300 rounded bg-white">
                      <div className="space-y-2">
                        <select
                          value={targetGroupId}
                          onChange={(e) => setTargetGroupId(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1"
                        >
                          <option value="">Seleccionar grupo destino...</option>
                          {availableTargetGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name} (ID: {group.id}) -{" "}
                              {group.panels.length} paneles
                            </option>
                          ))}
                        </select>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleMoveToGroup}
                            className="px-3 py-1 text-s bg-black text-white rounded hover:bg-black/80 transition-colors"
                          >
                            Mover Paneles
                          </button>
                          <button
                            onClick={() => setShowMoveToGroup(false)}
                            className="px-3 py-1 text-s bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (availableTargetGroups.length === 0) {
                        showNotification({
                          message:
                            "No hay otros grupos disponibles para mover este grupo completo",
                          variant: "info",
                          title: "Sin grupos disponibles",
                        });
                        return;
                      }
                      setShowMoveToGroup(true);
                      selectAllPanels();
                    }}
                    className="w-full px-3 py-2 text-s bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    disabled={availableTargetGroups.length === 0}
                  >
                    Mover Grupo Completo
                  </button>
                </div>

                {/* Delete Group */}
                {/* <div>
                  <button
                    onClick={handleDeleteGroup}
                    className="w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Eliminar Grupo
                  </button>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog {...confirmDialog} onClose={hideConfirm} />

      <NotificationDialog {...notificationDialog} onClose={hideNotification} />
    </div>
  );
};

export default GroupManagement;
