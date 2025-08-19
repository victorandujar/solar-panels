"use client";

import React from "react";
import { usePanelStats } from "../../../store/useStore";

interface PanelStatsProps {
  className?: string;
}

const PanelStats: React.FC<PanelStatsProps> = ({ className = "" }) => {
  const stats = usePanelStats();

  return (
    <div
      className={`bg-black/80 backdrop-blur-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-lg p-4 text-white ${className}`}
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Estadísticas de la Planta
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-gray-300">Total Paneles:</span>
          <span className="text-xs font-bold">{stats.totalPanels}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-xs text-green-400">Paneles Activos:</span>
          <span className="text-xs font-bold text-green-400">
            {stats.activePanels}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-xs text-red-400">Paneles Inactivos:</span>
          <span className="text-xs font-bold text-red-400">
            {stats.inactivePanels}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-xs text-gray-300">Eficiencia:</span>
          <span className="text-xs font-bold">
            {stats.panelActivePercentage.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.panelActivePercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PanelStats;
