import { Panel, PanelGroup } from "./useStore";

// Types para mejorar la tipificación de Zustand
export type SolarPanelState = {
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

  // New group management actions
  createGroup: (name: string, color: string, panelIds: string[]) => string;
  movePanel: (panelId: string, targetGroupId: string) => void;
  movePanels: (panelIds: string[], targetGroupId: string) => void;
  moveGroup: (groupId: string, targetGroupId: string) => void;
  deleteGroup: (groupId: string) => void;
  updateGroupName: (groupId: string, name: string) => void;
  updateGroupColor: (groupId: string, color: string) => void;
};

export type { Panel, PanelGroup, Point } from "./useStore";
