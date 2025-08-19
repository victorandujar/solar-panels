import { create } from "zustand";
import solarData from "../utils/ObjEyeshot.json";

// Types para los paneles
export interface Point {
  X: number;
  Y: number;
  Z: number;
}

export interface Panel {
  id: string;
  name: string;
  active: boolean;
  groupId: string;
  position: Point;
  index: number;
}

export interface PanelGroup {
  id: string;
  name: string;
  panels: Panel[];
  active: boolean;
}

// State interface
export interface SolarPanelState {
  groups: PanelGroup[];
  panels: Panel[];

  // Actions
  disablePanels: (ids: string[]) => void;
  enablePanel: (id: string) => void;
  enablePanels: (ids: string[]) => void;
  enableAllPanels: () => void;
  disableAllPanels: () => void;
  togglePanel: (id: string) => void;
  disableGroup: (groupId: string) => void;
  enableGroup: (groupId: string) => void;
  toggleGroup: (groupId: string) => void;
  initializePanels: () => void;
}

// Helper function para generar datos iniciales de paneles
const generateInitialPanels = (): { groups: PanelGroup[]; panels: Panel[] } => {
  const groups: PanelGroup[] = [];
  const panels: Panel[] = [];

  Object.entries(solarData.agrupaciones).forEach(([groupId, points]) => {
    const groupPanels: Panel[] = [];

    points.forEach((point: Point, index: number) => {
      const panelId = `${groupId}-${index}`;
      const panel: Panel = {
        id: panelId,
        name: `Panel ${groupId}-${index + 1}`,
        active: true,
        groupId,
        position: point,
        index,
      };

      groupPanels.push(panel);
      panels.push(panel);
    });

    const group: PanelGroup = {
      id: groupId,
      name: `Grupo ${groupId}`,
      panels: groupPanels,
      active: true,
    };

    groups.push(group);
  });

  return { groups, panels };
};

// Zustand store
export const useSolarPanelStore = create<SolarPanelState>((set, get) => ({
  groups: [],
  panels: [],

  initializePanels: () => {
    const { groups, panels } = generateInitialPanels();
    set({ groups, panels });
  },

  disablePanels: (ids: string[]) => {
    set((state) => {
      const newPanels = state.panels.map((panel) =>
        ids.includes(panel.id) ? { ...panel, active: false } : panel,
      );

      const newGroups = state.groups.map((group) => ({
        ...group,
        panels: group.panels.map((panel) =>
          ids.includes(panel.id) ? { ...panel, active: false } : panel,
        ),
        active: group.panels.some((panel) =>
          !ids.includes(panel.id) ? panel.active : false,
        ),
      }));

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });
  },

  enablePanel: (id: string) => {
    set((state) => {
      const newPanels = state.panels.map((panel) =>
        panel.id === id ? { ...panel, active: true } : panel,
      );

      const panelToEnable = state.panels.find((p) => p.id === id);
      if (!panelToEnable) return state;

      const newGroups = state.groups.map((group) =>
        group.id === panelToEnable.groupId
          ? {
              ...group,
              panels: group.panels.map((panel) =>
                panel.id === id ? { ...panel, active: true } : panel,
              ),
              active: true,
            }
          : group,
      );

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });
  },

  enablePanels: (ids: string[]) => {
    set((state) => {
      const newPanels = state.panels.map((panel) =>
        ids.includes(panel.id) ? { ...panel, active: true } : panel,
      );

      const newGroups = state.groups.map((group) => ({
        ...group,
        panels: group.panels.map((panel) =>
          ids.includes(panel.id) ? { ...panel, active: true } : panel,
        ),
        active: group.panels.some((panel) =>
          ids.includes(panel.id) ? true : panel.active,
        ),
      }));

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });
  },

  enableAllPanels: () => {
    set((state) => {
      const newPanels = state.panels.map((panel) => ({
        ...panel,
        active: true,
      }));

      const newGroups = state.groups.map((group) => ({
        ...group,
        panels: group.panels.map((panel) => ({
          ...panel,
          active: true,
        })),
        active: true,
      }));

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });
  },

  disableAllPanels: () => {
    set((state) => {
      const newPanels = state.panels.map((panel) => ({
        ...panel,
        active: false,
      }));

      const newGroups = state.groups.map((group) => ({
        ...group,
        panels: group.panels.map((panel) => ({
          ...panel,
          active: false,
        })),
        active: false,
      }));

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });
  },

  togglePanel: (id: string) => {
    const panel = get().panels.find((p) => p.id === id);
    if (panel) {
      if (panel.active) {
        get().disablePanels([id]);
      } else {
        get().enablePanel(id);
      }
    }
  },

  disableGroup: (groupId: string) => {
    const group = get().groups.find((g) => g.id === groupId);
    if (group) {
      const panelIds = group.panels.map((p) => p.id);
      get().disablePanels(panelIds);
    }
  },

  enableGroup: (groupId: string) => {
    set((state) => {
      const newPanels = state.panels.map((panel) =>
        panel.groupId === groupId ? { ...panel, active: true } : panel,
      );

      const newGroups = state.groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              panels: group.panels.map((panel) => ({ ...panel, active: true })),
              active: true,
            }
          : group,
      );

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });
  },

  toggleGroup: (groupId: string) => {
    const group = get().groups.find((g) => g.id === groupId);
    if (group) {
      if (group.active) {
        get().disableGroup(groupId);
      } else {
        get().enableGroup(groupId);
      }
    }
  },
}));

