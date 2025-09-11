"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

interface TrenchProps {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  width: number;
  depth: number;
  color: string;
  opacity?: number;
  onClick?: (trenchId: string) => void;
}

const Trench: React.FC<TrenchProps> = ({
  id,
  start,
  end,
  width,
  depth,
  color,
  opacity = 0.8,
  onClick,
}) => {
  const { geometry, position, rotation, length } = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);

    // Calcular el centro, longitud y dirección
    const center = new THREE.Vector3()
      .addVectors(startVec, endVec)
      .multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const length = direction.length();

    // Ajustar la posición Y para que la zanja esté por debajo del nivel del suelo
    center.z -= depth / 2;

    // Calcular la rotación para alinear con la dirección
    direction.normalize();
    const up = new THREE.Vector3(1, 0, 0); // Orientación a lo largo del eje X
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    // Crear geometría de la zanja (caja rectangular)
    const geometry = new THREE.BoxGeometry(length, width, depth);

    return {
      geometry,
      position: [center.x, center.y, center.z] as [number, number, number],
      rotation: [euler.x, euler.y, euler.z] as [number, number, number],
      length,
    };
  }, [start, end, width, depth]);

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (onClick) {
      onClick(id);
    }
  };

  // Crear contorno de la zanja
  const trenchOutline = useMemo(() => {
    const startVec = new THREE.Vector3(...start);
    const endVec = new THREE.Vector3(...end);
    const direction = new THREE.Vector3()
      .subVectors(endVec, startVec)
      .normalize();
    const perpendicular = new THREE.Vector3(
      -direction.y,
      direction.x,
      0,
    ).normalize();

    // Puntos de los bordes de la zanja
    const halfWidth = width / 2;
    const edge1Start = startVec
      .clone()
      .add(perpendicular.clone().multiplyScalar(halfWidth));
    const edge1End = endVec
      .clone()
      .add(perpendicular.clone().multiplyScalar(halfWidth));
    const edge2Start = startVec
      .clone()
      .add(perpendicular.clone().multiplyScalar(-halfWidth));
    const edge2End = endVec
      .clone()
      .add(perpendicular.clone().multiplyScalar(-halfWidth));

    return [
      // Bordes de la zanja
      edge1Start.toArray(),
      edge1End.toArray(),
      edge2Start.toArray(),
      edge2End.toArray(),
      // Líneas transversales
      edge1Start.toArray(),
      edge2Start.toArray(),
      edge1End.toArray(),
      edge2End.toArray(),
    ].flat();
  }, [start, end, width]);

  return (
    <group>
      {/* Zanja principal */}
      <mesh
        position={position}
        rotation={rotation}
        onClick={handleClick}
        userData={{ trenchId: id, type: "trench" }}
      >
        <primitive object={geometry} />
        <meshLambertMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Contorno de la zanja para mejor visibilidad */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(trenchOutline), 3]}
            count={trenchOutline.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          linewidth={2}
          transparent
          opacity={Math.min(1.0, opacity + 0.3)}
        />
      </line>

      {/* Marcadores de profundidad en los extremos */}
      <group>
        {/* Inicio */}
        <mesh position={[start[0], start[1], start[2] - depth]}>
          <cylinderGeometry args={[0.2, 0.2, depth, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity * 0.7}
          />
        </mesh>

        {/* Fin */}
        <mesh position={[end[0], end[1], end[2] - depth]}>
          <cylinderGeometry args={[0.2, 0.2, depth, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity * 0.7}
          />
        </mesh>
      </group>

      {/* Etiqueta de información */}
      <group position={position}>
        <mesh position={[0, 0, depth / 2 + 1]}>
          <planeGeometry args={[4, 1]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
        {/* Aquí podrías agregar texto 3D con la información de la zanja */}
      </group>
    </group>
  );
};

export default Trench;
