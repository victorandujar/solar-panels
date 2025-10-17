"use client";

import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface AdaptiveOrthographicCameraProps {
  position: [number, number, number];
  scale?: number; // Factor de escala para ajustar el tamaño visual
}

const AdaptiveOrthographicCamera: React.FC<AdaptiveOrthographicCameraProps> = ({
  position,
  scale = 100, // Valor por defecto que controla cuánto se ve
}) => {
  const { size, set } = useThree();
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  useEffect(() => {
    // Calcular aspecto del viewport
    const aspect = size.width / size.height;

    // Calcular límites de la cámara ortográfica con el factor de escala
    // Aumentamos el height MUCHO más para estirar verticalmente y dar más espaciado
    const frustumHeight = scale * 0.6; // Multiplicador para estirar verticalmente (mayor = más alto)
    const frustumWidth = scale * aspect; // Ancho basado en scale original

    // Si ya existe la cámara, solo actualizar sus parámetros
    if (cameraRef.current) {
      cameraRef.current.left = -frustumWidth / 2;
      cameraRef.current.right = frustumWidth / 2;
      cameraRef.current.top = frustumHeight / 2;
      cameraRef.current.bottom = -frustumHeight / 2;
      cameraRef.current.position.set(position[0], position[1], position[2]);
      cameraRef.current.updateProjectionMatrix();
    } else {
      // Crear cámara ortográfica con límites personalizados
      const orthoCamera = new THREE.OrthographicCamera(
        -frustumWidth / 2, // left
        frustumWidth / 2, // right
        frustumHeight / 2, // top - aumentado para más espacio vertical
        -frustumHeight / 2, // bottom - aumentado para más espacio vertical
        0.1, // near
        10000, // far
      );

      // Posicionar la cámara
      orthoCamera.position.set(position[0], position[1], position[2]);
      orthoCamera.lookAt(0, 0, 0);
      orthoCamera.updateProjectionMatrix();

      cameraRef.current = orthoCamera;

      // Establecer como cámara activa SOLO la primera vez
      set({ camera: orthoCamera });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position[0], position[1], position[2], scale, size.width, size.height]);

  return null; // Este componente no renderiza nada, solo gestiona la cámara
};

export default AdaptiveOrthographicCamera;
