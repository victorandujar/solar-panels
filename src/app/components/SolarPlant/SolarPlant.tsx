"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import solarData from "../../../utils/ObjEyeshot.json";
import Modal from "../Modal/Modal";
import SolarPanelDetail from "../SolarPanelDetail/SolarPanelDetail";

interface Point {
  X: number;
  Y: number;
  Z: number;
}

interface Agrupacion {
  [key: string]: Point[];
}

interface SolarData {
  agrupaciones: Agrupacion;
  longitud: number;
  ancho: number;
  parcela: Point[];
  tilt: number;
}

const SolarPanelLayout: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<any>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000,
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 0, 1000).normalize();
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const axesHelper = new THREE.AxesHelper(100);
    scene.add(axesHelper);

    const { agrupaciones, longitud, ancho, parcela, tilt } =
      solarData as SolarData;

    const centroid = parcela.reduce(
      (acc, p) => ({
        x: acc.x + p.X / parcela.length,
        y: acc.y + p.Y / parcela.length,
        z: acc.z + p.Z / parcela.length,
      }),
      { x: 0, y: 0, z: 0 },
    );

    const allPoints = [...parcela, ...Object.values(agrupaciones).flat()];
    const maxDistance = Math.max(
      ...allPoints.map((p) =>
        Math.sqrt(
          Math.pow(p.X - centroid.x, 2) +
            Math.pow(p.Y - centroid.y, 2) +
            Math.pow(p.Z - centroid.z, 2),
        ),
      ),
    );

    const lastGroupKey = "10";
    const lastGroup = agrupaciones[lastGroupKey];

    const lastGroupCenter = lastGroup
      ? lastGroup.reduce(
          (acc, p) => ({
            x: acc.x + p.X / lastGroup.length,
            y: acc.y + p.Y / lastGroup.length,
            z: acc.z + p.Z / lastGroup.length,
          }),
          { x: 0, y: 0, z: 0 },
        )
      : centroid;

    camera.position.set(centroid.x, centroid.y, maxDistance * 2.5);
    camera.lookAt(centroid.x, centroid.y, centroid.z);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = true;
    controls.minDistance = 10;
    controls.maxDistance = maxDistance * 3;
    controls.target.set(centroid.x, centroid.y, centroid.z);
    controls.maxPolarAngle = Math.PI * 0.8;
    controls.minPolarAngle = Math.PI * 0.1;
    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 0.8;

    const handleZoom = () => {
      const currentDistance = camera.position.distanceTo(controls.target);
      const maxZoomDistance = maxDistance * 3;
      const minZoomDistance = 10;

      if (currentDistance > maxDistance * 1.8) {
        const firstPhaseRatio = Math.max(
          0,
          Math.min(
            (maxDistance * 3 - currentDistance) /
              (maxDistance * 3 - maxDistance * 1.8),
            1,
          ),
        );

        const firstGroupsCenter = {
          x: centroid.x + (lastGroupCenter.x - centroid.x) * 0.2,
          y: centroid.y + (lastGroupCenter.y - centroid.y) * 0.2,
          z: centroid.z + (lastGroupCenter.z - centroid.z) * 0.2,
        };

        const targetX =
          centroid.x + (firstGroupsCenter.x - centroid.x) * firstPhaseRatio;
        const targetY =
          centroid.y + (firstGroupsCenter.y - centroid.y) * firstPhaseRatio;
        const targetZ =
          centroid.z + (firstGroupsCenter.z - centroid.z) * firstPhaseRatio;

        controls.target.set(targetX, targetY, targetZ);
      } else if (
        currentDistance <= maxDistance * 1.8 &&
        currentDistance > minZoomDistance
      ) {
        const secondPhaseRatio = Math.max(
          0,
          Math.min(
            (maxDistance * 1.8 - currentDistance) /
              (maxDistance * 1.8 - minZoomDistance),
            1,
          ),
        );

        const firstGroupsCenter = {
          x: centroid.x + (lastGroupCenter.x - centroid.x) * 0.2,
          y: centroid.y + (lastGroupCenter.y - centroid.y) * 0.2,
          z: centroid.z + (lastGroupCenter.z - centroid.z) * 0.2,
        };

        const targetX =
          firstGroupsCenter.x +
          (lastGroupCenter.x - firstGroupsCenter.x) * secondPhaseRatio;
        const targetY =
          firstGroupsCenter.y +
          (lastGroupCenter.y - firstGroupsCenter.y) * secondPhaseRatio;
        const targetZ =
          firstGroupsCenter.z +
          (lastGroupCenter.z - firstGroupsCenter.z) * secondPhaseRatio;

        controls.target.set(targetX, targetY, targetZ);
      }
    };

    controls.addEventListener("change", handleZoom);

    controlsRef.current = controls;

    const parcelPoints = parcela.map((p) => new THREE.Vector2(p.X, p.Y));
    const parcelShape = new THREE.Shape(parcelPoints);
    const parcelGeometry = new THREE.ShapeGeometry(parcelShape);

    const textureLoader = new THREE.TextureLoader();
    const terrainTexture = textureLoader.load(
      "https://threejs.org/examples/textures/grasslight-big.jpg",
    );
    terrainTexture.wrapS = THREE.RepeatWrapping;
    terrainTexture.wrapT = THREE.RepeatWrapping;
    terrainTexture.repeat.set(4, 4);

    const terrainMaterial = new THREE.MeshPhongMaterial({
      map: terrainTexture,
      side: THREE.DoubleSide,
    });
    const terrainMesh = new THREE.Mesh(parcelGeometry, terrainMaterial);
    terrainMesh.position.z = -0.2;
    scene.add(terrainMesh);

    const parcelLineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const parcelLine = new THREE.LineLoop(parcelGeometry, parcelLineMaterial);
    parcelLine.position.z = -0.1;
    scene.add(parcelLine);

    const tiltRad = (tilt * Math.PI) / 180;

    const agrupacionKeys = Object.keys(agrupaciones);
    const colorPalette = [
      0x4682b4, 0x32cd32, 0xffa500, 0x8a2be2, 0xff69b4, 0x20b2aa, 0xff6347,
      0x1e90ff, 0x228b22, 0xffd700,
    ];

    const panelGeometry = new THREE.PlaneGeometry(longitud, ancho);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const panels: THREE.Mesh[] = [];

    agrupacionKeys.forEach((key, idx) => {
      const color = colorPalette[idx % colorPalette.length];
      const panelMaterial = new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.25,
      });
      const points = agrupaciones[key];
      points.forEach((point, panelIdx) => {
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(point.X, point.Y, point.Z + ancho / 2);
        panel.rotation.x = tiltRad;

        (panel as any).userData = {
          groupId: key,
          panelId: `${key}-${panelIdx}`,
          position: { x: point.X, y: point.Y, z: point.Z },
          inclination: tilt,
          dimensions: { length: longitud, width: ancho },
        };

        panels.push(panel);
        scene.add(panel);
      });
    });

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(panels);

      if (intersects.length > 0) {
        const clickedPanel = intersects[0].object;
        setSelectedPanel(clickedPanel.userData);
        setIsModalOpen(true);
      }
    };

    renderer.domElement.addEventListener("click", handleClick);

    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (controlsRef.current) {
        controlsRef.current.removeEventListener("change", handleZoom);
      }
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener(
          "click",
          handleClick,
        );
      }
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        className="w-full h-screen overflow-hidden"
        style={{ overflow: "hidden" }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalle de Placa Solar"
      >
        {selectedPanel && <SolarPanelDetail panelData={selectedPanel} />}
      </Modal>
    </>
  );
};

export default SolarPanelLayout;
