"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";

interface TerrainPvCivilV2Props {
  terrainData: string;
  scale?: number;
  heightFactor?: number;
  wireframe?: boolean;
  showTexture?: boolean;
}

const TerrainPvCivilV2: React.FC<TerrainPvCivilV2Props> = ({
  terrainData,
  scale = 0.1,
  heightFactor = 19,
  wireframe = false,
  showTexture = true,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { geometry, material } = useMemo(() => {
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

    const resolution = Math.max(128, Math.ceil(Math.sqrt(points.length / 2)));
    const geom = new THREE.PlaneGeometry(
      (maxX - minX) * scale,
      (maxY - minY) * scale,
      resolution,
      resolution,
    );

    const positions = geom.attributes.position.array as Float32Array;
    const finalHeightFactor = heightRange > 0 ? heightFactor : 1;

    for (let i = 0; i < positions.length; i += 3) {
      const localX = positions[i];
      const localY = positions[i + 1];

      const worldX = localX / scale + centerX;
      const worldY = localY / scale + centerY;

      let weightedSum = 0;
      let totalWeight = 0;
      const maxInfluenceDistance = (maxX - minX) * 0.1;

      points.forEach((point) => {
        const distance = Math.sqrt(
          Math.pow(point.x - worldX, 2) + Math.pow(point.y - worldY, 2),
        );

        if (distance < maxInfluenceDistance) {
          const weight = distance === 0 ? 1000000 : 1 / Math.pow(distance, 2);
          weightedSum += point.z * weight;
          totalWeight += weight;
        }
      });

      if (totalWeight === 0) {
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
      } else {
        const interpolatedZ = weightedSum / totalWeight;
        positions[i + 2] =
          (interpolatedZ - centerZ) * scale * finalHeightFactor;
      }
    }

    geom.attributes.position.needsUpdate = true;
    geom.computeVertexNormals();
    geom.rotateX(-Math.PI / 2);

    let mat: THREE.Material;

    if (wireframe) {
      mat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
      });
    } else if (showTexture) {
      const canvas = document.createElement("canvas");
      canvas.width = 2048;
      canvas.height = 2048;
      const context = canvas.getContext("2d")!;

      const mountainGradient = context.createRadialGradient(
        1024,
        1024,
        0,
        1024,
        1024,
        1024,
      );
      mountainGradient.addColorStop(0, "#E8D5B7");
      mountainGradient.addColorStop(0.2, "#D2C4A0");
      mountainGradient.addColorStop(0.4, "#C5B088");
      mountainGradient.addColorStop(0.6, "#B59C7A");
      mountainGradient.addColorStop(0.8, "#A08668");
      mountainGradient.addColorStop(1, "#8B7355");

      context.fillStyle = mountainGradient;
      context.fillRect(0, 0, 2048, 2048);

      for (let i = 0; i < 120; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        const size = Math.random() * 80 + 20;

        const rockType = Math.random();
        let rockColor;
        if (rockType < 0.3) {
          rockColor = `rgba(${140 + Math.random() * 25}, ${135 + Math.random() * 20}, ${130 + Math.random() * 15}, ${0.6 + Math.random() * 0.3})`;
        } else if (rockType < 0.6) {
          rockColor = `rgba(${155 + Math.random() * 30}, ${125 + Math.random() * 20}, ${100 + Math.random() * 15}, ${0.5 + Math.random() * 0.3})`;
        } else {
          rockColor = `rgba(${110 + Math.random() * 20}, ${105 + Math.random() * 15}, ${100 + Math.random() * 12}, ${0.7 + Math.random() * 0.2})`;
        }

        context.fillStyle = rockColor;

        context.beginPath();
        const sides = 6 + Math.floor(Math.random() * 6);
        for (
          let angle = 0;
          angle < Math.PI * 2;
          angle += (Math.PI * 2) / sides
        ) {
          const radius = size * (0.6 + Math.random() * 0.8);
          const px = x + Math.cos(angle + Math.random() * 0.5) * radius;
          const py = y + Math.sin(angle + Math.random() * 0.5) * radius;
          if (angle === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        context.closePath();
        context.fill();
      }

      for (let i = 0; i < 30; i++) {
        const startX = Math.random() * 2048;
        const startY = Math.random() * 1024;
        const endX = startX + (Math.random() - 0.5) * 400;
        const endY = startY + 800 + Math.random() * 400;

        context.strokeStyle = `rgba(${120 + Math.random() * 20}, ${100 + Math.random() * 15}, ${80 + Math.random() * 10}, 0.4)`;
        context.lineWidth = 2 + Math.random() * 4;
        context.beginPath();
        context.moveTo(startX, startY);

        const steps = 15;
        for (let step = 1; step <= steps; step++) {
          const t = step / steps;
          const x =
            startX + (endX - startX) * t + Math.sin(t * Math.PI * 3) * 30;
          const y = startY + (endY - startY) * t + (Math.random() - 0.5) * 20;
          context.lineTo(x, y);
        }
        context.stroke();
      }

      for (let i = 0; i < 80; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        const size = Math.random() * 60 + 15;

        const vegType = Math.random();
        let vegColor;
        if (vegType < 0.4) {
          vegColor = `rgba(${140 + Math.random() * 20}, ${130 + Math.random() * 15}, ${90 + Math.random() * 10}, 0.2)`;
        } else if (vegType < 0.7) {
          vegColor = `rgba(${110 + Math.random() * 15}, ${120 + Math.random() * 15}, ${85 + Math.random() * 10}, 0.15)`;
        } else {
          vegColor = `rgba(${130 + Math.random() * 15}, ${115 + Math.random() * 12}, ${85 + Math.random() * 8}, 0.18)`;
        }

        context.fillStyle = vegColor;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();

        for (let j = 0; j < size / 4; j++) {
          const vegX = x + (Math.random() - 0.5) * size;
          const vegY = y + (Math.random() - 0.5) * size;
          context.fillStyle = `rgba(${120 + Math.random() * 25}, ${125 + Math.random() * 20}, ${90 + Math.random() * 15}, 0.3)`;
          context.fillRect(vegX, vegY, 1, 2);
        }
      }

      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        const size = Math.random() * 120 + 40;

        const soilType = Math.random();
        let soilColor;
        if (soilType < 0.3) {
          soilColor = `rgba(${160 + Math.random() * 20}, ${130 + Math.random() * 15}, ${100 + Math.random() * 10}, 0.25)`;
        } else if (soilType < 0.6) {
          soilColor = `rgba(${180 + Math.random() * 25}, ${165 + Math.random() * 20}, ${140 + Math.random() * 15}, 0.2)`;
        } else {
          soilColor = `rgba(${120 + Math.random() * 15}, ${110 + Math.random() * 12}, ${90 + Math.random() * 8}, 0.3)`;
        }

        context.fillStyle = soilColor;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
      }

      const imageData = context.getImageData(0, 0, 2048, 2048);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % 2048;
        const y = Math.floor(i / 4 / 2048);

        const microNoise = (Math.random() - 0.5) * 4;
        const organicVariation = Math.sin(x * 0.003) * Math.cos(y * 0.003) * 2;
        const geologicalPattern = Math.sin(x * 0.001) * Math.cos(y * 0.001) * 3;
        const erosionEffect = Math.sin(x * 0.008 + y * 0.005) * 1.5;

        const totalVariation =
          microNoise + organicVariation + geologicalPattern + erosionEffect;

        data[i] = Math.max(0, Math.min(255, data[i] + totalVariation));
        data[i + 1] = Math.max(
          0,
          Math.min(255, data[i + 1] + totalVariation * 0.96),
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, data[i + 2] + totalVariation * 0.92),
        );

        if (Math.random() > 0.9995) {
          data[i] = Math.min(255, data[i] + 35);
          data[i + 1] = Math.min(255, data[i + 1] + 32);
          data[i + 2] = Math.min(255, data[i + 2] + 28);
        }

        if (Math.random() > 0.997) {
          data[i] = Math.max(0, data[i] - 25);
          data[i + 1] = Math.max(0, data[i + 1] - 20);
          data[i + 2] = Math.max(0, data[i + 2] - 18);
        }

        if (Math.random() > 0.996) {
          data[i] = Math.min(255, data[i] + 15);
          data[i + 1] = Math.max(0, data[i + 1] - 5);
          data[i + 2] = Math.max(0, data[i + 2] - 8);
        }
      }

      context.putImageData(imageData, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 16;

      const normalCanvas = document.createElement("canvas");
      normalCanvas.width = 1024;
      normalCanvas.height = 1024;
      const normalContext = normalCanvas.getContext("2d")!;

      for (let x = 0; x < 1024; x++) {
        for (let y = 0; y < 1024; y++) {
          const mountainScale = Math.sin(x * 0.008) * Math.cos(y * 0.008) * 0.4;
          const ridgeScale = Math.sin(x * 0.025) * Math.cos(y * 0.025) * 0.25;
          const rockScale = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.15;
          const erosionScale = Math.sin(x * 0.15) * Math.cos(y * 0.15) * 0.1;
          const microScale = Math.sin(x * 0.4) * Math.cos(y * 0.4) * 0.05;
          const noise = (Math.random() - 0.5) * 0.08;

          const totalHeight =
            mountainScale +
            ridgeScale +
            rockScale +
            erosionScale +
            microScale +
            noise +
            0.5;

          const heightL =
            Math.sin((x - 1) * 0.008) * Math.cos(y * 0.008) * 0.4 +
            Math.sin((x - 1) * 0.025) * Math.cos(y * 0.025) * 0.25 +
            Math.sin((x - 1) * 0.08) * Math.cos(y * 0.08) * 0.15 +
            0.5;

          const heightR =
            Math.sin((x + 1) * 0.008) * Math.cos(y * 0.008) * 0.4 +
            Math.sin((x + 1) * 0.025) * Math.cos(y * 0.025) * 0.25 +
            Math.sin((x + 1) * 0.08) * Math.cos(y * 0.08) * 0.15 +
            0.5;

          const heightU =
            Math.sin(x * 0.008) * Math.cos((y - 1) * 0.008) * 0.4 +
            Math.sin(x * 0.025) * Math.cos((y - 1) * 0.025) * 0.25 +
            Math.sin(x * 0.08) * Math.cos((y - 1) * 0.08) * 0.15 +
            0.5;

          const heightD =
            Math.sin(x * 0.008) * Math.cos((y + 1) * 0.008) * 0.4 +
            Math.sin(x * 0.025) * Math.cos((y + 1) * 0.025) * 0.25 +
            Math.sin(x * 0.08) * Math.cos((y + 1) * 0.08) * 0.15 +
            0.5;

          const dx = (heightR - heightL) * 2;
          const dy = (heightD - heightU) * 2;

          const r = Math.floor(128 + dx * 100);
          const g = Math.floor(128 + dy * 100);
          const b = Math.floor(200 + totalHeight * 55);

          normalContext.fillStyle = `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
          normalContext.fillRect(x, y, 1, 1);
        }
      }

      const normalTexture = new THREE.CanvasTexture(normalCanvas);
      normalTexture.wrapS = THREE.RepeatWrapping;
      normalTexture.wrapT = THREE.RepeatWrapping;
      normalTexture.repeat.set(10, 10);

      mat = new THREE.MeshPhongMaterial({
        map: texture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.4, 0.4),
        shininess: 1,
        specular: new THREE.Color(0x0a0a0a),
        bumpScale: 0.015,
        transparent: false,
        opacity: 1.0,
      });
    } else {
      mat = new THREE.MeshLambertMaterial({
        color: 0x8b7355,
      });
    }

    return { geometry: geom, material: mat };
  }, [terrainData, scale, heightFactor, wireframe, showTexture]);

  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        receiveShadow
        castShadow
      />
    </group>
  );
};

export default TerrainPvCivilV2;
