"use client";

import React from "react";
import {
  useSolarPanelStore,
  usePanelStats,
  type SolarPanelState,
} from "../../../store/useStore";

interface QuickControlsProps {
  className?: string;
}

const QuickControls: React.FC<QuickControlsProps> = ({ className = "" }) => {
  const stats = usePanelStats();
  const enableAllPanels = useSolarPanelStore((state) => state.enableAllPanels);
  const disableAllPanels = useSolarPanelStore(
    (state) => state.disableAllPanels,
  );

  const handleEnableAll = React.useCallback(() => {
    enableAllPanels();
  }, [enableAllPanels]);

  const handleDisableAll = React.useCallback(() => {
    const confirmDisable = window.confirm(
      `¿Estás seguro que quieres deshabilitar TODOS los paneles de la planta? (${stats.totalPanels} paneles)`,
    );

    if (confirmDisable) {
      disableAllPanels();
    }
  }, [disableAllPanels, stats.totalPanels]);

  return (
    <div
      className={`bg-black/80 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-lg p-4 text-white ${className} `}
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
    </div>
  );
};

export default QuickControls;
