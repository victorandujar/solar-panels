"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useSceneContext } from "../../context/SceneContext";

const ThreeCanvas: React.FC = () => {
  const { scenes } = useSceneContext();

  return (
    <Canvas
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "auto",
        zIndex: 0,
      }}
      eventSource={typeof window !== "undefined" ? document.body : undefined}
      eventPrefix="client"
    >
      {/* Renderizar todas las escenas registradas */}
      {Array.from(scenes.entries()).map(([sceneId, sceneData]) => {
        if (sceneData.domRef) {
          // Para escenas con domRef específico, usar View
          return (
            <View key={sceneId} index={1} track={sceneData.domRef}>
              {sceneData.content}
            </View>
          );
        } else {
          // Para escenas sin domRef específico (fullscreen)
          return (
            <React.Fragment key={sceneId}>{sceneData.content}</React.Fragment>
          );
        }
      })}
    </Canvas>
  );
};

export default ThreeCanvas;
