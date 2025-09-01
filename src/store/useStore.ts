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
  color?: string;
}

export interface SolarPanelState {
  groups: PanelGroup[];
  panels: Panel[];

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
  addPanel: (position: Point) => string;
  deletePanel: (panelId: string) => void;
  deletePanels: (panelIds: string[]) => void;

  createGroup: (name: string, color: string, panelIds: string[]) => string;
  movePanel: (panelId: string, targetGroupId: string) => void;
  movePanels: (panelIds: string[], targetGroupId: string) => void;
  moveGroup: (groupId: string, targetGroupId: string) => void;
  deleteGroup: (groupId: string) => void;
  updateGroupName: (groupId: string, name: string) => void;
  updateGroupColor: (groupId: string, color: string) => void;
  updatePanelPosition: (panelId: string, position: Point) => void;
}

const generateInitialPanels = (): { groups: PanelGroup[]; panels: Panel[] } => {
  const groups: PanelGroup[] = [];
  const panels: Panel[] = [];

  const defaultColors = [
    "#4682b4",
    "#32cd32",
    "#ff6347",
    "#ffd700",
    "#9370db",
    "#20b2aa",
    "#ff69b4",
    "#dc143c",
    "#00ced1",
    "#ffa500",
    "#00ff7f",
    "#4169e1",
    "#da70d6",
    "#ff4500",
    "#00fa9a",
    "#1e90ff",
    "#ff1493",
    "#00bfff",
    "#ff8c00",
    "#ff1493",
  ];

  const getUniqueColor = (groupIndex: number): string => {
    return defaultColors[groupIndex % defaultColors.length];
  };

  Object.entries(solarData.agrupaciones).forEach(
    ([groupId, points], groupIndex) => {
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
        color: getUniqueColor(groupIndex),
      };

      groups.push(group);
    },
  );

  return { groups, panels };
};

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

  getNextAvailableColor: () => {
    const state = get();
    const usedColors = new Set(state.groups.map((g) => g.color));
    const defaultColors = [
      "#4682b4",
      "#32cd32",
      "#ff6347",
      "#ffd700",
      "#9370db",
      "#20b2aa",
      "#ff69b4",
      "#dc143c",
      "#00ced1",
      "#ffa500",
      "#00ff7f",
      "#4169e1",
      "#da70d6",
      "#ff4500",
      "#00fa9a",
      "#1e90ff",
      "#ff1493",
      "#00bfff",
      "#ff8c00",
    ];

    for (const color of defaultColors) {
      if (!usedColors.has(color)) {
        return color;
      }
    }
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  },

  createGroup: (name: string, color: string, panelIds: string[]) => {
    const state = get();

    if (!name.trim())
      throw new Error("El nombre del grupo no puede estar vacío");
    if (!color) throw new Error("Debe seleccionar un color para el grupo");
    if (panelIds.length === 0)
      throw new Error("Debe seleccionar al menos un panel");

    const invalidPanels = panelIds.filter(
      (id) => !state.panels.find((p) => p.id === id),
    );
    if (invalidPanels.length > 0) {
      throw new Error(`Paneles no encontrados: ${invalidPanels.join(", ")}`);
    }

    const existingIds = state.groups.map((g) => g.id);
    let newGroupId = "1";

    for (let i = 1; i <= 1000; i++) {
      if (!existingIds.includes(i.toString())) {
        newGroupId = i.toString();
        break;
      }
    }

    const panelsToMove = state.panels.filter((p) => panelIds.includes(p.id));

    set((state) => {
      const newPanels = state.panels.map((panel) =>
        panelIds.includes(panel.id) ? { ...panel, groupId: newGroupId } : panel,
      );

      const updatedGroups = state.groups
        .map((group) => ({
          ...group,
          panels: group.panels.filter((panel) => !panelIds.includes(panel.id)),
        }))
        .filter((group) => group.panels.length > 0);

      const newGroup: PanelGroup = {
        id: newGroupId,
        name: name.trim(),
        color,
        panels: panelsToMove.map((panel) => ({
          ...panel,
          groupId: newGroupId,
        })),
        active: true,
      };

      return {
        panels: newPanels,
        groups: [...updatedGroups, newGroup],
      };
    });

    return newGroupId;
  },

  movePanel: (panelId: string, targetGroupId: string) => {
    get().movePanels([panelId], targetGroupId);
  },

  movePanels: (panelIds: string[], targetGroupId: string) => {
    const state = get();

    if (panelIds.length === 0)
      throw new Error("Debe seleccionar al menos un panel para mover");
    if (!targetGroupId) throw new Error("Debe especificar un grupo destino");

    const targetGroup = state.groups.find((g) => g.id === targetGroupId);
    if (!targetGroup)
      throw new Error(`Grupo destino ${targetGroupId} no encontrado`);

    const invalidPanels = panelIds.filter(
      (id) => !state.panels.find((p) => p.id === id),
    );
    if (invalidPanels.length > 0) {
      throw new Error(`Paneles no encontrados: ${invalidPanels.join(", ")}`);
    }

    set((state) => {
      const newPanels = state.panels.map((panel) =>
        panelIds.includes(panel.id)
          ? { ...panel, groupId: targetGroupId }
          : panel,
      );

      const newGroups = state.groups
        .map((group) => {
          if (group.id === targetGroupId) {
            const panelsToAdd = state.panels
              .filter((p) => panelIds.includes(p.id))
              .map((panel) => ({ ...panel, groupId: targetGroupId }));
            return {
              ...group,
              panels: [
                ...group.panels.filter((p) => !panelIds.includes(p.id)),
                ...panelsToAdd,
              ],
            };
          } else {
            return {
              ...group,
              panels: group.panels.filter(
                (panel) => !panelIds.includes(panel.id),
              ),
            };
          }
        })
        .filter((group) => group.panels.length > 0);

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });
  },

  moveGroup: (groupId: string, targetGroupId: string) => {
    const sourceGroup = get().groups.find((g) => g.id === groupId);
    if (sourceGroup) {
      const panelIds = sourceGroup.panels.map((p) => p.id);
      get().movePanels(panelIds, targetGroupId);
    }
  },

  deleteGroup: (groupId: string) => {
    const state = get();
    const groupToDelete = state.groups.find((g) => g.id === groupId);

    if (!groupToDelete) return;

    const defaultGroup = state.groups.find((g) => g.id === "1");
    const panelIds = groupToDelete.panels.map((p) => p.id);

    if (defaultGroup && groupId !== "1") {
      get().movePanels(panelIds, "1");
    } else {
      get().createGroup("Grupo 1", "#4682b4", panelIds);
    }
  },

  updateGroupName: (groupId: string, name: string) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, name } : group,
      ),
    }));
  },

  updateGroupColor: (groupId: string, color: string) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, color } : group,
      ),
    }));
  },

  updatePanelPosition: (panelId: string, position: Point) => {
    set((state) => {
      const newPanels = state.panels.map((panel) =>
        panel.id === panelId ? { ...panel, position } : panel,
      );

      const newGroups = state.groups.map((group) => ({
        ...group,
        panels: group.panels.map((panel) =>
          panel.id === panelId ? { ...panel, position } : panel,
        ),
      }));

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });
  },

  addPanel: (position: Point) => {
    const state = get();

    const existingIds = state.panels.map((p) => p.id);
    let newPanelId = `new-panel-${Date.now()}`;
    let counter = 1;
    while (existingIds.includes(newPanelId)) {
      newPanelId = `new-panel-${Date.now()}-${counter}`;
      counter++;
    }

    const newPanel: Panel = {
      id: newPanelId,
      name: `Panel ${newPanelId}`,
      active: true,
      groupId: "unassigned",
      position,
      index: state.panels.length,
    };

    let unassignedGroup = state.groups.find((g) => g.id === "unassigned");

    set((state) => {
      const newPanels = [...state.panels, newPanel];
      let newGroups = [...state.groups];

      if (!unassignedGroup) {
        unassignedGroup = {
          id: "unassigned",
          name: "Sin asignar",
          panels: [newPanel],
          active: true,
          color: "#ffffff",
        };
        newGroups.push(unassignedGroup);
      } else {
        newGroups = newGroups.map((group) =>
          group.id === "unassigned"
            ? { ...group, panels: [...group.panels, newPanel] }
            : group,
        );
      }

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });

    return newPanelId;
  },

  deletePanel: (panelId: string) => {
    get().deletePanels([panelId]);
  },

  deletePanels: (panelIds: string[]) => {
    const state = get();

    if (panelIds.length === 0) return;

    const invalidPanels = panelIds.filter(
      (id) => !state.panels.find((p) => p.id === id),
    );
    if (invalidPanels.length > 0) {
      return;
    }

    let deletedGroup = state.groups.find((g) => g.id === "-1");

    set((state) => {
      const newPanels = state.panels.map((panel) =>
        panelIds.includes(panel.id) ? { ...panel, groupId: "-1" } : panel,
      );

      let newGroups = [...state.groups];

      if (!deletedGroup) {
        deletedGroup = {
          id: "-1",
          name: "Paneles eliminados",
          panels: state.panels
            .filter((p) => panelIds.includes(p.id))
            .map((panel) => ({ ...panel, groupId: "-1" })),
          active: false,
          color: "#666666",
        };
        newGroups.push(deletedGroup);
      } else {
        newGroups = newGroups
          .map((group) => {
            if (group.id === "-1") {
              const panelsToAdd = state.panels
                .filter((p) => panelIds.includes(p.id))
                .map((panel) => ({ ...panel, groupId: "-1" }));
              return {
                ...group,
                panels: [
                  ...group.panels.filter((p) => !panelIds.includes(p.id)),
                  ...panelsToAdd,
                ],
              };
            } else {
              return {
                ...group,
                panels: group.panels.filter(
                  (panel) => !panelIds.includes(panel.id),
                ),
              };
            }
          })
          .filter((group) => group.id === "-1" || group.panels.length > 0);
      }

      return {
        panels: newPanels,
        groups: newGroups,
      };
    });
  },
}));

