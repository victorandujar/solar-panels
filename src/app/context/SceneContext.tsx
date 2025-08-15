"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";

interface SceneViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SceneData {
  content: ReactNode;
  domRef?: React.RefObject<HTMLDivElement>;
  cameraType?: "perspective" | "orthographic";
  cameraSettings?: any;
}

interface SceneContextType {
  scenes: Map<string, SceneData>;
  registerScene: (id: string, sceneData: SceneData) => void;
  unregisterScene: (id: string) => void;
  updateSceneDomRef: (
    id: string,
    domRef: React.RefObject<HTMLDivElement>,
  ) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const useSceneContext = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error("useSceneContext must be used within SceneProvider");
  }
  return context;
};

export const SceneProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [scenes, setScenes] = React.useState<Map<string, SceneData>>(new Map());

  const registerScene = useCallback((id: string, sceneData: SceneData) => {
    setScenes((prev) => {
      // Solo actualizar si el contenido realmente cambió
      if (prev.has(id) && prev.get(id) === sceneData) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.set(id, sceneData);
      return newMap;
    });
  }, []);

  const unregisterScene = useCallback((id: string) => {
    setScenes((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const updateSceneDomRef = useCallback(
    (id: string, domRef: React.RefObject<HTMLDivElement>) => {
      setScenes((prev) => {
        const existing = prev.get(id);
        if (!existing) return prev;

        const newMap = new Map(prev);
        newMap.set(id, { ...existing, domRef });
        return newMap;
      });
    },
    [],
  );

  const contextValue = React.useMemo(
    () => ({
      scenes,
      registerScene,
      unregisterScene,
      updateSceneDomRef,
    }),
    [scenes, registerScene, unregisterScene, updateSceneDomRef],
  );

  return (
    <SceneContext.Provider value={contextValue}>
      {children}
    </SceneContext.Provider>
  );
};
