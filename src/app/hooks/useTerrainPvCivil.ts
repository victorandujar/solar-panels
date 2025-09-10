"use client";

import { useState, useEffect, useMemo } from "react";

interface TerrainData {
  data: string;
  totalLines: number;
  renderedLines: number;
}

interface UseTerrainPvCivilReturn {
  terrainData: string;
  isLoading: boolean;
  error: string | null;
  wireframe: boolean;
  showTexture: boolean;
  scale: number;
  heightFactor: number;
  triangleCount: number;
  digitalMode: boolean;
  setWireframe: (wireframe: boolean) => void;
  setShowTexture: (showTexture: boolean) => void;
  setScale: (scale: number) => void;
  setHeightFactor: (heightFactor: number) => void;
  setDigitalMode: (digitalMode: boolean) => void;
  reloadTerrain: () => Promise<void>;
}

export const useTerrainPvCivil = (): UseTerrainPvCivilReturn => {
  const [terrainData, setTerrainData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [showTexture, setShowTexture] = useState(true);
  const [scale, setScale] = useState(0.1);
  const [heightFactor, setHeightFactor] = useState(19);
  const [digitalMode, setDigitalMode] = useState(false);

  const triangleCount = useMemo(() => {
    if (!terrainData) return 0;
    return terrainData.split("\n").filter((line) => line.trim()).length;
  }, [terrainData]);

  const loadTerrainData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/terrain-data");
      if (response.ok) {
        const result: TerrainData = await response.json();
        setTerrainData(result.data);
      } else {
        throw new Error(`Error HTTP: ${response.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      // No cargar datos de ejemplo, solo mostrar error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTerrainData();
  }, []);

  return {
    terrainData,
    isLoading,
    error,
    wireframe,
    showTexture,
    scale,
    heightFactor,
    triangleCount,
    digitalMode,
    setWireframe,
    setShowTexture,
    setScale,
    setHeightFactor,
    setDigitalMode,
    reloadTerrain: loadTerrainData,
  };
};