export const usePanels = () => {
  return useSolarPanelStore((state) => state.panels);
};

export const useGroups = () => {
  return useSolarPanelStore((state) => state.groups);
};

export const useActivePanels = () => {
  return useSolarPanelStore((state) =>
    state.panels.filter((panel) => panel.active),
  );
};

export const useInactivePanels = () => {
  return useSolarPanelStore((state) =>
    state.panels.filter((panel) => !panel.active),
  );
};

export const usePanelActive = (panelId: string) => {
  return useSolarPanelStore((state) => {
    const panel = state.panels.find((p) => p.id === panelId);
    return panel?.active ?? true;
  });
};

let panelStatesCache: {
  key: string;
  states: Record<string, boolean>;
} | null = null;

export const useAllPanelStates = () => {
  return useSolarPanelStore((state) => {
    const activePanelIds = state.panels
      .filter((p) => p.active)
      .map((p) => p.id)
      .sort()
      .join(",");
    const totalPanels = state.panels.length;
    const cacheKey = `${totalPanels}-${activePanelIds}`;

    if (panelStatesCache && panelStatesCache.key === cacheKey) {
      return panelStatesCache.states;
    }

    const panelStates: Record<string, boolean> = {};
    state.panels.forEach((panel) => {
      panelStates[panel.id] = panel.active;
    });

    panelStatesCache = {
      key: cacheKey,
      states: panelStates,
    };

    return panelStates;
  });
};

export const usePanel = (id: string) => {
  return useSolarPanelStore((state) => state.panels.find((p) => p.id === id));
};

let statsCache: {
  key: string;
  stats: {
    totalPanels: number;
    activePanels: number;
    inactivePanels: number;
    panelActivePercentage: number;
  };
} | null = null;

export const usePanelStats = () => {
  return useSolarPanelStore((state) => {
    const totalPanels = state.panels.length;
    const activePanels = state.panels.filter((p) => p.active).length;
    const inactivePanels = totalPanels - activePanels;
    const panelActivePercentage =
      totalPanels > 0 ? Math.round((activePanels / totalPanels) * 100) : 0;

    const cacheKey = `${totalPanels}-${activePanels}`;

    if (statsCache && statsCache.key === cacheKey) {
      return statsCache.stats;
    }

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

export const useGroup = (groupId: string) => {
  return useSolarPanelStore((state) =>
    state.groups.find((g) => g.id === groupId),
  );
};
