"use client";

import { useEffect, useRef } from "react";
import { useSceneContext } from "../context/SceneContext";
import { ReactNode } from "react";

interface SceneViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SceneData {
  content: ReactNode;
  viewport?: SceneViewport;
  cameraType?: "perspective" | "orthographic";
  cameraSettings?: any;
}

export function useRegisterScene(id: string, sceneData: SceneData) {
  const { registerScene, unregisterScene } = useSceneContext();

  // Usar useRef para mantener una referencia estable
  const sceneDataRef = useRef<SceneData>(sceneData);
  const lastIdRef = useRef<string | null>(null);

  // Actualizar la referencia cuando cambie sceneData
  useEffect(() => {
    sceneDataRef.current = sceneData;
  }, [sceneData]);

  useEffect(() => {
    // Registrar o actualizar la escena
    registerScene(id, sceneDataRef.current);
    lastIdRef.current = id;

    return () => {
      if (lastIdRef.current) {
        unregisterScene(lastIdRef.current);
        lastIdRef.current = null;
      }
    };
  }, [id, registerScene, unregisterScene]);
}

// Hook de conveniencia para escenas simples (compatibilidad hacia atrás)
export function useRegisterSimpleScene(id: string, content: ReactNode) {
  useRegisterScene(id, { content });
}
