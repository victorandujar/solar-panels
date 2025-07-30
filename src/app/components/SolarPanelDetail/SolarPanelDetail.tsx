"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface SolarPanelDetailProps {
  panelData: {
    position: { x: number; y: number; z: number };
    inclination: number;
    groupId: string;
    panelId: string;
    dimensions: { length: number; width: number };
  };
}

const SolarPanelDetail: React.FC<SolarPanelDetailProps> = ({ panelData }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    const container = mountRef.current;
    const containerWidth = container.clientWidth || 300;
    const containerHeight = container.clientHeight || 200;

    const aspectRatio = containerWidth / containerHeight;
    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.set(7, 4, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(containerWidth, containerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0a0a1a, 1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x001122, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00aaff, 1.5);
    directionalLight.position.set(6, 8, 6);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 2.0, 10);
    pointLight1.position.set(0, 4, 0);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0088ff, 1.5, 8);
    pointLight2.position.set(4, 0, 4);
    scene.add(pointLight2);

    const { length, width } = panelData.dimensions;

    const panelGroup = new THREE.Group();

    const panelGeometry = new THREE.BoxGeometry(length, width, 0.05);
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });

    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.castShadow = true;
    panel.receiveShadow = true;
    panelGroup.add(panel);

    const frontSurfaceGeometry = new THREE.PlaneGeometry(length, width);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x001122,
      metalness: 0.5,
      roughness: 0.05,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const frontSurface = new THREE.Mesh(frontSurfaceGeometry, glassMaterial);
    frontSurface.position.set(0, 0, 0.026);
    panelGroup.add(frontSurface);

    const cellRows = 6;
    const cellCols = 10;
    const cellWidth = length / cellCols;
    const cellHeight = width / cellRows;

    for (let row = 0; row < cellRows; row++) {
      for (let col = 0; col < cellCols; col++) {
        const cellGeometry = new THREE.PlaneGeometry(
          cellWidth * 0.9,
          cellHeight * 0.9,
        );
        const cellMaterial = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x00ffff,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.9,
        });

        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        const x = (col - cellCols / 2 + 0.5) * cellWidth;
        const y = (row - cellRows / 2 + 0.5) * cellHeight;
        cell.position.set(x, y, 0.027);
        panelGroup.add(cell);
      }
    }

    const gridGroup = new THREE.Group();

    for (let i = 1; i < cellCols; i++) {
      const x = (i - cellCols / 2) * cellWidth;
      const lineGeometry = new THREE.BoxGeometry(0.002, width, 0.001);
      const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
      });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(x, 0, 0.028);
      gridGroup.add(line);
    }

    for (let i = 1; i < cellRows; i++) {
      const y = (i - cellRows / 2) * cellHeight;
      const lineGeometry = new THREE.BoxGeometry(length, 0.002, 0.001);
      const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9,
      });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(0, y, 0.028);
      gridGroup.add(line);
    }

    panelGroup.add(gridGroup);

    const particleGroup = new THREE.Group();
    const numParticles = 30;

    for (let i = 0; i < numParticles; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.003, 8, 8);
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.9,
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      const x = (Math.random() - 0.5) * length * 0.7;
      const y = (Math.random() - 0.5) * width * 0.7;
      particle.position.set(x, y, 0.029);
      particleGroup.add(particle);
    }

    panelGroup.add(particleGroup);

    const edgeGroup = new THREE.Group();

    const topEdgeGeometry = new THREE.BoxGeometry(length, 0.02, 0.01);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.0,
    });

    const topEdge = new THREE.Mesh(topEdgeGeometry, edgeMaterial);
    topEdge.position.set(0, width / 2, 0.03);
    edgeGroup.add(topEdge);

    const bottomEdge = new THREE.Mesh(topEdgeGeometry, edgeMaterial);
    bottomEdge.position.set(0, -width / 2, 0.03);
    edgeGroup.add(bottomEdge);

    const sideEdgeGeometry = new THREE.BoxGeometry(0.02, width, 0.01);

    const leftEdge = new THREE.Mesh(sideEdgeGeometry, edgeMaterial);
    leftEdge.position.set(-length / 2, 0, 0.03);
    edgeGroup.add(leftEdge);

    const rightEdge = new THREE.Mesh(sideEdgeGeometry, edgeMaterial);
    rightEdge.position.set(length / 2, 0, 0.03);
    edgeGroup.add(rightEdge);

    panelGroup.add(edgeGroup);

    const legGroup = new THREE.Group();

    const leftLegGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.6);
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7,
    });

    const leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
    leftLeg.position.set(-length / 2 + 0.15, -width / 2 + 0.15, -0.6);
    legGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
    rightLeg.position.set(length / 2 - 0.15, -width / 2 + 0.15, -0.35);
    legGroup.add(rightLeg);

    const crossSupportGeometry = new THREE.BoxGeometry(
      length - 0.3,
      0.04,
      0.04,
    );
    const crossSupport = new THREE.Mesh(crossSupportGeometry, legMaterial);
    crossSupport.position.set(0, -width / 2 + 0.15, -0.65);
    legGroup.add(crossSupport);

    panelGroup.add(legGroup);

    panelGroup.rotation.x = (panelData.inclination * Math.PI) / 180;
    scene.add(panelGroup);

    const animate = () => {
      requestAnimationFrame(animate);

      panelGroup.rotation.y += 0.003;

      particleGroup.children.forEach((particle, index) => {
        particle.position.y += Math.sin(Date.now() * 0.001 + index) * 0.0005;
        if (particle instanceof THREE.Mesh && particle.material) {
          (particle.material as THREE.MeshStandardMaterial).opacity =
            0.5 + Math.sin(Date.now() * 0.002 + index) * 0.3;
        }
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [panelData]);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-500 to-gray-800 rounded-lg p-6 shadow-2xl border border-cyan-500/20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="h-[250px] w-full">
              <div
                ref={mountRef}
                className="border border-gray-500/30 rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-inner w-full h-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Información Técnica
            </h4>

            <div className="space-y-3 bg-gray-800/50 rounded-lg p-4 border border-gray-500/40">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Grupo:</span>
                  <span className="text-sm font-bold text-white bg-gray-900/30 px-2 py-1 rounded">
                    {panelData.groupId}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">ID Placa:</span>
                  <span className="text-sm font-bold text-white bg-gray-900/30 px-2 py-1 rounded">
                    {panelData.panelId}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Inclinación:</span>
                  <span className="text-sm font-bold text-white bg-gray-900/30 px-2 py-1 rounded">
                    {panelData.inclination}°
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Longitud:</span>
                  <span className="text-sm font-bold text-white bg-gray-900/30 px-2 py-1 rounded">
                    {panelData.dimensions.length}m
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">Ancho:</span>
                  <span className="text-sm font-bold text-white bg-gray-900/30 px-2 py-1 rounded">
                    {panelData.dimensions.width}m
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-500/40">
              <h5 className="text-sm font-semibold text-white mb-3 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Posición
              </h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-white">X</div>
                  <div className="text-white font-bold">
                    {panelData.position.x.toFixed(2)}m
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white">Y</div>
                  <div className="text-white font-bold">
                    {panelData.position.y.toFixed(2)}m
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white">Z</div>
                  <div className="text-white font-bold">
                    {panelData.position.z.toFixed(2)}m
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarPanelDetail;
