"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

interface VialProps {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  lineWidth?: number;
  animated?: boolean;
  opacity?: number;
  onClick?: (vialId: string) => void;
}

const Vial: React.FC<VialProps> = ({
  id,
  start,
  end,
  color,
  lineWidth = 2,
  animated = false,
  opacity = 1.0,
  onClick,
}) => {
  const { geometry, position, rotation, width } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);

    // Calcular el centro y la longitud
    const center = new THREE.Vector3()
      .addVectors(startVec, endVec)
      .multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const length = direction.length();

    // Calcular la rotación
    const up = new THREE.Vector3(0, 0, 1);
    direction.normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    // Crear geometría del vial (cilindro)
    const geometry = new THREE.CylinderGeometry(
      lineWidth / 2,
      lineWidth / 2,
      length,
      8,
    );

    return {
      geometry,
      position: [center.x, center.y, center.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      width: lineWidth,
    };
  }, [start, end, lineWidth]);

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <group>
      {/* Vial principal */}
      <mesh
        position={position}
        rotation={rotation}
        onClick={handleClick}
        userData={{ vialId: id, type: "vial" }}
      >
        <primitive object={geometry} />
        <meshBasicMaterial
          color={color}
          transparent={opacity < 1.0}
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Línea central para mejor visibilidad */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([...start, ...end]), 3]}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          linewidth={Math.max(1, lineWidth)}
          transparent={opacity < 1.0}
          opacity={Math.min(1.0, opacity + 0.2)}
        />
      </line>

      {/* Marcadores de inicio y fin */}
      <mesh position={start}>
        <sphereGeometry args={[lineWidth * 0.8, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent={opacity < 1.0}
          opacity={opacity}
        />
      </mesh>

      <mesh position={end}>
        <sphereGeometry args={[lineWidth * 0.8, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent={opacity < 1.0}
          opacity={opacity}
        />
      </mesh>

      {/* Indicador de animación si está activado */}
      {animated && (
        <mesh position={position}>
          <sphereGeometry args={[lineWidth * 1.5, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default Vial;
