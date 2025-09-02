"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGroupDetail } from "../../../hooks/useGroupDetail";
import { GroupScene } from "../../../components/GroupScene";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";
import NotificationDialog from "../../../components/NotificationDialog/NotificationDialog";
import Link from "next/link";
import { PlantOverviewScene } from "@/app/components/GroupScene/GroupScene";
import { FaChevronLeft } from "react-icons/fa";
import { useSolarPlant } from "@/app/hooks/useSolarPlant";
import GroupControls from "@/app/components/GroupControls/GroupControls";

const GroupPage = () => {
  const {
    state,
    groupData,
    groupName,
    panels,
    handlePanelSelect,
    handleClose,
    handleRangeSelect,
    clearSelection,
    handleDisableSelected,
    handleEnableSelected,
    handleDisableGroup,
    handleEnableGroup,
    setRangeStart,
    setRangeEnd,
    hasInactiveSelectedPanels,
    hasInactivePanelsInGroup,
    confirmDialog,
    hideConfirm,
    notificationDialog,
    hideNotification,
  } = useGroupDetail();

  const { handleOpenGroupManagement } = useSolarPlant();

  const groupDetailScene = useMemo(
    () =>
      groupData ? (
        <GroupScene
          groupData={groupData}
          selectedPanels={state.selectedPanels}
          onPanelSelect={handlePanelSelect}
        />
      ) : null,
    [groupData, state.selectedPanels, handlePanelSelect],
  );

  if (!groupData && panels.length === 0) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="w-full h-full bg-white/95 backdrop-blur-lg shadow-2xl overflow-hidden flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Cargando datos del grupo...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="w-full h-full bg-white/95 backdrop-blur-lg shadow-2xl overflow-hidden flex flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Grupo no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              El grupo &quot;{groupName}&quot; no existe o no tiene paneles.
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full z-50 flex items-center justify-center">
      <div className="w-full h-full bg-black/10 backdrop-blur-sm shadow-2xl overflow-hidden flex flex-col ">
        <div className="backdrop-blur-md border border-b border-mainColor/30 transition-all duration-500 ease-in-out bg-black/10 text-blackp-4 shadow-lg text-black">
          <div className="flex justify-between gap-10 items-end py-2 px-10">
            <Link
              href="/"
              className="hover:text-gray-200 transition-colors p-2 rounded-full  text-sm flex items-center gap-2"
              title="Cerrar vista de grupo"
            >
              ← Volver
            </Link>
            <div>
              <h2 className="text-l font-bold text-white">
                Vista Detallada - Grupo {groupData.groupId}
              </h2>
              <p className="text-sm opacity-90 mt-1 text-white">
                {groupData.allPanelsInGroup.length} paneles en este grupo
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          <div className="w-1/2 h-full relative border-r border-mainColor/50">
            <div className="absolute inset-0">
              <div className="absolute top-4 left-4 z-10">
                <h3 className="text-lg font-semibold text-black">
                  Vista General
                </h3>
              </div>
              <Canvas
                style={{
                  width: "100%",
                  height: "100%",
                }}
                gl={{
                  antialias: true,
                  alpha: true,
                  depth: true,
                  powerPreference: "high-performance",
                }}
                performance={{ min: 0.5 }}
                dpr={[1, 2]}
              >
                <PlantOverviewScene groupData={groupData} />
              </Canvas>
            </div>
          </div>

          <div className="w-1/2 h-full relative flex flex-col">
            <div className="flex-1 relative">
              <Canvas
                style={{ width: "100%", height: "100%" }}
                gl={{
                  antialias: true,
                  alpha: true,
                  depth: true,
                  powerPreference: "high-performance",
                }}
                performance={{ min: 0.5 }}
                dpr={[1, 2]}
              >
                {groupDetailScene}
              </Canvas>
            </div>

            <div className="h-[40vh] flex-shrink-0">
              <GroupControls
                state={state}
                setRangeStart={setRangeStart}
                setRangeEnd={setRangeEnd}
                handleRangeSelect={handleRangeSelect}
                clearSelection={clearSelection}
                handleOpenGroupManagement={handleOpenGroupManagement}
                handleDisableSelected={handleDisableSelected}
                handleEnableSelected={handleEnableSelected}
                handleDisableGroup={handleDisableGroup}
                handleEnableGroup={handleEnableGroup}
                panels={panels}
                groupData={groupData}
                hasInactiveSelectedPanels={hasInactiveSelectedPanels}
                hasInactivePanelsInGroup={hasInactivePanelsInGroup}
                onPanelSelect={handlePanelSelect}
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog {...confirmDialog} onClose={hideConfirm} />

      <NotificationDialog {...notificationDialog} onClose={hideNotification} />
    </div>
  );
};

export default GroupPage;
