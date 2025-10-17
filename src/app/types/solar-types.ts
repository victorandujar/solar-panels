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

// Tipos para configuración de controles y snap
export interface SnapConfig {
  /** Radio de atracción magnética en unidades de longitud de placa */
  magneticThresholdMultiplier: number;
  /** Tolerancia para detectar filas alineadas en mm */
  rowTolerance: number;
  /** Número de decimales para redondear posiciones */
  decimalPrecision: number;
  /** Número máximo de extensiones de columna a generar */
  maxColumnExtensions: number;
}

export interface MouseControlsConfig {
  /** Activar controles del ratón mejorados */
  enabled: boolean;
  /** Velocidad del pan de cámara con botón derecho */
  panSpeed: number;
  /** Velocidad del zoom con rueda del ratón */
  zoomSpeed: number;
  /** Suavizado del movimiento de cámara */
  dampingFactor: number;
}

export interface EditModeConfig {
  /** Configuración de snap magnético */
  snap: SnapConfig;
  /** Configuración de controles del ratón */
  mouseControls: MouseControlsConfig;
}
