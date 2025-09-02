import React, { useState, useRef } from "react";
import { useSolarPanelStore } from "../../../store/useStore";
import { SolarPanelState } from "../../../store/types";
import { useDialog } from "../../hooks/useDialog";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import NotificationDialog from "../NotificationDialog/NotificationDialog";
import { FaInfo, FaInfoCircle } from "react-icons/fa";
import Tooltip from "@mui/material/Tooltip";

interface Props {
  state: any;
  setRangeStart: (value: string) => void;
  setRangeEnd: (value: string) => void;
  handleRangeSelect: () => void;
  clearSelection: () => void;
  handleOpenGroupManagement: () => void;
  handleDisableSelected: () => void;
  handleEnableSelected: () => void;
  handleDisableGroup: () => void;
  handleEnableGroup: () => void;
  panels: any[];
  groupData: any;
  hasInactiveSelectedPanels: boolean;
  hasInactivePanelsInGroup: boolean;
  onPanelSelect: (panelIds: Set<string>) => void;
  onGroupChanged?: () => void;
}

const GroupControls: React.FC<Props> = ({
  state,
  setRangeStart,
  setRangeEnd,
  handleRangeSelect,
  clearSelection,
  handleDisableSelected,
  handleEnableSelected,
  handleDisableGroup,
  handleEnableGroup,
  panels,
  groupData,
  hasInactiveSelectedPanels,
  hasInactivePanelsInGroup,
  onPanelSelect,
  onGroupChanged,
}) => {
  const [showManagement, setShowManagement] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMoveToGroup, setShowMoveToGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#39ff14");
  const [targetGroupId, setTargetGroupId] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const mgmtScrollRef = useRef<HTMLDivElement>(null);

  const availableColors = [
    { name: "Verde Neón", value: "#39ff14" },
    { name: "Azul", value: "#4682b4" },
    { name: "Verde", value: "#32cd32" },
    { name: "Rojo", value: "#ff6347" },
    { name: "Dorado", value: "#ffd700" },
    { name: "Púrpura", value: "#9370db" },
    { name: "Aguamarina", value: "#20b2aa" },
    { name: "Rosa", value: "#ff69b4" },
    { name: "Turquesa", value: "#00ced1" },
    { name: "Naranja", value: "#ffa500" },
    { name: "Blanco", value: "#ffffff" },
    { name: "Negro", value: "#000000" },
    { name: "Gris", value: "#808080" },
    { name: "Azul Claro", value: "#add8e6" },
    { name: "Verde Claro", value: "#98ff98" },
    { name: "Rojo Claro", value: "#ffcccb" },
    { name: "Naranja Claro", value: "#ffb6c1" },
    { name: "Azul Oscuro", value: "#1e90ff" },
    { name: "Verde Oscuro", value: "#006400" },
    { name: "Rojo Oscuro", value: "#8b0000" },
    { name: "Naranja Oscuro", value: "#ff8c00" },
    { name: "Morado Oscuro", value: "#8a2be2" },
    { name: "Azul Marrón", value: "#5f9ea0" },
    { name: "Verde Marrón", value: "#8fbc8f" },
    { name: "Rojo Marrón", value: "#a52a2a" },
    { name: "Naranja Marrón", value: "#d2691e" },
    { name: "Morado Marrón", value: "#6a0dad" },
    { name: "Azul Grisáceo", value: "#708090" },
    { name: "Verde Grisáceo", value: "#2e8b57" },
  ];

  const {
    confirmDialog,
    showConfirm,
    hideConfirm,
    notificationDialog,
    showNotification,
    hideNotification,
  } = useDialog();

  const groups = useSolarPanelStore((state: SolarPanelState) => state.groups);
  const createGroup = useSolarPanelStore(
    (state: SolarPanelState) => state.createGroup,
  );
  const movePanels = useSolarPanelStore(
    (state: SolarPanelState) => state.movePanels,
  );

  const availableTargetGroups = groups.filter(
    (g) => g.id !== groupData.groupId,
  );

  const selectAllPanels = () => {
    const allPanelIds = new Set(
      groupData.allPanelsInGroup.map((p: any) => p.panelId),
    );
    onPanelSelect(allPanelIds as Set<string>);
  };

  const handleCreateGroup = () => {
    if (state.selectedPanels.size === 0) {
      showNotification({
        message:
          "Por favor, selecciona al menos un panel para crear un nuevo grupo",
        variant: "warning",
        title: "Paneles requeridos",
      });
      return;
    }

    if (!newGroupName.trim()) {
      showNotification({
        message: "Por favor, introduce un nombre para el nuevo grupo",
        variant: "warning",
        title: "Nombre requerido",
      });
      return;
    }

    const existingGroup = groups.find(
      (g) => g.name.toLowerCase() === newGroupName.trim().toLowerCase(),
    );
    if (existingGroup) {
      showNotification({
        message: `Ya existe un grupo con el nombre "${newGroupName}". Por favor, elige otro nombre.`,
        variant: "error",
        title: "Nombre duplicado",
      });
      return;
    }

    const panelIds = Array.from(state.selectedPanels);
    try {
      const newGroupId = createGroup(
        newGroupName.trim(),
        newGroupColor,
        panelIds as string[],
      );

      setNewGroupName("");
      setNewGroupColor("#39ff14");
      setShowCreateGroup(false);
      clearSelection();

      if (onGroupChanged) {
        onGroupChanged();
      }

      showNotification({
        message: `Nuevo grupo "${newGroupName}" creado con ID ${newGroupId} y ${panelIds.length} paneles`,
        variant: "success",
        title: "Grupo creado exitosamente",
        autoClose: true,
      });
    } catch (error) {
      showNotification({
        message: `Error al crear el grupo: ${error}`,
        variant: "error",
        title: "Error",
      });
    }
  };

  const handleMoveToGroup = async () => {
    if (state.selectedPanels.size === 0) {
      showNotification({
        message: "Por favor, selecciona al menos un panel para mover",
        variant: "warning",
        title: "Paneles requeridos",
      });
      return;
    }

    if (!targetGroupId) {
      showNotification({
        message: "Por favor, selecciona un grupo destino",
        variant: "warning",
        title: "Grupo destino requerido",
      });
      return;
    }

    const panelIds = Array.from(state.selectedPanels);
    const targetGroup = groups.find((g) => g.id === targetGroupId);
    const targetGroupName = targetGroup?.name || targetGroupId;

    const confirmed = await showConfirm({
      message: `¿Estás seguro que quieres mover ${panelIds.length} panel${panelIds.length > 1 ? "es" : ""} al grupo "${targetGroupName}"?`,
      title: "Confirmar movimiento de paneles",
      variant: "warning",
      confirmText: "Mover paneles",
      cancelText: "Cancelar",
    });

    if (!confirmed) {
      return;
    }

    try {
      movePanels(panelIds as string[], targetGroupId);

      setTargetGroupId("");
      setShowMoveToGroup(false);
      clearSelection();

      if (onGroupChanged) {
        onGroupChanged();
      }

      showNotification({
        message: `${panelIds.length} panel${panelIds.length > 1 ? "es" : ""} movido${panelIds.length > 1 ? "s" : ""} al grupo "${targetGroupName}"`,
        variant: "success",
        title: "Paneles movidos exitosamente",
        autoClose: true,
      });
    } catch (error) {
      showNotification({
        message: `Error al mover los paneles: ${error}`,
        variant: "error",
        title: "Error",
      });
    }
  };
  return (
    <div
      ref={panelRef}
      className={`p-4 2xl:text-sm md:text-xs bg-white/10 backdrop-blur-md border border-white/20 rounded-lg m-2 overflow-hidden flex flex-col transition-all duration-300`}
    >
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <section className="flex items-center gap-5">
          <h3 className="font-semibold text-white">
            {showManagement ? "Gestión del Grupo" : "Controles del Grupo"}
          </h3>
          <Tooltip
            title={
              !showManagement ? (
                <div className="text-xs text-white/90 space-y-1">
                  <p>
                    • Haz clic en las placas para seleccionarlas individualmente
                  </p>
                  <p>• Usa los inputs para seleccionar un rango de placas</p>
                  <p>• Placas seleccionadas: {state.selectedPanels.size}</p>
                  <p>
                    • Paneles inactivos en el grupo:{" "}
                    {
                      panels.filter(
                        (p) => p.groupId === groupData.groupId && !p.active,
                      ).length
                    }
                  </p>
                </div>
              ) : (
                <div className="text-xs text-white/90 space-y-1">
                  <p>• Selecciona paneles para crear nuevos grupos</p>
                  <p>• Mueve paneles entre grupos existentes</p>
                  <p>• Placas seleccionadas: {state.selectedPanels.size}</p>
                </div>
              )
            }
          >
            <FaInfoCircle size={25} />
          </Tooltip>
        </section>
        {showManagement && (
          <button
            onClick={() => {
              setShowCreateGroup(false);
              setShowMoveToGroup(false);
              setTargetGroupId("");
              if (mgmtScrollRef.current) {
                mgmtScrollRef.current.scrollTop = 0;
              }
              if (panelRef.current) {
                panelRef.current.scrollTop = 0;
              }
              setShowManagement(false);
            }}
            className="text-white/70 hover:text-white transition-colors text-xs"
          >
            ← Volver
          </button>
        )}
      </div>

      {!showManagement ? (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium mb-2 text-white">
              Selección por Rango
            </h4>
            <div className="flex space-x-2 mb-2">
              <input
                type="number"
                placeholder="ID Inicio"
                value={state.rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="flex-1 px-2 py-1 text-xs bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-white/70"
              />
              <input
                type="number"
                placeholder="ID Fin"
                value={state.rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="flex-1 px-2 py-1 text-xs bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-white/70"
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
                Limpiar Selección
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowManagement(true)}
              className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              title="Abrir gestor de grupos para reorganizar paneles"
            >
              🔧 Gestionar Grupo
            </button>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-white">Acciones</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDisableSelected}
                disabled={state.selectedPanels.size === 0}
                className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Deshabilitar Seleccionados
              </button>
              <button
                onClick={handleEnableSelected}
                disabled={
                  state.selectedPanels.size === 0 || !hasInactiveSelectedPanels
                }
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Habilitar Seleccionados
              </button>
              <button
                onClick={handleDisableGroup}
                className="px-2 py-1 text-xs bg-red-800 text-white rounded hover:bg-red-900 transition-colors"
              >
                Deshabilitar Grupo
              </button>
              <button
                onClick={handleEnableGroup}
                disabled={!hasInactivePanelsInGroup}
                className="px-2 py-1 text-xs bg-green-800 text-white rounded hover:bg-green-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Habilitar Grupo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={mgmtScrollRef}
          className={`space-y-4 flex-1 overflow-y-auto pr-2 transition-all duration-300 ${
            showCreateGroup || showMoveToGroup ? "min-h-[50vh]" : ""
          }`}
        >
          <div>
            <h4 className="text-sm font-medium mb-2 text-white">Selección</h4>
            <div className="flex space-x-2 mb-2">
              <input
                type="number"
                placeholder="ID Inicio"
                value={state.rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="flex-1 px-2 py-1 text-xs bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-white/70"
              />
              <input
                type="number"
                placeholder="ID Fin"
                value={state.rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="flex-1 px-2 py-1 text-xs bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-white/70"
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
                onClick={selectAllPanels}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Seleccionar Todo
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2 text-white">
              Acciones de Grupo
            </h4>
            <div className="space-y-2">
              <div>
                <button
                  onClick={() => setShowCreateGroup(!showCreateGroup)}
                  className="w-full px-3 py-2 text-xs bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
                  disabled={state.selectedPanels.size === 0}
                >
                  Crear Nuevo Grupo ({state.selectedPanels.size} paneles)
                </button>

                {showCreateGroup && (
                  <div className="mt-2 p-3 bg-white/20 border border-white/30 rounded mb-2">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre del nuevo grupo"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-white placeholder-white/70"
                      />
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-white">Color:</span>
                        <select
                          value={newGroupColor}
                          onChange={(e) => setNewGroupColor(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-green-500 text-white"
                        >
                          {availableColors.map((color) => (
                            <option
                              key={color.value}
                              value={color.value}
                              className="bg-gray-800"
                            >
                              {color.name}
                            </option>
                          ))}
                        </select>
                        <div
                          className="w-4 h-4 rounded border border-white/40"
                          style={{ backgroundColor: newGroupColor }}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCreateGroup}
                          className="px-3 py-1 text-xs bg-green-700 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          Crear Grupo
                        </button>
                        <button
                          onClick={() => setShowCreateGroup(false)}
                          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => {
                    if (availableTargetGroups.length === 0) {
                      alert(
                        "No hay otros grupos disponibles para mover paneles",
                      );
                      return;
                    }
                    setShowMoveToGroup(!showMoveToGroup);
                  }}
                  className="w-full px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={
                    state.selectedPanels.size === 0 ||
                    availableTargetGroups.length === 0
                  }
                >
                  Mover a Grupo Existente ({state.selectedPanels.size} paneles)
                  {availableTargetGroups.length === 0 &&
                    " - Sin grupos disponibles"}
                </button>

                {showMoveToGroup && (
                  <div className="mt-2 p-3 bg-white/20 border border-white/30 rounded mb-2">
                    <div className="space-y-2">
                      <select
                        value={targetGroupId}
                        onChange={(e) => setTargetGroupId(e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-white/20 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                      >
                        <option value="" className="bg-gray-800">
                          Seleccionar grupo destino...
                        </option>
                        {availableTargetGroups.map((group) => (
                          <option
                            key={group.id}
                            value={group.id}
                            className="bg-gray-800"
                          >
                            {group.name} (ID: {group.id}) -{" "}
                            {group.panels.length} paneles
                          </option>
                        ))}
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleMoveToGroup}
                          className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          Mover Paneles
                        </button>
                        <button
                          onClick={() => setShowMoveToGroup(false)}
                          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmDialog} onClose={hideConfirm} />
      <NotificationDialog {...notificationDialog} onClose={hideNotification} />
    </div>
  );
};

export default GroupControls;
