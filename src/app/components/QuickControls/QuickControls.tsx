"use client";

import React from "react";
import {
  useSolarPanelStore,
  usePanelStats,
  useTranslationSnap,
  useSetTranslationSnap,
} from "../../../store/useStore";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import NotificationDialog from "../NotificationDialog/NotificationDialog";
import { useDialog } from "../../hooks/useDialog";

interface QuickControlsProps {
  className?: string;
}

const QuickControls: React.FC<QuickControlsProps> = ({ className = "" }) => {
  const stats = usePanelStats();
  const enableAllPanels = useSolarPanelStore((state) => state.enableAllPanels);
  const disableAllPanels = useSolarPanelStore(
    (state) => state.disableAllPanels,
  );
  const translationSnap = useTranslationSnap();
  const setTranslationSnap = useSetTranslationSnap();

  const {
    confirmDialog,
    showConfirm,
    hideConfirm,
    notificationDialog,
    showNotification,
    hideNotification,
  } = useDialog();

  const handleEnableAll = React.useCallback(() => {
    enableAllPanels();
    showNotification({
      message: `${stats.inactivePanels} panel${stats.inactivePanels > 1 ? "es" : ""} habilitado${stats.inactivePanels > 1 ? "s" : ""}`,
      variant: "success",
      title: "Paneles habilitados",
      autoClose: true,
    });
  }, [enableAllPanels, stats.inactivePanels, showNotification]);

  const handleDisableAll = React.useCallback(async () => {
    const confirmed = await showConfirm({
      message: `¿Estás seguro que quieres deshabilitar TODOS los paneles de la planta? (${stats.totalPanels} paneles)`,
      title: "Confirmar deshabilitación masiva",
      variant: "danger",
      confirmText: "Deshabilitar todos",
      cancelText: "Cancelar",
    });

    if (confirmed) {
      disableAllPanels();
      showNotification({
        message: `${stats.activePanels} panel${stats.activePanels > 1 ? "es" : ""} deshabilitado${stats.activePanels > 1 ? "s" : ""}`,
        variant: "success",
        title: "Paneles deshabilitados",
        autoClose: true,
      });
    }
  }, [
    disableAllPanels,
    stats.totalPanels,
    stats.activePanels,
    showConfirm,
    showNotification,
  ]);

  return (
    <div
      className={`backdrop-blur-sm border border-mainColor/30 transition-all duration-500 ease-in-out bg-black/10 rounded-lg p-4 md:text-white 2xl:text-black ${className} z-50`}
    >
      <h3 className="text-sm font-semibold mb-3 flex items-center">
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
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
          />
        </svg>
        Control General
      </h3>

      <div className="space-y-2">
        <button
          onClick={handleEnableAll}
          disabled={stats.inactivePanels === 0}
          className="w-full px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Habilitar Todos ({stats.inactivePanels} inactivos)
        </button>

        <button
          onClick={handleDisableAll}
          disabled={stats.activePanels === 0}
          className="w-full px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Deshabilitar Todos ({stats.activePanels} activos)
        </button>
      </div>

      <ConfirmDialog {...confirmDialog} onClose={hideConfirm} />

      <NotificationDialog {...notificationDialog} onClose={hideNotification} />
    </div>
  );
};

export default QuickControls;
