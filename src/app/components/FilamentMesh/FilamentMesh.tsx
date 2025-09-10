"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";

interface FilamentMeshProps {
  size?: number;
  density?: number;
  height?: number;
  opacity?: number;
  color?: string;
}

const FilamentMesh: React.FC<FilamentMeshProps> = ({
  size = 50,
  density = 0.5,
  height = -2,
  opacity = 0.3,
  color = "#4a90e2",
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const filamentGeometry = useMemo(() => {
    const filaments: THREE.BufferGeometry[] = [];
    const numFilaments = Math.floor(size * size * density);

    for (let i = 0; i < numFilaments; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(
          (Math.random() - 0.5) * size,
          height,
          (Math.random() - 0.5) * size,
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * size * 0.8,
          height + Math.random() * 0.5,
          (Math.random() - 0.5) * size * 0.8,
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * size * 0.6,
          height + Math.random() * 0.3,
          (Math.random() - 0.5) * size * 0.6,
        ),
        new THREE.Vector3(
          (Math.random() - 0.5) * size * 0.4,
          height + Math.random() * 0.2,
          (Math.random() - 0.5) * size * 0.4,
        ),
      ]);

      const points = curve.getPoints(20);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      filaments.push(geometry);
    }

    return filaments;
  }, [size, density, height]);

  const supportStructure = useMemo(() => {
    const structureLines: THREE.BufferGeometry[] = [];
    const supportHeight = 4;
    const baseLevel = height - supportHeight;
    const gridSpacing = size / 8;

    const supportNodes: THREE.Vector3[] = [];
    const gridSize = Math.floor(size / gridSpacing);

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        for (let level = 0; level < 3; level++) {
          const x = i * gridSpacing;
          const z = j * gridSpacing;
          const y = baseLevel - level * (supportHeight / 3);

          const variation = 0.5;
          supportNodes.push(
            new THREE.Vector3(
              x + (Math.random() - 0.5) * variation,
              y + (Math.random() - 0.5) * variation * 0.5,
              z + (Math.random() - 0.5) * variation,
            ),
          );
        }
      }
    }

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j < gridSize; j++) {
        for (let level = 0; level < 3; level++) {
          const start = new THREE.Vector3(
            i * gridSpacing,
            baseLevel - level * (supportHeight / 3),
            j * gridSpacing,
          );
          const end = new THREE.Vector3(
            i * gridSpacing,
            baseLevel - level * (supportHeight / 3),
            (j + 1) * gridSpacing,
          );

          const points = [start, end];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          structureLines.push(geometry);
        }
      }
    }

    for (let i = -gridSize; i < gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        for (let level = 0; level < 3; level++) {
          const start = new THREE.Vector3(
            i * gridSpacing,
            baseLevel - level * (supportHeight / 3),
            j * gridSpacing,
          );
          const end = new THREE.Vector3(
            (i + 1) * gridSpacing,
            baseLevel - level * (supportHeight / 3),
            j * gridSpacing,
          );

          const points = [start, end];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          structureLines.push(geometry);
        }
      }
    }

    for (let i = -gridSize; i <= gridSize; i += 2) {
      for (let j = -gridSize; j <= gridSize; j += 2) {
        const bottom = new THREE.Vector3(
          i * gridSpacing,
          baseLevel - supportHeight,
          j * gridSpacing,
        );
        const top = new THREE.Vector3(
          i * gridSpacing,
          height - 0.5,
          j * gridSpacing,
        );

        const points = [bottom, top];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        structureLines.push(geometry);
      }
    }

    for (let i = -gridSize; i < gridSize; i += 3) {
      for (let j = -gridSize; j < gridSize; j += 3) {
        const start1 = new THREE.Vector3(
          i * gridSpacing,
          baseLevel - supportHeight / 2,
          j * gridSpacing,
        );
        const end1 = new THREE.Vector3(
          (i + 3) * gridSpacing,
          baseLevel - supportHeight / 2,
          (j + 3) * gridSpacing,
        );

        const start2 = new THREE.Vector3(
          (i + 3) * gridSpacing,
          baseLevel - supportHeight / 2,
          j * gridSpacing,
        );
        const end2 = new THREE.Vector3(
          i * gridSpacing,
          baseLevel - supportHeight / 2,
          (j + 3) * gridSpacing,
        );

        const diag1 = new THREE.BufferGeometry().setFromPoints([start1, end1]);
        const diag2 = new THREE.BufferGeometry().setFromPoints([start2, end2]);
        structureLines.push(diag1, diag2);
      }
    }

    return structureLines;
  }, [size, height]);

  const blackMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: opacity * 0.8,
      linewidth: 1,
    });
  }, [opacity]);

  const thickBlackMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: opacity * 0.6,
      linewidth: 2,
    });
  }, [opacity]);

  return (
    <group ref={groupRef}>
      {supportStructure.map((geometry, index) => (
        <primitive
          key={`support-beam-${index}`}
          object={
            new THREE.Line(
              geometry,
              index % 8 === 0 ? thickBlackMaterial : blackMaterial,
            )
          }
        />
      ))}

      <points>
        <bufferGeometry>
          <bufferAttribute
            args={[
              new Float32Array(
                Array.from({ length: Math.floor(size) * 3 }, (_, i) => {
                  const gridSpacing = size / 8;
                  const gridSize = Math.floor(size / gridSpacing);

                  if (i % 3 === 0)
                    return (
                      (((i / 3) % (gridSize * 2 + 1)) - gridSize) * gridSpacing
                    );
                  if (i % 3 === 1) return height - 2 - Math.random() * 2; // y
                  return (
                    (Math.floor(i / 3 / (gridSize * 2 + 1)) - gridSize) *
                    gridSpacing
                  );
                }).flat(),
              ),
              3,
            ]}
            attach="attributes-position"
          />
        </bufferGeometry>
        <pointsMaterial
          color={0x333333}
          size={0.08}
          transparent
          opacity={opacity * 0.7}
        />
      </points>
    </group>
  );
};

export default FilamentMesh;