// Hook personalizado para obtener solo paneles
export const usePanels = () => {
  return useSolarPanelStore((state) => state.panels);
};

// Hook personalizado para obtener solo grupos
export const useGroups = () => {
  return useSolarPanelStore((state) => state.groups);
};

// Hook personalizado para obtener paneles activos
export const useActivePanels = () => {
  return useSolarPanelStore((state) =>
    state.panels.filter((panel) => panel.active),
  );
};

// Hook personalizado para obtener paneles inactivos
export const useInactivePanels = () => {
  return useSolarPanelStore((state) =>
    state.panels.filter((panel) => !panel.active),
  );
};

// Hook optimizado para obtener el estado de un panel específico
// Hook optimizado para obtener el estado de un panel específico
export const usePanelActive = (panelId: string) => {
  return useSolarPanelStore((state) => {
    const panel = state.panels.find((p) => p.id === panelId);
    return panel?.active ?? true;
  });
};

// Cache para los estados de paneles
let panelStatesCache: {
  key: string;
  states: Record<string, boolean>;
} | null = null;

// Hook optimizado para obtener todos los estados de paneles activos
export const useAllPanelStates = () => {
  return useSolarPanelStore((state) => {
    // Crear una clave basada en el estado actual de todos los paneles
    const activePanelIds = state.panels
      .filter((p) => p.active)
      .map((p) => p.id)
      .sort()
      .join(",");
    const totalPanels = state.panels.length;
    const cacheKey = `${totalPanels}-${activePanelIds}`;

    // Si el cache existe y la clave coincide, devolver el objeto cacheado
    if (panelStatesCache && panelStatesCache.key === cacheKey) {
      return panelStatesCache.states;
    }

    // Crear nuevo objeto de estados
    const panelStates: Record<string, boolean> = {};
    state.panels.forEach((panel) => {
      panelStates[panel.id] = panel.active;
    });

    // Guardar en cache
    panelStatesCache = {
      key: cacheKey,
      states: panelStates,
    };

    return panelStates;
  });
};

// Hook personalizado para obtener un panel específico
export const usePanel = (id: string) => {
  return useSolarPanelStore((state) => state.panels.find((p) => p.id === id));
};

// Cache para las estadísticas
let statsCache: {
  key: string;
  stats: {
    totalPanels: number;
    activePanels: number;
    inactivePanels: number;
    panelActivePercentage: number;
  };
} | null = null;

// Hook simple y directo para estadísticas con cache manual
export const usePanelStats = () => {
  return useSolarPanelStore((state) => {
    const totalPanels = state.panels.length;
    const activePanels = state.panels.filter((p) => p.active).length;
    const inactivePanels = totalPanels - activePanels;
    const panelActivePercentage =
      totalPanels > 0 ? Math.round((activePanels / totalPanels) * 100) : 0;

    // Crear una clave única para este estado
    const cacheKey = `${totalPanels}-${activePanels}`;

    // Si el cache existe y la clave coincide, devolver el objeto cacheado
    if (statsCache && statsCache.key === cacheKey) {
      return statsCache.stats;
    }

    // Crear nuevo objeto y guardarlo en cache
    const newStats = {
      totalPanels,
      activePanels,
      inactivePanels,
      panelActivePercentage,
    };

    statsCache = {
      key: cacheKey,
      stats: newStats,
    };

    return newStats;
  });
};

// Hook personalizado para obtener un grupo específico
export const useGroup = (groupId: string) => {
  return useSolarPanelStore((state) =>
    state.groups.find((g) => g.id === groupId),
  );
};
