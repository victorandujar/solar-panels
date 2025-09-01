"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import Modal from "../Modal/Modal";
import SolarPanelDetail from "../SolarPanelDetail/SolarPanelDetail";
import GroupDetail3D from "../GroupDetail3D/GroupDetail3D";
import GroupManagement from "../GroupManagement/GroupManagement";
import GroupSelector from "../GroupSelector/GroupSelector";
import PanelStats from "../PanelStats/PanelStats";
import QuickControls from "../QuickControls/QuickControls";
import SolarPlantScene from "../SolarPlantScene/SolarPlantScene";
import NotificationDialog from "../NotificationDialog/NotificationDialog";
import { useRegisterScene } from "../../hooks/useRegisterScene";
import {
  useSolarPanelStore,
  type SolarPanelState,
} from "../../../store/useStore";
import { useSolarPlant } from "../../hooks/useSolarPlant";
import { FaEdit, FaPlusSquare, FaTrash, FaTimes } from "react-icons/fa";

const SolarPanelLayout: React.FC = () => {
  // Usar el hook personalizado que contiene toda la lógica
  const {
    state,
    handlePanelClick,
    handleCameraUpdate,
    handleGroupChange,
    handleOpenGroupManagement,
    handleCloseGroupManagement,
    handleGroupChanged,
    handleOpenGroupManagementFromPanel,
    handlePositionChange,
    handlePanelGroupChange,
    handleAddPanel,
    handleDeleteSelectedPanels,
    handleClearSelection,
    setModifyLayout,
    handleCloseModal,
    handleCloseGroupDetail,
    handlePanelSelectInGroup,
    sceneConfig: baseSceneConfig,
    cameraPosition,
    notificationDialog,
    hideNotification,
  } = useSolarPlant();

  // Inicializar paneles
  const initializePanels = useSolarPanelStore(
    (storeState: SolarPanelState) => storeState.initializePanels,
  );

  const rootRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    initializePanels();
  }, [initializePanels]);

  // Configurar contenido de la escena
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
          selectedGroup={state.selectedGroup}
          selectedPanels={state.selectedPanels}
          selectedPanelsForDeletion={state.selectedPanelsForDeletion}
          onPanelClick={handlePanelClick}
          onCameraUpdate={handleCameraUpdate}
          modifyLayout={state.modifyLayout}
          onPositionChange={handlePositionChange}
          onGroupChange={handlePanelGroupChange}
        />
      </>
    ),
    [
      cameraPosition,
      state.selectedGroup,
      state.selectedPanels,
      state.selectedPanelsForDeletion,
      handlePanelClick,
      handleCameraUpdate,
      state.modifyLayout,
      handlePositionChange,
      handlePanelGroupChange,
    ],
  );

  // Configuración completa de escena
  const sceneConfig = useMemo(
    () => ({
      ...baseSceneConfig,
      content: sceneContent,
    }),
    [baseSceneConfig, sceneContent],
  );

  useRegisterScene("solar-plant-main", sceneConfig);

  return (
    <>
      <div
        ref={rootRef}
        className={`h-screen overflow-hidden relative transition-all duration-300 font-mono ${
          state.showGroupDetail ? "w-1/2" : "w-full"
        }`}
      ></div>

      <div className="absolute top-32 left-4 z-20 w-full">
        <div className="flex md:justify-between 2xl:justify-start gap-4 w-full pr-8">
          <GroupSelector
            legendData={state.legendData}
            selectedGroup={state.selectedGroup}
            onGroupChange={handleGroupChange}
          />

          <div className="flex flex-col gap-4">
            <QuickControls className="md:w-72 2xl:w-full" />
            <PanelStats className="w-72 2xl:w-60" />
            <button
              onClick={() => setModifyLayout(!state.modifyLayout)}
              className={`px-4 py-2 rounded font-medium transition-colors w-60 text-sm flex justify-center items-center gap-2 ${
                state.modifyLayout
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              <FaEdit />
              {state.modifyLayout ? "Desactivar edición" : "Editar layout"}
            </button>
            {state.modifyLayout && (
              <section className="flex flex-col gap-2 text-black border border-white/30 bg-white/10 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] w-60 p-4 rounded-lg">
                <button
                  onClick={handleAddPanel}
                  className="flex items-center justify-center gap-2 text-sm bg-black/70 backdrop-blur-lg p-2 rounded-lg text-white hover:bg-black/80 transition-colors"
                >
                  <FaPlusSquare /> Añadir panel
                </button>

                {state.selectedPanelsForDeletion.size > 0 && (
                  <div className="flex flex-col gap-2 border-t border-white/20 pt-2">
                    <div className="text-xs text-white">
                      {state.selectedPanelsForDeletion.size} panel
                      {state.selectedPanelsForDeletion.size > 1
                        ? "es"
                        : ""}{" "}
                      seleccionado
                      {state.selectedPanelsForDeletion.size > 1 ? "s" : ""}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteSelectedPanels}
                        className="flex items-center justify-center gap-2 text-xs bg-red-600 hover:bg-red-700 p-2 rounded-lg text-white transition-colors flex-1"
                      >
                        <FaTrash /> Eliminar
                      </button>
                      <button
                        onClick={handleClearSelection}
                        className="flex items-center justify-center gap-2 text-xs bg-gray-600 hover:bg-gray-700 p-2 rounded-lg text-white transition-colors flex-1"
                      >
                        <FaTimes /> Limpiar
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <h1 className="text-sm font-medium">Modo de edición:</h1>
                  <span className="text-sm font-medium text-green-700">
                    Activado
                  </span>
                </div>
                <span className="text-xs">
                  {state.selectedPanelsForDeletion.size > 0
                    ? "Haz clic en 'Eliminar' para mover los paneles seleccionados al grupo -1."
                    : "Haz clic en los paneles para seleccionarlos. Mantén Ctrl/Cmd para selección múltiple."}
                </span>
              </section>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={state.isModalOpen}
        onClose={handleCloseModal}
        title="Detalle de Placa Solar"
      >
        {state.selectedPanel && (
          <SolarPanelDetail
            panelData={state.selectedPanel}
            onOpenGroupManagement={handleOpenGroupManagementFromPanel}
          />
        )}
      </Modal>

      {state.showGroupDetail &&
        state.selectedGroupData &&
        !state.showGroupManagement && (
          <GroupDetail3D
            groupData={state.selectedGroupData}
            selectedPanels={state.selectedPanels}
            onClose={handleCloseGroupDetail}
            onPanelSelect={handlePanelSelectInGroup}
            onOpenManagement={handleOpenGroupManagement}
          />
        )}

      {state.showGroupManagement && state.selectedGroupData && (
        <GroupManagement
          groupData={state.selectedGroupData}
          selectedPanels={state.selectedPanels}
          onClose={handleCloseGroupManagement}
          onPanelSelect={handlePanelSelectInGroup}
          onGroupChanged={handleGroupChanged}
        />
      )}

      <NotificationDialog {...notificationDialog} onClose={hideNotification} />
    </>
  );
};

export default SolarPanelLayout;
