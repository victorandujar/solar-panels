"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";

interface DigitalTerrainProps {
  terrainData: string;
  scale?: number;
  heightFactor?: number;
}

const DigitalTerrain: React.FC<DigitalTerrainProps> = ({
  terrainData,
  scale = 0.1,
  heightFactor = 19,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, material } = useMemo(() => {
    // Procesar datos para modo digital
    const lines = terrainData.split("\n").filter((line) => line.trim());
    const pointsMap = new Map<string, { x: number; y: number; z: number }>();

    lines.forEach((line) => {
      const vertexStrings = line.split("|");
      if (vertexStrings.length === 3) {
        vertexStrings.forEach((vertexStr) => {
          const coords = vertexStr.split(";");
          if (coords.length === 3) {
            const x = parseFloat(coords[0].replace(",", "."));
            const y = parseFloat(coords[1].replace(",", "."));
            const z = parseFloat(coords[2].replace(",", "."));

            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
              const key = `${x.toFixed(2)},${y.toFixed(2)}`;
              pointsMap.set(key, { x, y, z });
            }
          }
        });
      }
    });

    const points = Array.from(pointsMap.values());

    if (points.length === 0) {
      return {
        geometry: new THREE.BufferGeometry(),
        material: new THREE.MeshBasicMaterial(),
      };
    }

    // Calcular límites
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    let minZ = Infinity,
      maxZ = -Infinity;

    points.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const heightRange = maxZ - minZ;

    // Crear geometría wireframe con más resolución para el efecto digital
    const resolution = 64;
    const geom = new THREE.PlaneGeometry(
      (maxX - minX) * scale,
      (maxY - minY) * scale,
      resolution,
      resolution,
    );

    // Interpolar alturas
    const positions = geom.attributes.position.array as Float32Array;
    const finalHeightFactor = heightRange > 0 ? heightFactor : 1;

    for (let i = 0; i < positions.length; i += 3) {
      const localX = positions[i];
      const localY = positions[i + 1];
      const worldX = localX / scale + centerX;
      const worldY = localY / scale + centerY;

      let closestZ = centerZ;
      let minDistance = Infinity;

      points.forEach((point) => {
        const distance = Math.sqrt(
          Math.pow(point.x - worldX, 2) + Math.pow(point.y - worldY, 2),
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestZ = point.z;
        }
      });

      positions[i + 2] = (closestZ - centerZ) * scale * finalHeightFactor;
    }

    geom.attributes.position.needsUpdate = true;
    geom.computeVertexNormals();
    geom.rotateX(-Math.PI / 2);

    // Material wireframe estilo retro-futurista
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });

    return { geometry: geom, material: mat };
  }, [terrainData, scale, heightFactor]);

  return (
    <group>
      {/* Iluminación cyber mejorada */}
      <ambientLight intensity={0.3} color={0x0066ff} />
      <directionalLight
        position={[10, 30, 5]}
        intensity={0.8}
        color={0x00ffff}
      />

      {/* Terreno wireframe principal - estilo retro-futurista */}
      <mesh ref={meshRef} geometry={geometry} material={material} />

      {/* Grid del suelo infinito mejorado */}
      <gridHelper args={[120, 60, 0x00ffff, 0x0033aa]} position={[0, -6, 0]} />

      {/* Grid secundario más denso */}
      <gridHelper
        args={[60, 120, 0x00aaff, 0x002288]}
        position={[0, -5.8, 0]}
      />

      {/* Sol cyber más alto y brillante */}
      <mesh position={[0, 25, -40]}>
        <sphereGeometry args={[5, 20, 10]} />
        <meshBasicMaterial
          color={0x00ffff}
          wireframe={true}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Rayos del sol más dramáticos */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const length = 8;

        return (
          <mesh
            key={`sun-ray-${i}`}
            position={[
              Math.cos(angle) * length,
              25 + Math.sin(angle) * length * 0.3,
              -40,
            ]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.08, length * 2.5, 0.08]} />
            <meshBasicMaterial color={0x00ffff} transparent opacity={0.6} />
          </mesh>
        );
      })}

      {/* Partículas cyber flotantes mejoradas */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            args={[
              new Float32Array(
                Array.from({ length: 450 }, (_, i) => {
                  if (i % 3 === 0) return (Math.random() - 0.5) * 100; // x
                  if (i % 3 === 1) return Math.random() * 30 + 2; // y
                  return (Math.random() - 0.5) * 80 - 20; // z
                }),
              ),
              3,
            ]}
            attach="attributes-position"
          />
        </bufferGeometry>
        <pointsMaterial
          color={0x00ffff}
          size={0.15}
          transparent
          opacity={0.8}
        />
      </points>

      {/* Líneas de datos digitales flotantes */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = (i - 4) * 12;
        const height = 15 + Math.random() * 10;

        return (
          <mesh key={`data-line-${i}`} position={[x, height, -25]}>
            <boxGeometry args={[0.1, height * 2, 0.1]} />
            <meshBasicMaterial
              color={0x00aaff}
              transparent
              opacity={0.4 + Math.random() * 0.3}
            />
          </mesh>
        );
      })}

      {/* Anillos de energía digital */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh
          key={`energy-ring-${i}`}
          position={[0, -4 + i * 3, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[10 + i * 5, 11 + i * 5, 32]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? 0x00ffff : 0x0088ff}
            transparent
            opacity={0.4 - i * 0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Pulsos de energía verticales */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <mesh key={`energy-pulse-${i}`} position={[x, 0, z]}>
            <cylinderGeometry args={[0.1, 0.1, 25]} />
            <meshBasicMaterial color={0x00ffff} transparent opacity={0.3} />
          </mesh>
        );
      })}

      {/* Reflejos cyber en el suelo */}
      <mesh position={[0, -5.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial color={0x001a33} transparent opacity={0.2} />
      </mesh>

      {/* Efectos de brillo adicionales */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            args={[
              new Float32Array(
                Array.from({ length: 150 }, (_, i) => {
                  if (i % 3 === 0) return (Math.random() - 0.5) * 60; // x
                  if (i % 3 === 1) return Math.random() * 5 + 15; // y (más alto)
                  return (Math.random() - 0.5) * 40 - 30; // z
                }),
              ),
              3,
            ]}
            attach="attributes-position"
          />
        </bufferGeometry>
        <pointsMaterial color={0xffffff} size={0.3} transparent opacity={0.6} />
      </points>
    </group>
  );
};

export default DigitalTerrain;
