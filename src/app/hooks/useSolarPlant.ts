"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import solarData from "../../utils/ObjEyeshot.json";
import {
  useSolarPanelStore,
  type SolarPanelState,
  type Point,
} from "../../store/useStore";
import { useDialog } from "./useDialog";
import { SolarData, LegendItem } from "../types/solar-types";

// Interfaces para el hook
interface SolarPlantState {
  // Estado de UI
  selectedPanel: any;
  isModalOpen: boolean;
  legendData: LegendItem[];
  selectedGroup: string;
  selectedPanels: Set<string>;
  showGroupDetail: boolean;
  selectedGroupData: any;
  showGroupManagement: boolean;
  modifyLayout: boolean;
  selectedPanelsForDeletion: Set<string>;
}

interface SolarPlantActions {
  handlePanelClick: (panelData: any, event?: any) => void;
  handleCameraUpdate: (legendData: LegendItem[]) => void;
  handleGroupChange: (groupId: string) => void;
  handleOpenGroupManagement: () => void;
  handleCloseGroupManagement: () => void;
  handleGroupChanged: () => void;
  handleOpenGroupManagementFromPanel: (groupId: string) => void;
  handlePositionChange: (
    panelId: string,
    newPosition: [number, number, number],
  ) => void;
  handlePanelGroupChange: (panelId: string, newGroupId: string) => void;
  handleAddPanel: () => void;
  handleDeleteSelectedPanels: () => void;
  handleClearSelection: () => void;
  setModifyLayout: (modify: boolean) => void;

  handleCloseModal: () => void;
  handleCloseGroupDetail: () => void;
  handlePanelSelectInGroup: (panelIds: Set<string>) => void;

  state: SolarPlantState;
  sceneConfig: any;
  cameraPosition: [number, number, number];

  notificationDialog: any;
  hideNotification: () => void;
}

interface UseSolarPlantProps {}

export const useSolarPlant = (
  props?: UseSolarPlantProps,
): SolarPlantActions => {
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [legendData, setLegendData] = useState<LegendItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState<any>(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [modifyLayout, setModifyLayoutState] = useState(false);
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

  useEffect(() => {
    if (selectedGroup && !groups.find((g: any) => g.id === selectedGroup)) {
      setSelectedGroup("");
      setShowGroupDetail(false);
      setShowGroupManagement(false);
      setSelectedGroupData(null);
      setSelectedPanels(new Set());
    }
  }, [selectedGroup, groups]);

  useEffect(() => {
    if (!modifyLayout) {
      setSelectedPanelsForDeletion(new Set());
    }
  }, [modifyLayout]);

  const isPointInFence = useCallback((x: number, y: number): boolean => {
    const { parcela } = solarData as SolarData;
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
  }, []);

  const findValidPosition = useCallback((): Point => {
    const { parcela } = solarData as SolarData;
    if (!parcela || parcela.length === 0) {
      return { X: 0, Y: 0, Z: 0 };
    }

    const minX = Math.min(...parcela.map((p) => p.X));
    const maxX = Math.max(...parcela.map((p) => p.X));
    const minY = Math.min(...parcela.map((p) => p.Y));
    const maxY = Math.max(...parcela.map((p) => p.Y));
    const avgZ = parcela.reduce((sum, p) => sum + p.Z, 0) / parcela.length;

    const panelLength = (solarData as SolarData).longitud || 2;
    const panelWidth = (solarData as SolarData).ancho || 1;

    const occupiedPositions = groups.flatMap((group) =>
      group.panels.map((panel) => panel.position),
    );

    const isAreaFree = (centerX: number, centerY: number): boolean => {
      const halfLength = panelLength / 2;
      const halfWidth = panelWidth / 2;

      const corners = [
        { x: centerX - halfLength, y: centerY - halfWidth },
        { x: centerX + halfLength, y: centerY - halfWidth },
        { x: centerX - halfLength, y: centerY + halfWidth },
        { x: centerX + halfLength, y: centerY + halfWidth },
      ];

      if (!corners.every((corner) => isPointInFence(corner.x, corner.y))) {
        return false;
      }

      const minSafeDistance = Math.max(panelLength, panelWidth) * 1.2;

      return !occupiedPositions.some((pos) => {
        const distance = Math.sqrt(
          Math.pow(centerX - pos.X, 2) + Math.pow(centerY - pos.Y, 2),
        );
        return distance < minSafeDistance;
      });
    };

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

    const edgePositions = [
      ...Array.from({ length: 10 }, (_, i) => ({
        x: minX + marginFromEdge + (i / 9) * (maxX - minX - 2 * marginFromEdge),
        y: minY + marginFromEdge,
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        x: minX + marginFromEdge + (i / 9) * (maxX - minX - 2 * marginFromEdge),
        y: maxY - marginFromEdge,
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        x: minX + marginFromEdge,
        y: minY + marginFromEdge + (i / 9) * (maxY - minY - 2 * marginFromEdge),
      })),
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

    const centroid = parcela.reduce(
      (acc, p) => ({
        X: acc.X + p.X / parcela.length,
        Y: acc.Y + p.Y / parcela.length,
        Z: acc.Z + p.Z / parcela.length,
      }),
      { X: 0, Y: 0, Z: 0 },
    );
    return centroid;
  }, [groups, isPointInFence]);

  const handlePanelClick = useCallback((panelData: any, event?: any) => {
    const currentStates = stateRef.current;

    if (currentStates.modifyLayout) {
      const panelId = panelData.id;

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

  const setModifyLayout = useCallback((modify: boolean) => {
    setModifyLayoutState(modify);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPanel(null);
  }, []);

  const handleCloseGroupDetail = useCallback(() => {
    setShowGroupDetail(false);
    setSelectedGroupData(null);
    setSelectedPanels(new Set());
    setSelectedGroup("");
  }, []);

  const handlePanelSelectInGroup = useCallback((panelIds: Set<string>) => {
    setSelectedPanels(panelIds);
  }, []);

  const cameraPosition = useMemo(() => {
    const { parcela, agrupaciones } = solarData as SolarData;
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
  }, []);

  const sceneConfig = useMemo(
    () => ({
      content: null,
      cameraType: "perspective" as const,
      cameraSettings: {
        position: cameraPosition,
        makeDefault: true,
      },
      modifyLayout,
    }),
    [cameraPosition, modifyLayout],
  );

  const state: SolarPlantState = {
    selectedPanel,
    isModalOpen,
    legendData,
    selectedGroup,
    selectedPanels,
    showGroupDetail,
    selectedGroupData,
    showGroupManagement,
    modifyLayout,
    selectedPanelsForDeletion,
  };

  return {
    state,

    handlePanelClick,
    handleCameraUpdate,
    handleGroupChange,
    handleOpenGroupManagement,
    handleCloseGroupManagement,
    handleGroupChanged,
    handleOpenGroupManagementFromPanel,
    handlePositionChange,
    handlePanelGroupChange,
    handleAddPanel,
    handleDeleteSelectedPanels,
    handleClearSelection,
    setModifyLayout,

    handleCloseModal,
    handleCloseGroupDetail,
    handlePanelSelectInGroup,

    sceneConfig,
    cameraPosition,

    notificationDialog,
    hideNotification,
  };
};
