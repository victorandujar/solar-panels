"use client";

import React, {
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as THREE from "three";
import { PerspectiveCamera } from "@react-three/drei";
import Modal from "../Modal/Modal";
import SolarPanelDetail from "../SolarPanelDetail/SolarPanelDetail";
import GroupSelector from "../GroupSelector/GroupSelector";
import PanelStats from "../PanelStats/PanelStats";
import QuickControls from "../QuickControls/QuickControls";
import SolarPlantScene from "../SolarPlantScene/SolarPlantScene";
import VialManager from "../VialManager/VialManagerSimple";
import NotificationDialog from "../NotificationDialog/NotificationDialog";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { useRegisterScene } from "../../hooks/useRegisterScene";
import { useDialog } from "../../hooks/useDialog";
import {
  useSolarPanelStore,
  type SolarPanelState,
} from "../../../store/useStore";
import { useSolarPlant } from "../../hooks/useSolarPlant";
import {
  FaEdit,
  FaPlusSquare,
  FaTrash,
  FaTimes,
  FaRoad,
  FaTools,
} from "react-icons/fa";

const SolarPanelLayout: React.FC = () => {
  const {
    state,
    handlePanelClick,
    handleCameraUpdate,
    handleGroupChange,
    handleOpenGroupManagementFromPanel,
    handlePositionChange,
    handlePanelGroupChange,
    handleAddPanel,
    handleDeleteSelectedPanels,
    handleClearSelection,
    setModifyLayout,
    handleCloseModal,
    sceneConfig: baseSceneConfig,
    cameraPosition,
    notificationDialog,
    hideNotification,
  } = useSolarPlant();

  const {
    showNotification: showNotificationDialog,
    showConfirm,
    confirmDialog,
    hideConfirm,
  } = useDialog();

  const showNotification = useCallback(
    (
      title: string,
      message: string,
      variant?: "success" | "warning" | "info",
    ) => {
      showNotificationDialog({
        title,
        message,
        variant,
        autoClose: true,
        autoCloseDelay: 4000,
      });
    },
    [showNotificationDialog],
  );

  const showConfirmDialog = useCallback(
    async (
      title: string,
      message: string,
      variant?: "default" | "danger" | "warning" | "success",
    ): Promise<boolean> => {
      return showConfirm({
        title,
        message,
        variant: variant || "danger",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
      });
    },
    [showConfirm],
  );

  const [isCreatingVial, setIsCreatingVial] = useState(false);
  const [isTrenchMode, setIsTrenchMode] = useState(false);
  const [vialClickHandler, setVialClickHandler] = useState<
    ((point: THREE.Vector3) => void) | null
  >(null);

  const handlePanelClickWithVial = useCallback(
    (panelData: any, event?: any) => {
      if ((isCreatingVial || isTrenchMode) && vialClickHandler) {
        let point: THREE.Vector3;

        if (event?.point) {
          point = new THREE.Vector3(
            event.point.x,
            event.point.y,
            event.point.z,
          );
        } else if (panelData?.position) {
          const pos = panelData.position;
          if (Array.isArray(pos)) {
            point = new THREE.Vector3(pos[0], pos[1], pos[2]);
          } else {
            point = new THREE.Vector3(pos.x, pos.y, pos.z);
          }
        } else {
          return;
        }

        if (vialClickHandler) {
          vialClickHandler(point);
        }
      } else if (!isCreatingVial && !isTrenchMode) {
        handlePanelClick(panelData, event);
      } else {
      }
    },
    [isCreatingVial, isTrenchMode, vialClickHandler, handlePanelClick],
  );
  const [trenchParams, setTrenchParams] = useState({
    depth: 1.5,
    width: 2.0,
    length: 10.0,
    direction: 0,
  });

  const initializePanels = useSolarPanelStore(
    (storeState: SolarPanelState) => storeState.initializePanels,
  );

  const rootRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    initializePanels();
  }, [initializePanels]);

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
          onPanelClick={handlePanelClickWithVial}
          onCameraUpdate={handleCameraUpdate}
          modifyLayout={state.modifyLayout}
          onPositionChange={handlePositionChange}
          onGroupChange={handlePanelGroupChange}
          isCreatingVials={isCreatingVial || isTrenchMode}
        />
        <VialManager
          isCreatingVial={isCreatingVial}
          isTrenchMode={isTrenchMode}
          trenchParams={trenchParams}
          onPanelVialClick={setVialClickHandler}
          showNotification={showNotification}
          showConfirm={showConfirmDialog}
          onVialCreated={() => {
            setIsCreatingVial(false);
            setIsTrenchMode(false);
          }}
        />
      </>
    ),
    [
      cameraPosition,
      state.selectedGroup,
      state.selectedPanels,
      state.selectedPanelsForDeletion,
      handlePanelClickWithVial,
      handleCameraUpdate,
      state.modifyLayout,
      handlePositionChange,
      handlePanelGroupChange,
      isCreatingVial,
      isTrenchMode,
      trenchParams,
      showNotification,
      showConfirmDialog,
    ],
  );

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
        className="h-screen overflow-hidden relative transition-all duration-300 font-mono w-full"
      />

      {state.isLoadingLayout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-lg rounded-lg shadow-2xl p-8 text-center">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-semibold text-gray-800">
                Cargando layout...
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute 2xl:top-10 md:top-5 left-4 z-20 w-full">
        <div className="flex md:justify-between 2xl:justify-start gap-4 w-full pr-8">
          <GroupSelector
            legendData={state.legendData}
            selectedGroup={state.selectedGroup}
            onGroupChange={handleGroupChange}
          />

          <div className="flex flex-col gap-4">
            <QuickControls className="md:w-72 2xl:w-full" />
            <PanelStats className="w-72 2xl:w-60" />
            <section className="md:fixed md:top-[16%] md:left-[27%] z-20 w-full 2xl:relative 2xl:top-0 2xl:left-0">
              <button
                onClick={() => setModifyLayout(!state.modifyLayout)}
                className={`px-4 py-2 rounded font-medium transition-colors w-60 text-sm flex justify-center items-center gap-2 ${
                  state.modifyLayout
                    ? "bg-red-600/70 hover:bg-red-500 backdrop-blur-sm border border-red-500/70 transition-all duration-500 ease-in-out rounded-lg p-4  text-white"
                    : "bg-blue-500/70 hover:bg-blue-600 backdrop-blur-sm border border-blue-500/70 transition-all duration-500 ease-in-out rounded-lg p-4  text-white"
                }`}
              >
                <FaEdit />
                {state.modifyLayout ? "Desactivar edición" : "Editar layout"}
              </button>
              {state.modifyLayout && (
                <section className="flex flex-col gap-2 text-black backdrop-blur-sm border border-mainColor/30 transition-all duration-500 ease-in-out bg-black/10 rounded-lg p-4 w-60">
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
            </section>

            <section className="md:fixed md:top-[35%] md:left-[27%] z-20 w-full 2xl:relative 2xl:top-0 2xl:left-0">
              <div className="flex flex-col gap-2 w-60 backdrop-blur-sm border border-mainColor/30 transition-all duration-500 ease-in-out bg-black/10 rounded-lg p-4 md:text-white 2xl:text-black ${className} z-50">
                <h3 className="text-sm font-medium text-black mb-2 flex items-center gap-2">
                  <FaRoad /> Viales y Zanjas
                </h3>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsCreatingVial(!isCreatingVial);
                      setIsTrenchMode(false);
                    }}
                    className={`flex items-center justify-center gap-2 text-sm p-2 rounded-lg transition-colors ${
                      isCreatingVial
                        ? "bg-orange-600/70 hover:bg-orange-500 text-white"
                        : "bg-orange-500/70 hover:bg-orange-600 text-white"
                    }`}
                  >
                    <FaRoad />
                    {isCreatingVial ? "Cancelar Vial" : "Crear Vial"}
                  </button>

                  <button
                    onClick={() => {
                      setIsTrenchMode(!isTrenchMode);
                      setIsCreatingVial(false);
                    }}
                    className={`flex items-center justify-center gap-2 text-sm p-2 rounded-lg transition-colors ${
                      isTrenchMode
                        ? "bg-amber-600/70 hover:bg-amber-500 text-white"
                        : "bg-amber-500/70 hover:bg-amber-600 text-white"
                    }`}
                  >
                    <FaTools />
                    {isTrenchMode ? "Cancelar Zanja" : "Crear Zanja"}
                  </button>

                  {isTrenchMode && (
                    <div className="mt-2 p-2 bg-black/30 rounded text-white text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <label>Profundidad:</label>
                        <input
                          type="number"
                          value={trenchParams.depth}
                          onChange={(e) =>
                            setTrenchParams((prev) => ({
                              ...prev,
                              depth: parseFloat(e.target.value) || 1.5,
                            }))
                          }
                          className="w-16 px-1 py-0.5 bg-black/50 rounded text-center"
                          step="0.1"
                          min="0.1"
                          max="5"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <label>Anchura:</label>
                        <input
                          type="number"
                          value={trenchParams.width}
                          onChange={(e) =>
                            setTrenchParams((prev) => ({
                              ...prev,
                              width: parseFloat(e.target.value) || 2.0,
                            }))
                          }
                          className="w-16 px-1 py-0.5 bg-black/50 rounded text-center"
                          step="0.1"
                          min="0.5"
                          max="10"
                        />
                      </div>
                    </div>
                  )}

                  {/* Instrucciones */}
                  {(isCreatingVial || isTrenchMode) && (
                    <div className="text-xs text-white bg-black/30 p-2 rounded">
                      <p className="font-medium mb-1">Instrucciones:</p>
                      <p>1. Haz clic para marcar el punto inicial</p>
                      <p>2. Haz clic para marcar el punto final</p>
                      {isCreatingVial && (
                        <p className="text-orange-300 mt-1">
                          ⚠️ Los viales eliminarán automáticamente todos los
                          paneles en su trayecto
                        </p>
                      )}
                      {isTrenchMode && (
                        <p className="text-amber-300 mt-1">
                          ⚠️ Las zanjas solo se pueden crear en espacios sin
                          paneles
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
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

      <NotificationDialog {...notificationDialog} onClose={hideNotification} />
      <ConfirmDialog {...confirmDialog} onClose={hideConfirm} />
    </>
  );
};

export default SolarPanelLayout;
