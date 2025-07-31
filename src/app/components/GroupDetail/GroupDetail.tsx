import React, { useState } from "react";

interface PanelData {
  panelId: string;
  groupId: string;
  position: { x: number; y: number; z: number };
  inclination: number;
  dimensions: { length: number; width: number };
}

interface GroupDetailProps {
  groupData: {
    groupId: string;
    panelData: PanelData;
    allPanelsInGroup: PanelData[];
  };
  onClose: () => void;
  onPanelSelect: (panelIds: Set<string>) => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({
  groupData,
  onClose,
  onPanelSelect,
}) => {
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");

  const handlePanelClick = (panelId: string) => {
    const newSelectedPanels = new Set(selectedPanels);
    if (newSelectedPanels.has(panelId)) {
      newSelectedPanels.delete(panelId);
    } else {
      newSelectedPanels.add(panelId);
    }
    setSelectedPanels(newSelectedPanels);
    onPanelSelect(newSelectedPanels);
  };

  const handleRangeSelect = () => {
    if (!rangeStart || !rangeEnd) return;

    const startIndex = parseInt(rangeStart);
    const endIndex = parseInt(rangeEnd);

    if (isNaN(startIndex) || isNaN(endIndex)) return;

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    const newSelectedPanels = new Set<string>();
    for (let i = minIndex; i <= maxIndex; i++) {
      const panelId = `${groupData.groupId}-${i}`;
      if (groupData.allPanelsInGroup.some((p) => p.panelId === panelId)) {
        newSelectedPanels.add(panelId);
      }
    }

    setSelectedPanels(newSelectedPanels);
    onPanelSelect(newSelectedPanels);
  };

  const clearSelection = () => {
    setSelectedPanels(new Set());
    onPanelSelect(new Set());
  };

  return (
    <div className="fixed top-4 right-4 w-96 max-h-[80vh] bg-white/95 backdrop-blur-lg rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-[9999]">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Grupo {groupData.groupId}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="text-sm opacity-90">
          {groupData.allPanelsInGroup.length} paneles en este grupo
        </p>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
        {/* Range Selection */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 text-gray-800">
            Selección por Rango
          </h3>
          <div className="flex space-x-2 mb-2">
            <input
              type="number"
              placeholder="Inicio"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Fin"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleRangeSelect}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Seleccionar Rango
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Panel List */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2 text-gray-800">
            Paneles ({selectedPanels.size} seleccionados)
          </h3>
          <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto">
            {groupData.allPanelsInGroup.map((panel, index) => (
              <button
                key={panel.panelId}
                onClick={() => handlePanelClick(panel.panelId)}
                className={`p-1 text-xs rounded transition-colors ${
                  selectedPanels.has(panel.panelId)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                title={`Panel ${panel.panelId}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Details */}
        {selectedPanels.size === 1 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold mb-2 text-gray-800">
              Detalles del Panel
            </h3>
            {(() => {
              const selectedPanel = groupData.allPanelsInGroup.find(
                (p) => p.panelId === Array.from(selectedPanels)[0],
              );
              if (!selectedPanel) return null;

              return (
                <div className="text-xs text-gray-700 space-y-1">
                  <div>
                    <strong>ID:</strong> {selectedPanel.panelId}
                  </div>
                  <div>
                    <strong>Posición:</strong> X:{" "}
                    {selectedPanel.position.x.toFixed(2)}, Y:{" "}
                    {selectedPanel.position.y.toFixed(2)}, Z:{" "}
                    {selectedPanel.position.z.toFixed(2)}
                  </div>
                  <div>
                    <strong>Inclinación:</strong> {selectedPanel.inclination}°
                  </div>
                  <div>
                    <strong>Dimensiones:</strong>{" "}
                    {selectedPanel.dimensions.length}m ×{" "}
                    {selectedPanel.dimensions.width}m
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
