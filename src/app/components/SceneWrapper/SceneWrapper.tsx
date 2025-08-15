"use client";

import React from "react";
import { useSceneRegistration } from "../../hooks/useSceneRegistration";
import * as THREE from "three";

interface SceneWrapperProps {
  sceneId: string;
  viewport?: THREE.Vector4;
  children: React.ReactNode;
}

const SceneWrapper: React.FC<SceneWrapperProps> = ({
  sceneId,
  viewport,
  children,
}) => {
  useSceneRegistration({
    sceneId,
    viewport,
    enabled: true,
  });

  return <>{children}</>;
};

export default SceneWrapper;
