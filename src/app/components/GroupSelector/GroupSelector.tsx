"use client";

import React from "react";

interface LegendItem {
  key: string;
  color: string;
  count: number;
}

interface GroupSelectorProps {
  legendData: LegendItem[];
  selectedGroup: string;
  onGroupChange: (groupId: string) => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({
  legendData,
  selectedGroup,
  onGroupChange,
}) => {
  return (
    <div className="backdrop-blur-sm border border-mainColor/30 transition-all duration-500 ease-in-out bg-black/10 rounded-lg p-4 text-black w-80 max-w-sm">
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
          onChange={(e) => onGroupChange(e.target.value)}
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

      <div className="space-y-2 md:h-48 2xl:h-[450px] overflow-y-auto">
        {legendData.map((item) => (
          <div
            key={item.key}
            className={`flex items-center space-x-3 text-xs p-2 rounded-lg transition-all duration-200 cursor-pointer ${
              selectedGroup === item.key
                ? "bg-white/30 border border-white/50"
                : "hover:bg-white/10"
            }`}
            onClick={() => onGroupChange(item.key)}
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
            <span className="text-xs text-gray-600 ml-auto">
              {item.count} placas
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/20">
        <div className="text-xs text-gray-600">
          <div className="flex justify-between items-center mb-1">
            <span>Total grupos:</span>
            <span className="font-semibold text-gray-700">
              {legendData.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Total placas:</span>
            <span className="font-semibold text-gray-700">
              {legendData.reduce((sum, item) => sum + item.count, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupSelector;
