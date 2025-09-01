"use client";

import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { PerspectiveCamera } from "@react-three/drei";
import solarData from "../../../utils/ObjEyeshot.json";
import Modal from "../Modal/Modal";
import SolarPanelDetail from "../SolarPanelDetail/SolarPanelDetail";
import GroupDetail3D from "../GroupDetail3D/GroupDetail3D";
import GroupManagement from "../GroupManagement/GroupManagement";
import GroupSelector from "../GroupSelector/GroupSelector";
import PanelStats from "../PanelStats/PanelStats";
import QuickControls from "../QuickControls/QuickControls";
import SolarPlantScene from "../SolarPlantScene/SolarPlantScene";
import NotificationDialog from "../NotificationDialog/NotificationDialog";
import { useRegisterScene } from "../../hooks/useRegisterScene";
import { useDialog } from "../../hooks/useDialog";
import {
  useSolarPanelStore,
  type SolarPanelState,
  type Point,
} from "../../../store/useStore";
import { SolarData, LegendItem } from "../../types/solar-types";
import { FaEdit, FaPlus, FaPlusSquare, FaTrash, FaTimes } from "react-icons/fa";

const SolarPanelLayout: React.FC = () => {
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [legendData, setLegendData] = useState<LegendItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState<any>(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [modifyLayout, setModifyLayout] = useState(false);
  const [selectedPanelsForDeletion, setSelectedPanelsForDeletion] = useState<
    Set<string>
  >(new Set());

  const stateRef = useRef({
    isModalOpen,
    showGroupDetail,
    selectedGroupData,
    showGroupManagement,
    modifyLayout,
    selectedPanelsForDeletion,
  });

  useEffect(() => {
    stateRef.current = {
      isModalOpen,
      showGroupDetail,
      selectedGroupData,
      showGroupManagement,
      modifyLayout,
      selectedPanelsForDeletion,
    };
  }, [
    isModalOpen,
    showGroupDetail,
    selectedGroupData,
    showGroupManagement,
    modifyLayout,
    selectedPanelsForDeletion,
  ]);

  const initializePanels = useSolarPanelStore(
    (state: SolarPanelState) => state.initializePanels,
  );
  const groups = useSolarPanelStore((state: SolarPanelState) => state.groups);
  const movePanel = useSolarPanelStore(
    (state: SolarPanelState) => state.movePanel,
  );
  const updatePanelPosition = useSolarPanelStore(
    (state: SolarPanelState) => state.updatePanelPosition,
  );
  const addPanel = useSolarPanelStore(
    (state: SolarPanelState) => state.addPanel,
  );
  const deletePanels = useSolarPanelStore(
    (state: SolarPanelState) => state.deletePanels,
  );

  const { notificationDialog, hideNotification, showNotification } =
    useDialog();

  const rootRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    initializePanels();
  }, [initializePanels]);

  useEffect(() => {
    if (selectedGroup && !groups.find((g: any) => g.id === selectedGroup)) {
      setSelectedGroup("");
      setShowGroupDetail(false);
      setShowGroupManagement(false);
      setSelectedGroupData(null);
      setSelectedPanels(new Set());
    }
  }, [selectedGroup, groups]);

  const handlePanelClick = useCallback((panelData: any, event?: any) => {
    const currentStates = stateRef.current;

    // En modo edición, manejar selección para eliminación
    if (currentStates.modifyLayout) {
      const panelId = panelData.id;

      // Si se mantiene Ctrl/Cmd, permitir selección múltiple
      if (event?.ctrlKey || event?.metaKey) {
        setSelectedPanelsForDeletion((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(panelId)) {
            newSet.delete(panelId);
          } else {
            newSet.add(panelId);
          }
          return newSet;
        });
      } else {
        // Sin Ctrl/Cmd, seleccionar solo este panel
        setSelectedPanelsForDeletion(new Set([panelId]));
      }
      return;
    }

    if (
      currentStates.isModalOpen ||
      currentStates.showGroupDetail ||
      currentStates.selectedGroupData ||
      currentStates.showGroupManagement
    ) {
      return;
    }

    setSelectedPanel(panelData);
    setIsModalOpen(true);
    setShowGroupDetail(false);
    setSelectedGroupData(null);
  }, []);

  const handleCameraUpdate = useCallback((legendData: LegendItem[]) => {
    setLegendData(legendData);
  }, []);

  const handleGroupChange = useCallback(
    (groupId: string) => {
      setSelectedGroup(groupId);
      setIsModalOpen(false);
      setSelectedPanel(null);

      if (groupId) {
        const selectedGroup = groups.find((g: any) => g.id === groupId);

        if (selectedGroup) {
          const groupPanels = selectedGroup.panels.map((panel: any) => ({
            groupId: panel.groupId,
            panelId: panel.id,
            position: {
              x: panel.position.X,
              y: panel.position.Y,
              z: panel.position.Z,
            },
            inclination: (solarData as SolarData).tilt,
            dimensions: {
              length: (solarData as SolarData).longitud,
              width: (solarData as SolarData).ancho,
            },
          }));

          setSelectedGroupData({
            groupId: groupId,
            allPanelsInGroup: groupPanels,
          });
          setShowGroupDetail(true);
        }
      } else {
        setShowGroupDetail(false);
        setSelectedGroupData(null);
      }
    },
    [groups],
  );

  const handleOpenGroupManagement = useCallback(() => {
    setShowGroupManagement(true);
    setShowGroupDetail(false);
  }, []);

  const handleCloseGroupManagement = useCallback(() => {
    setShowGroupManagement(false);
    setShowGroupDetail(true);

    if (selectedGroup) {
      const updatedGroup = groups.find((g: any) => g.id === selectedGroup);
      if (updatedGroup && updatedGroup.panels.length > 0) {
        const groupPanels = updatedGroup.panels.map((panel: any) => ({
          groupId: panel.groupId,
          panelId: panel.id,
          position: {
            x: panel.position.X,
            y: panel.position.Y,
            z: panel.position.Z,
          },
          inclination: (solarData as SolarData).tilt,
          dimensions: {
            length: (solarData as SolarData).longitud,
            width: (solarData as SolarData).ancho,
          },
        }));

        setSelectedGroupData({
          groupId: selectedGroup,
          allPanelsInGroup: groupPanels,
        });
      } else {
        setShowGroupDetail(false);
        setSelectedGroupData(null);
        setSelectedGroup("");
      }
    }
  }, [selectedGroup, groups]);

  const handleGroupChanged = useCallback(() => {
    if (selectedGroup) {
      const updatedGroup = groups.find((g: any) => g.id === selectedGroup);
      if (updatedGroup && updatedGroup.panels.length > 0) {
        const groupPanels = updatedGroup.panels.map((panel: any) => ({
          groupId: panel.groupId,
          panelId: panel.id,
          position: {
            x: panel.position.X,
            y: panel.position.Y,
            z: panel.position.Z,
          },
          inclination: (solarData as SolarData).tilt,
          dimensions: {
            length: (solarData as SolarData).longitud,
            width: (solarData as SolarData).ancho,
          },
        }));

        setSelectedGroupData({
          groupId: selectedGroup,
          allPanelsInGroup: groupPanels,
        });
      } else {
        setShowGroupDetail(false);
        setShowGroupManagement(false);
        setSelectedGroupData(null);
        setSelectedGroup("");
      }
    }
  }, [selectedGroup, groups]);

  const handleOpenGroupManagementFromPanel = useCallback(
    (groupId: string) => {
      setIsModalOpen(false);
      setSelectedPanel(null);

      const selectedGroup = groups.find((g: any) => g.id === groupId);

      if (selectedGroup) {
        const groupPanels = selectedGroup.panels.map((panel: any) => ({
          groupId: panel.groupId,
          panelId: panel.id,
          position: {
            x: panel.position.X,
            y: panel.position.Y,
            z: panel.position.Z,
          },
          inclination: (solarData as SolarData).tilt,
          dimensions: {
            length: (solarData as SolarData).longitud,
            width: (solarData as SolarData).ancho,
          },
        }));

        setSelectedGroupData({
          groupId: groupId,
          allPanelsInGroup: groupPanels,
        });

        setShowGroupDetail(false);
        setShowGroupManagement(true);
        setSelectedGroup(groupId);
      }
    },
    [groups],
  );

  const handlePositionChange = useCallback(
    (panelId: string, newPosition: [number, number, number]) => {
      const position: Point = {
        X: newPosition[0],
        Y: newPosition[1],
        Z: newPosition[2],
      };
      updatePanelPosition(panelId, position);
    },
    [updatePanelPosition],
  );

  const handlePanelGroupChange = useCallback(
    (panelId: string, newGroupId: string) => {
      movePanel(panelId, newGroupId);
    },
    [movePanel],
  );

  const { agrupaciones, parcela } = solarData as SolarData;

  // Función para verificar si un punto está dentro de la fence
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

  // Función para encontrar una posición válida para un nuevo panel
  const findValidPosition = useCallback((): Point => {
    if (!parcela || parcela.length === 0) {
      return { X: 0, Y: 0, Z: 0 };
    }

    // Calcular los límites de la parcela
    const minX = Math.min(...parcela.map((p) => p.X));
    const maxX = Math.max(...parcela.map((p) => p.X));
    const minY = Math.min(...parcela.map((p) => p.Y));
    const maxY = Math.max(...parcela.map((p) => p.Y));
    const avgZ = parcela.reduce((sum, p) => sum + p.Z, 0) / parcela.length;

    // Obtener dimensiones de panel desde solarData
    const panelLength = (solarData as SolarData).longitud || 2;
    const panelWidth = (solarData as SolarData).ancho || 1;

    // Buscar posiciones ocupadas por paneles existentes
    const occupiedPositions = groups.flatMap((group) =>
      group.panels.map((panel) => panel.position),
    );

    // Función para verificar si un rectángulo (panel) está libre de obstáculos
    const isAreaFree = (centerX: number, centerY: number): boolean => {
      // Definir las esquinas del panel
      const halfLength = panelLength / 2;
      const halfWidth = panelWidth / 2;

      // Verificar que toda el área del panel esté dentro de la fence
      const corners = [
        { x: centerX - halfLength, y: centerY - halfWidth },
        { x: centerX + halfLength, y: centerY - halfWidth },
        { x: centerX - halfLength, y: centerY + halfWidth },
        { x: centerX + halfLength, y: centerY + halfWidth },
      ];

      // Todas las esquinas deben estar dentro de la fence
      if (!corners.every((corner) => isPointInFence(corner.x, corner.y))) {
        return false;
      }

      // Verificar que no haya solapamiento con paneles existentes
      const minSafeDistance = Math.max(panelLength, panelWidth) * 1.2; // 20% de margen extra

      return !occupiedPositions.some((pos) => {
        const distance = Math.sqrt(
          Math.pow(centerX - pos.X, 2) + Math.pow(centerY - pos.Y, 2),
        );
        return distance < minSafeDistance;
      });
    };

    // Estrategia 1: Buscar en una cuadrícula dentro de la parcela
    const gridSpacing = Math.max(panelLength, panelWidth) * 1.5;
    const marginFromEdge = Math.max(panelLength, panelWidth);

    for (
      let x = minX + marginFromEdge;
      x <= maxX - marginFromEdge;
      x += gridSpacing
    ) {
      for (
        let y = minY + marginFromEdge;
        y <= maxY - marginFromEdge;
        y += gridSpacing
      ) {
        if (isAreaFree(x, y)) {
          return { X: x, Y: y, Z: avgZ };
        }
      }
    }

    // Estrategia 2: Búsqueda aleatoria más densa
    const maxAttempts = 100;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x =
        minX +
        marginFromEdge +
        Math.random() * (maxX - minX - 2 * marginFromEdge);
      const y =
        minY +
        marginFromEdge +
        Math.random() * (maxY - minY - 2 * marginFromEdge);

      if (isAreaFree(x, y)) {
        return { X: x, Y: y, Z: avgZ };
      }
    }

    // Estrategia 3: Buscar en los bordes (menos ideal pero funcional)
    const edgePositions = [
      // Borde superior
      ...Array.from({ length: 10 }, (_, i) => ({
        x: minX + marginFromEdge + (i / 9) * (maxX - minX - 2 * marginFromEdge),
        y: minY + marginFromEdge,
      })),
      // Borde inferior
      ...Array.from({ length: 10 }, (_, i) => ({
        x: minX + marginFromEdge + (i / 9) * (maxX - minX - 2 * marginFromEdge),
        y: maxY - marginFromEdge,
      })),
      // Borde izquierdo
      ...Array.from({ length: 10 }, (_, i) => ({
        x: minX + marginFromEdge,
        y: minY + marginFromEdge + (i / 9) * (maxY - minY - 2 * marginFromEdge),
      })),
      // Borde derecho
      ...Array.from({ length: 10 }, (_, i) => ({
        x: maxX - marginFromEdge,
        y: minY + marginFromEdge + (i / 9) * (maxY - minY - 2 * marginFromEdge),
      })),
    ];

    for (const pos of edgePositions) {
      if (isAreaFree(pos.x, pos.y)) {
        return { X: pos.x, Y: pos.y, Z: avgZ };
      }
    }

    // Fallback: retornar una posición en el centro, aunque pueda solaparse
    const centroid = parcela.reduce(
      (acc, p) => ({
        X: acc.X + p.X / parcela.length,
        Y: acc.Y + p.Y / parcela.length,
        Z: acc.Z + p.Z / parcela.length,
      }),
      { X: 0, Y: 0, Z: 0 },
    );
    return centroid;
  }, [parcela, groups, isPointInFence]);

  const handleAddPanel = useCallback(() => {
    const newPosition = findValidPosition();

    const panelLength = (solarData as SolarData).longitud || 2;
    const panelWidth = (solarData as SolarData).ancho || 1;
    const minSafeDistance = Math.max(panelLength, panelWidth) * 1.2;

    const occupiedPositions = groups.flatMap((group) =>
      group.panels.map((panel) => panel.position),
    );

    const isSafePosition = !occupiedPositions.some((pos) => {
      const distance = Math.sqrt(
        Math.pow(newPosition.X - pos.X, 2) + Math.pow(newPosition.Y - pos.Y, 2),
      );
      return distance < minSafeDistance;
    });

    if (isSafePosition || occupiedPositions.length === 0) {
      addPanel(newPosition);
    } else {
      showNotification({
        message:
          "No hay espacio suficiente para añadir un nuevo panel. Intenta mover algunos paneles existentes para liberar espacio.",
        title: "Espacio insuficiente",
        variant: "warning",
        autoClose: true,
        autoCloseDelay: 5000,
      });
    }
  }, [findValidPosition, addPanel, groups, showNotification]);

  const handleDeleteSelectedPanels = useCallback(() => {
    if (selectedPanelsForDeletion.size === 0) {
      showNotification({
        message: "No hay paneles seleccionados para eliminar.",
        title: "Sin selección",
        variant: "info",
        autoClose: true,
        autoCloseDelay: 3000,
      });
      return;
    }

    const panelCount = selectedPanelsForDeletion.size;
    deletePanels(Array.from(selectedPanelsForDeletion));
    setSelectedPanelsForDeletion(new Set());

    showNotification({
      message: `${panelCount} panel${panelCount > 1 ? "es" : ""} movido${panelCount > 1 ? "s" : ""} al grupo de eliminados.`,
      title: "Paneles eliminados",
      variant: "success",
      autoClose: true,
      autoCloseDelay: 3000,
    });
  }, [selectedPanelsForDeletion, deletePanels, showNotification]);

  const handleClearSelection = useCallback(() => {
    setSelectedPanelsForDeletion(new Set());
  }, []);

  useEffect(() => {
    if (!modifyLayout) {
      setSelectedPanelsForDeletion(new Set());
    }
  }, [modifyLayout]);

  const cameraPosition = useMemo(() => {
    const centroid = parcela.reduce(
      (acc, p) => ({
        x: acc.x + p.X / parcela.length,
        y: acc.y + p.Y / parcela.length,
        z: acc.z + p.Z / parcela.length,
      }),
      { x: 0, y: 0, z: 0 },
    );

    const allPoints = [...parcela, ...Object.values(agrupaciones).flat()];
    const maxDistance = Math.max(
      ...allPoints.map((p) =>
        Math.sqrt(
          Math.pow(p.X - centroid.x, 2) +
            Math.pow(p.Y - centroid.y, 2) +
            Math.pow(p.Z - centroid.z, 2),
        ),
      ),
    );

    const distance = maxDistance * 1.8;
    const angle = Math.PI / 3;

    const x = centroid.x;
    const y = centroid.y - distance * Math.sin(angle);
    const z = centroid.z + distance * Math.cos(angle);

    return [x, y, z] as [number, number, number];
  }, [parcela, agrupaciones]);

  useEffect(() => {
    const resizeHandler = () => {};
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  const sceneContent = useMemo(
    () => (
      <>
        <PerspectiveCamera
          makeDefault
          fov={75}
          near={0.1}
          far={10000}
          position={cameraPosition}
        />
        <SolarPlantScene
          selectedGroup={selectedGroup}
          selectedPanels={selectedPanels}
          selectedPanelsForDeletion={selectedPanelsForDeletion}
          onPanelClick={handlePanelClick}
          onCameraUpdate={handleCameraUpdate}
          modifyLayout={modifyLayout}
          onPositionChange={handlePositionChange}
          onGroupChange={handlePanelGroupChange}
        />
      </>
    ),
    [
      cameraPosition,
      selectedGroup,
      selectedPanels,
      selectedPanelsForDeletion,
      handlePanelClick,
      handleCameraUpdate,
      modifyLayout,
      handlePositionChange,
      handlePanelGroupChange,
    ],
  );

  const sceneConfig = useMemo(
    () => ({
      content: sceneContent,
      cameraType: "perspective" as const,
      cameraSettings: {
        position: cameraPosition,
        makeDefault: true,
      },
      modifyLayout,
    }),
    [sceneContent, cameraPosition, modifyLayout],
  );

  useRegisterScene("solar-plant-main", sceneConfig);

  return (
    <>
      <div
        ref={rootRef}
        className={`h-screen overflow-hidden relative transition-all duration-300 font-mono ${
          showGroupDetail ? "w-1/2" : "w-full"
        }`}
      ></div>

      <div className="absolute top-32 left-4 z-20 w-full">
        <div className="flex md:justify-between 2xl:justify-start gap-4 w-full pr-8">
          <GroupSelector
            legendData={legendData}
            selectedGroup={selectedGroup}
            onGroupChange={handleGroupChange}
          />

          <div className="flex flex-col gap-4">
            <QuickControls className="md:w-72 2xl:w-full" />
            <PanelStats className="w-72 2xl:w-60" />
            <button
              onClick={() => setModifyLayout(!modifyLayout)}
              className={`px-4 py-2 rounded font-medium transition-colors w-60 text-sm flex justify-center items-center gap-2 ${
                modifyLayout
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              <FaEdit />
              {modifyLayout ? "Desactivar edición" : "Editar layout"}
            </button>
            {modifyLayout && (
              <section className="flex flex-col gap-2 text-black border border-white/30 bg-white/10 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] w-60 p-4 rounded-lg">
                <button
                  onClick={handleAddPanel}
                  className="flex items-center justify-center gap-2 text-sm bg-black/70 backdrop-blur-lg p-2 rounded-lg text-white hover:bg-black/80 transition-colors"
                >
                  <FaPlusSquare /> Añadir panel
                </button>

                {selectedPanelsForDeletion.size > 0 && (
                  <div className="flex flex-col gap-2 border-t border-white/20 pt-2">
                    <div className="text-xs text-white">
                      {selectedPanelsForDeletion.size} panel
                      {selectedPanelsForDeletion.size > 1 ? "es" : ""}{" "}
                      seleccionado
                      {selectedPanelsForDeletion.size > 1 ? "s" : ""}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteSelectedPanels}
                        className="flex items-center justify-center gap-2 text-xs bg-red-600 hover:bg-red-700 p-2 rounded-lg text-white transition-colors flex-1"
                      >
                        <FaTrash /> Eliminar
                      </button>
                      <button
                        onClick={handleClearSelection}
                        className="flex items-center justify-center gap-2 text-xs bg-gray-600 hover:bg-gray-700 p-2 rounded-lg text-white transition-colors flex-1"
                      >
                        <FaTimes /> Limpiar
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <h1 className="text-sm font-medium">Modo de edición:</h1>
                  <span className="text-sm font-medium text-green-700">
                    Activado
                  </span>
                </div>
                <span className="text-xs">
                  {selectedPanelsForDeletion.size > 0
                    ? "Haz clic en 'Eliminar' para mover los paneles seleccionados al grupo -1."
                    : "Haz clic en los paneles para seleccionarlos. Mantén Ctrl/Cmd para selección múltiple."}
                </span>
              </section>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalle de Placa Solar"
      >
        {selectedPanel && (
          <SolarPanelDetail
            panelData={selectedPanel}
            onOpenGroupManagement={handleOpenGroupManagementFromPanel}
          />
        )}
      </Modal>

      {showGroupDetail && selectedGroupData && !showGroupManagement && (
        <GroupDetail3D
          groupData={selectedGroupData}
          selectedPanels={selectedPanels}
          onClose={() => {
            setShowGroupDetail(false);
            setSelectedGroupData(null);
            setSelectedPanels(new Set());
            setSelectedGroup("");
          }}
          onPanelSelect={(panelIds: Set<string>) => {
            setSelectedPanels(panelIds);
          }}
          onOpenManagement={handleOpenGroupManagement}
        />
      )}

      {showGroupManagement && selectedGroupData && (
        <GroupManagement
          groupData={selectedGroupData}
          selectedPanels={selectedPanels}
          onClose={handleCloseGroupManagement}
          onPanelSelect={(panelIds: Set<string>) => {
            setSelectedPanels(panelIds);
          }}
          onGroupChanged={handleGroupChanged}
        />
      )}

      <NotificationDialog {...notificationDialog} onClose={hideNotification} />
    </>
  );
};

export default SolarPanelLayout;
