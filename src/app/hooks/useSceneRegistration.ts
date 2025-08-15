"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  registerScene,
  unregisterScene,
  updateSceneViewport,
} from "../helpers/renderer";

interface UseSceneRegistrationOptions {
  sceneId: string;
  viewport?: THREE.Vector4;
  enabled?: boolean;
}

export function useSceneRegistration({
  sceneId,
  viewport,
  enabled = true,
}: UseSceneRegistrationOptions) {
  const { scene, camera } = useThree();
  const viewportRef = useRef(
    viewport ||
      new THREE.Vector4(
        0,
        0,
        typeof window !== "undefined" ? window.innerWidth : 1920,
        typeof window !== "undefined" ? window.innerHeight : 1080,
      ),
  );
  const enabledRef = useRef(enabled);

  useEffect(() => {
    if (viewport) {
      viewportRef.current = viewport;
    }
  }, [viewport]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabledRef.current) return;

    // Registrar la escena
    registerScene(sceneId, scene, camera, viewportRef.current);

    // Cleanup: desregistrar la escena
    return () => {
      unregisterScene(sceneId);
    };
  }, [sceneId, scene, camera]);

  // Función para actualizar el viewport
  const updateViewport = (newViewport: THREE.Vector4) => {
    viewportRef.current = newViewport;
    updateSceneViewport(sceneId, newViewport);
  };

  return { updateViewport };
}
