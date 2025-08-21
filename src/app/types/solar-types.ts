export interface Point {
  X: number;
  Y: number;
  Z: number;
}

export interface Agrupacion {
  [key: string]: Point[];
}

export interface SolarData {
  agrupaciones: Agrupacion;
  longitud: number;
  ancho: number;
  parcela: Point[];
  tilt: number;
}

export interface PanelData {
  groupId: string;
  panelId: string;
  position: { x: number; y: number; z: number };
  inclination: number;
  dimensions: { length: number; width: number };
}

export interface LegendItem {
  key: string;
  color: string;
  count: number;
}
