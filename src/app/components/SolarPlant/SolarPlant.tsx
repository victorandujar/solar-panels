"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import solarData from "../../../utils/ObjEyeshot.json";
import Modal from "../Modal/Modal";
import SolarPanelDetail from "../SolarPanelDetail/SolarPanelDetail";
import GroupDetail3D from "../GroupDetail3D/GroupDetail3D";

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

  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [legendData, setLegendData] = useState<
    Array<{ key: string; color: string }>
  >([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [panelMeshes, setPanelMeshes] = useState<THREE.Mesh[]>([]);
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState<any>(null);
  const [selectedGroupForDetail, setSelectedGroupForDetail] =
    useState<string>("");

  const colorPalette = [
    0x4682b4, 0x32cd32, 0xffa500, 0x8a2be2, 0xff69b4, 0x20b2aa, 0xff6347,
    0x1e90ff, 0x228b22, 0xffd700,
  ];

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

    const legendItems = agrupacionKeys.map((key, idx) => {
      const color = colorPalette[idx % colorPalette.length];
      const colorHex = "#" + color.toString(16).padStart(6, "0");
      return { key, color: colorHex };
    });
    setLegendData(legendItems);

    const panelGeometry = new THREE.PlaneGeometry(longitud, ancho);
    const panels: THREE.Mesh[] = [];

    const groupMaterials = new Map<string, THREE.MeshStandardMaterial>();

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
      groupMaterials.set(key, panelMaterial);

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

    setPanelMeshes(panels);

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      if (cameraRef.current) {
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(panelMeshes);

        if (intersects.length > 0) {
          const clickedPanel = intersects[0].object;
          const userData = clickedPanel.userData;

          const groupData = {
            groupId: userData.groupId,
            panelData: userData,
            allPanelsInGroup: panelMeshes
              .filter(
                (panel) => (panel as any).userData.groupId === userData.groupId,
              )
              .map((panel) => (panel as any).userData),
          };

          setSelectedGroupData(groupData);
          setShowGroupDetail(true);
        }
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

  useEffect(() => {
    if (panelMeshes.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      let highlightedCount = 0;

      panelMeshes.forEach((panel) => {
        const material = panel.material as THREE.MeshStandardMaterial;
        const userData = (panel as any).userData;
        const panelId = userData.panelId;
        const groupId = userData.groupId;

        if (selectedPanels.has(panelId)) {
          material.emissiveIntensity = 3.0;
          material.opacity = 1;
          material.transparent = true;
          material.color.setHex(0xffff00);
          highlightedCount++;
        } else if (selectedGroup && groupId === selectedGroup) {
          material.emissiveIntensity = 1.5;
          material.opacity = 1;
          material.transparent = true;
        } else if (selectedGroup) {
          material.emissiveIntensity = 0.1;
          material.opacity = 0.9;
          material.transparent = true;
        } else {
          material.emissiveIntensity = 0.25;
          material.opacity = 1;
          material.transparent = false;
        }
        material.needsUpdate = true;
      });
    });
  }, [selectedGroup, selectedPanels]);

  return (
    <>
      <div
        ref={mountRef}
        className="w-full h-screen overflow-hidden"
        style={{ overflow: "hidden" }}
      />

      <div className="absolute top-32 left-5 border border-white/30 bg-white/10 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-lg p-4 text-black z-10">
        <h3 className="text-sm font-semibold mb-3 flex items-center text-gray-800 drop-shadow-sm">
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
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
            />
          </svg>
          Agrupaciones
        </h3>

        <div className="mb-4">
          <select
            value={selectedGroup}
            onChange={(e) => {
              const groupId = e.target.value;
              setSelectedGroup(groupId);
              if (groupId) {
                const groupPanels = panelMeshes
                  .filter(
                    (panel) => (panel as any).userData.groupId === groupId,
                  )
                  .map((panel) => (panel as any).userData);

                setSelectedGroupData({
                  groupId: groupId,
                  allPanelsInGroup: groupPanels,
                });
                setSelectedGroupForDetail(groupId);
                setShowGroupDetail(true);
              } else {
                setShowGroupDetail(false);
                setSelectedGroupData(null);
                setSelectedGroupForDetail("");
              }
            }}
            className="w-full px-3 py-2 text-xs bg-white/20 border border-white/30 rounded-lg text-gray-800 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">Todas las agrupaciones</option>
            {legendData.map((item) => (
              <option key={item.key} value={item.key}>
                Grupo {item.key}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-600 mb-2">
          • Selecciona un grupo para ver detalles en el popup
        </div>

        <div className="space-y-2 max-h-90 overflow-y-auto">
          {legendData.map((item) => (
            <div
              key={item.key}
              className={`flex items-center space-x-3 text-xs p-2 rounded-lg transition-all duration-200 ${
                selectedGroup === item.key
                  ? "bg-white/30 border border-white/50"
                  : "hover:bg-white/10"
              }`}
            >
              <div
                className="w-4 h-4 rounded border border-white/50 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-gray-800 drop-shadow-sm">
                Grupo {item.key}
              </span>
              {selectedGroup === item.key && (
                <svg
                  className="w-3 h-3 ml-auto text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalle de Placa Solar"
      >
        {selectedPanel && <SolarPanelDetail panelData={selectedPanel} />}
      </Modal>

      {showGroupDetail && selectedGroupData && (
        <>
          <GroupDetail3D
            groupData={selectedGroupData}
            selectedPanels={selectedPanels}
            onClose={() => {
              setShowGroupDetail(false);
              setSelectedGroupData(null);
              setSelectedPanels(new Set());
            }}
            onPanelSelect={(panelIds: Set<string>) => {
              setSelectedPanels(panelIds);
            }}
          />
        </>
      )}
    </>
  );
};

export default SolarPanelLayout;
