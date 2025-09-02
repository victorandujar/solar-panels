"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSolarPanelStore, type SolarPanelState } from "../../store/useStore";
import { useDialog } from "./useDialog";
import solarData from "../../utils/ObjEyeshot.json";
import { SolarData } from "../types/solar-types";

interface PanelData {
  panelId: string;
  groupId: string;
  position: { x: number; y: number; z: number };
  inclination: number;
  dimensions: { length: number; width: number };
}

interface GroupDetailState {
  selectedPanels: Set<string>;
  rangeStart: string;
  rangeEnd: string;
  groupData: {
    groupId: string;
    allPanelsInGroup: PanelData[];
  } | null;
}

export const useGroupDetail = () => {
  const params = useParams();
  const router = useRouter();
  const groupName = Array.isArray(params?.group_name)
    ? params.group_name[0]
    : params?.group_name;
  const locale = Array.isArray(params?.locale)
    ? params.locale[0]
    : params?.locale || "es";

  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
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

  const groups = useSolarPanelStore((state: SolarPanelState) => state.groups);
  const panels = useSolarPanelStore((state: SolarPanelState) => state.panels);
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
  const initializePanels = useSolarPanelStore(
    (state: SolarPanelState) => state.initializePanels,
  );

  // Inicializar el store si no hay datos
  useEffect(() => {
    if (groups.length === 0) {
      initializePanels();
    }
  }, [groups.length, initializePanels]);

  // Crear los datos del grupo basado en la URL
  const groupData = useMemo(() => {
    if (!groupName || groups.length === 0) return null;

    const selectedGroup = groups.find((g: any) => g.id === groupName);
    if (!selectedGroup) return null;

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

    return {
      groupId: groupName,
      allPanelsInGroup: groupPanels,
    };
  }, [groupName, groups]);

  const handlePanelSelect = useCallback((panelIds: Set<string>) => {
    setSelectedPanels(panelIds);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleRangeSelect = useCallback(() => {
    if (!rangeStart || !rangeEnd || !groupData) return;

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

    setSelectedPanels(newSelectedPanels);
  }, [rangeStart, rangeEnd, groupData, selectedPanels]);

  const clearSelection = useCallback(() => {
    setSelectedPanels(new Set());
    setRangeEnd("");
    setRangeStart("");
  }, []);

  const handleDisableSelected = useCallback(async () => {
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
  }, [
    selectedPanels,
    disablePanels,
    clearSelection,
    showConfirm,
    showNotification,
  ]);

  const handleEnableSelected = useCallback(async () => {
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
  }, [selectedPanels, enablePanels, clearSelection, showNotification]);

  const handleDisableGroup = useCallback(async () => {
    if (!groupData) return;

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
  }, [groupData, disableGroup, clearSelection, showConfirm, showNotification]);

  const handleEnableGroup = useCallback(async () => {
    if (!groupData) return;

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
  }, [groupData, enableGroup, clearSelection, showConfirm, showNotification]);

  const hasInactiveSelectedPanels = useMemo(() => {
    return Array.from(selectedPanels).some((panelId) => {
      const panel = panels.find((p) => p.id === panelId);
      return panel && !panel.active;
    });
  }, [selectedPanels, panels]);

  const hasInactivePanelsInGroup = useMemo(() => {
    if (!groupData) return false;
    return panels.some(
      (panel) => panel.groupId === groupData.groupId && !panel.active,
    );
  }, [panels, groupData]);

  const state: GroupDetailState = {
    selectedPanels,
    rangeStart,
    rangeEnd,
    groupData,
  };

  return {
    state,
    groupData,
    groupName,
    panels,

    // Handlers
    handlePanelSelect,
    handleClose,
    handleRangeSelect,
    clearSelection,
    handleDisableSelected,
    handleEnableSelected,
    handleDisableGroup,
    handleEnableGroup,

    // State setters
    setRangeStart,
    setRangeEnd,

    // Computed values
    hasInactiveSelectedPanels,
    hasInactivePanelsInGroup,

    // Dialog state
    confirmDialog,
    hideConfirm,
    notificationDialog,
    hideNotification,
  };
};
