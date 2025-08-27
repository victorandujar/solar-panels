"use client";

import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { PerspectiveCamera } from "@react-three/drei";
import solarData from "../../../utils/ObjEyeshot.json";
import Modal from "../Modal/Modal";
import SolarPanelDetail from "../SolarPanelDetail/SolarPanelDetail";
import GroupDetail3D from "../GroupDetail3D/GroupDetail3D";
import GroupManagement from "../GroupManagement/GroupManagement";
import GroupSelector from "../GroupSelector/GroupSelector";
import PanelStats from "../PanelStats/PanelStats";
import QuickControls from "../QuickControls/QuickControls";
import SolarPlantScene from "../SolarPlantScene/SolarPlantScene";
import { useRegisterScene } from "../../hooks/useRegisterScene";
import {
  useSolarPanelStore,
  type SolarPanelState,
  type Point,
} from "../../../store/useStore";
import { SolarData, LegendItem } from "../../types/solar-types";
import { FaEdit } from "react-icons/fa";

const SolarPanelLayout: React.FC = () => {
  const [selectedPanel, setSelectedPanel] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [legendData, setLegendData] = useState<LegendItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState<any>(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [modifyLayout, setModifyLayout] = useState(false);

  const stateRef = useRef({
    isModalOpen,
    showGroupDetail,
    selectedGroupData,
    showGroupManagement,
    modifyLayout,
  });

  useEffect(() => {
    stateRef.current = {
      isModalOpen,
      showGroupDetail,
      selectedGroupData,
      showGroupManagement,
      modifyLayout,
    };
  }, [
    isModalOpen,
    showGroupDetail,
    selectedGroupData,
    showGroupManagement,
    modifyLayout,
  ]);

  const initializePanels = useSolarPanelStore(
    (state: SolarPanelState) => state.initializePanels,
  );
  const groups = useSolarPanelStore((state: SolarPanelState) => state.groups);
  const movePanel = useSolarPanelStore(
    (state: SolarPanelState) => state.movePanel,
  );
  const updatePanelPosition = useSolarPanelStore(
    (state: SolarPanelState) => state.updatePanelPosition,
  );

  const rootRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    initializePanels();
  }, [initializePanels]);

  useEffect(() => {
    if (selectedGroup && !groups.find((g: any) => g.id === selectedGroup)) {
      setSelectedGroup("");
      setShowGroupDetail(false);
      setShowGroupManagement(false);
      setSelectedGroupData(null);
      setSelectedPanels(new Set());
    }
  }, [selectedGroup, groups]);

  const handlePanelClick = useCallback((panelData: any) => {
    const currentStates = stateRef.current;

    if (
      currentStates.modifyLayout ||
      currentStates.isModalOpen ||
      currentStates.showGroupDetail ||
      currentStates.selectedGroupData ||
      currentStates.showGroupManagement
    ) {
      return;
    }

    setSelectedPanel(panelData);
    setIsModalOpen(true);
    setShowGroupDetail(false);
    setSelectedGroupData(null);
  }, []);

  const handleCameraUpdate = useCallback((legendData: LegendItem[]) => {
    setLegendData(legendData);
  }, []);

  const handleGroupChange = useCallback(
    (groupId: string) => {
      setSelectedGroup(groupId);
      setIsModalOpen(false);
      setSelectedPanel(null);

      if (groupId) {
        const selectedGroup = groups.find((g: any) => g.id === groupId);

        if (selectedGroup) {
          const groupPanels = selectedGroup.panels.map((panel: any) => ({
            groupId: panel.groupId,
            panelId: panel.id,
            position: {
              x: panel.position.X,
              y: panel.position.Y,
              z: panel.position.Z,
            },
            inclination: (solarData as SolarData).tilt,
            dimensions: {
              length: (solarData as SolarData).longitud,
              width: (solarData as SolarData).ancho,
            },
          }));

          setSelectedGroupData({
            groupId: groupId,
            allPanelsInGroup: groupPanels,
          });
          setShowGroupDetail(true);
        }
      } else {
        setShowGroupDetail(false);
        setSelectedGroupData(null);
      }
    },
    [groups],
  );

  const handleOpenGroupManagement = useCallback(() => {
    setShowGroupManagement(true);
    setShowGroupDetail(false);
  }, []);

  const handleCloseGroupManagement = useCallback(() => {
    setShowGroupManagement(false);
    setShowGroupDetail(true);

    if (selectedGroup) {
      const updatedGroup = groups.find((g: any) => g.id === selectedGroup);
      if (updatedGroup && updatedGroup.panels.length > 0) {
        const groupPanels = updatedGroup.panels.map((panel: any) => ({
          groupId: panel.groupId,
          panelId: panel.id,
          position: {
            x: panel.position.X,
            y: panel.position.Y,
            z: panel.position.Z,
          },
          inclination: (solarData as SolarData).tilt,
          dimensions: {
            length: (solarData as SolarData).longitud,
            width: (solarData as SolarData).ancho,
          },
        }));

        setSelectedGroupData({
          groupId: selectedGroup,
          allPanelsInGroup: groupPanels,
        });
      } else {
        setShowGroupDetail(false);
        setSelectedGroupData(null);
        setSelectedGroup("");
      }
    }
  }, [selectedGroup, groups]);

  const handleGroupChanged = useCallback(() => {
    if (selectedGroup) {
      const updatedGroup = groups.find((g: any) => g.id === selectedGroup);
      if (updatedGroup && updatedGroup.panels.length > 0) {
        const groupPanels = updatedGroup.panels.map((panel: any) => ({
          groupId: panel.groupId,
          panelId: panel.id,
          position: {
            x: panel.position.X,
            y: panel.position.Y,
            z: panel.position.Z,
          },
          inclination: (solarData as SolarData).tilt,
          dimensions: {
            length: (solarData as SolarData).longitud,
            width: (solarData as SolarData).ancho,
          },
        }));

        setSelectedGroupData({
          groupId: selectedGroup,
          allPanelsInGroup: groupPanels,
        });
      } else {
        setShowGroupDetail(false);
        setShowGroupManagement(false);
        setSelectedGroupData(null);
        setSelectedGroup("");
      }
    }
  }, [selectedGroup, groups]);

  const handleOpenGroupManagementFromPanel = useCallback(
    (groupId: string) => {
      setIsModalOpen(false);
      setSelectedPanel(null);

      const selectedGroup = groups.find((g: any) => g.id === groupId);

      if (selectedGroup) {
        const groupPanels = selectedGroup.panels.map((panel: any) => ({
          groupId: panel.groupId,
          panelId: panel.id,
          position: {
            x: panel.position.X,
            y: panel.position.Y,
            z: panel.position.Z,
          },
          inclination: (solarData as SolarData).tilt,
          dimensions: {
            length: (solarData as SolarData).longitud,
            width: (solarData as SolarData).ancho,
          },
        }));

        setSelectedGroupData({
          groupId: groupId,
          allPanelsInGroup: groupPanels,
        });

        setShowGroupDetail(false);
        setShowGroupManagement(true);
        setSelectedGroup(groupId);
      }
    },
    [groups],
  );

  const handlePositionChange = useCallback(
    (panelId: string, newPosition: [number, number, number]) => {
      const position: Point = {
        X: newPosition[0],
        Y: newPosition[1],
        Z: newPosition[2],
      };
      updatePanelPosition(panelId, position);
    },
    [updatePanelPosition],
  );

  const handlePanelGroupChange = useCallback(
    (panelId: string, newGroupId: string) => {
      movePanel(panelId, newGroupId);
    },
    [movePanel],
  );

  const { agrupaciones, parcela } = solarData as SolarData;

  const cameraPosition = useMemo(() => {
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

    const distance = maxDistance * 1.8;
    const angle = Math.PI / 3;

    const x = centroid.x;
    const y = centroid.y - distance * Math.sin(angle);
    const z = centroid.z + distance * Math.cos(angle);

    return [x, y, z] as [number, number, number];
  }, [parcela, agrupaciones]);

  useEffect(() => {
    const resizeHandler = () => {};
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  const sceneContent = useMemo(
    () => (
      <>
        <PerspectiveCamera
          makeDefault
          fov={75}
          near={0.1}
          far={10000}
          position={cameraPosition}
        />
        <SolarPlantScene
          selectedGroup={selectedGroup}
          selectedPanels={selectedPanels}
          onPanelClick={handlePanelClick}
          onCameraUpdate={handleCameraUpdate}
          modifyLayout={modifyLayout}
          onPositionChange={handlePositionChange}
          onGroupChange={handlePanelGroupChange}
        />
      </>
    ),
    [
      cameraPosition,
      selectedGroup,
      selectedPanels,
      handlePanelClick,
      handleCameraUpdate,
      modifyLayout,
      handlePositionChange,
      handlePanelGroupChange,
    ],
  );

  const sceneConfig = useMemo(
    () => ({
      content: sceneContent,
      cameraType: "perspective" as const,
      cameraSettings: {
        position: cameraPosition,
        makeDefault: true,
      },
      modifyLayout,
    }),
    [sceneContent, cameraPosition, modifyLayout],
  );

  useRegisterScene("solar-plant-main", sceneConfig);

  return (
    <>
      <div
        ref={rootRef}
        className={`h-screen overflow-hidden relative transition-all duration-300 font-mono ${
          showGroupDetail ? "w-1/2" : "w-full"
        }`}
      ></div>

      <div className="absolute top-32 left-4 z-20 w-full">
        <div className="flex md:justify-between 2xl:justify-start gap-4 w-full pr-8">
          <GroupSelector
            legendData={legendData}
            selectedGroup={selectedGroup}
            onGroupChange={handleGroupChange}
          />

          <div className="flex flex-col gap-4">
            <QuickControls className="md:w-72 2xl:w-full" />
            <PanelStats className="w-72 2xl:w-60" />
            <button
              onClick={() => setModifyLayout(!modifyLayout)}
              className={`px-4 py-2 rounded font-medium transition-colors w-60 text-sm flex justify-center items-center gap-2 ${
                modifyLayout
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              <FaEdit />
              {modifyLayout ? "Desactivar edición" : "Editar layout"}
            </button>
            {modifyLayout && (
              <section className="flex flex-col gap-2 text-black border border-white/30 bg-white/10 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] w-60 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h1 className="text-sm font-medium">Modo de edición:</h1>
                  <span className="text-sm font-medium text-green-700">
                    Activado
                  </span>
                </div>
                <span className="text-xs">
                  Puedes mover las placas y recrear grupos de placas.
                </span>
              </section>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalle de Placa Solar"
      >
        {selectedPanel && (
          <SolarPanelDetail
            panelData={selectedPanel}
            onOpenGroupManagement={handleOpenGroupManagementFromPanel}
          />
        )}
      </Modal>

      {showGroupDetail && selectedGroupData && !showGroupManagement && (
        <GroupDetail3D
          groupData={selectedGroupData}
          selectedPanels={selectedPanels}
          onClose={() => {
            setShowGroupDetail(false);
            setSelectedGroupData(null);
            setSelectedPanels(new Set());
            setSelectedGroup("");
          }}
          onPanelSelect={(panelIds: Set<string>) => {
            setSelectedPanels(panelIds);
          }}
          onOpenManagement={handleOpenGroupManagement}
        />
      )}

      {showGroupManagement && selectedGroupData && (
        <GroupManagement
          groupData={selectedGroupData}
          selectedPanels={selectedPanels}
          onClose={handleCloseGroupManagement}
          onPanelSelect={(panelIds: Set<string>) => {
            setSelectedPanels(panelIds);
          }}
          onGroupChanged={handleGroupChanged}
        />
      )}
    </>
  );
};

export default SolarPanelLayout;
