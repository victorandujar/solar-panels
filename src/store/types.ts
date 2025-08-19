import { Panel, PanelGroup } from "./useStore";

// Types para mejorar la tipificación de Zustand
export type SolarPanelState = {
  groups: PanelGroup[];
  panels: Panel[];

  // Actions
  disablePanels: (ids: string[]) => void;
  enablePanel: (id: string) => void;
  togglePanel: (id: string) => void;
  disableGroup: (groupId: string) => void;
  enableGroup: (groupId: string) => void;
  toggleGroup: (groupId: string) => void;
  initializePanels: () => void;
};

export type { Panel, PanelGroup, Point } from "./useStore";
