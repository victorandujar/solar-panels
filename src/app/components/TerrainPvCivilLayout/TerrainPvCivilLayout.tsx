"use client";

import React, { useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import TerrainPvCivilV2 from "../TerrainPvCivil/TerrainPvCivilV2";
import FilamentMesh from "../FilamentMesh/FilamentMesh";
import DigitalTerrain from "../DigitalTerrain/DigitalTerrain";
import { useTerrainPvCivil } from "../../hooks/useTerrainPvCivil";
import {
  FaEye,
  FaEyeSlash,
  FaCube,
  FaMap,
  FaRedo,
  FaRobot,
  FaMountain,
  FaExclamationTriangle,
} from "react-icons/fa";

interface TerrainPvCivilLayoutProps {
  terrainDataPath?: string;
}

const TerrainPvCivilLayout: React.FC<TerrainPvCivilLayoutProps> = () => {
  const {
    terrainData,
    isLoading,
    error,
    wireframe,
    showTexture,
    scale,
    heightFactor,
    triangleCount,
    digitalMode,
    setWireframe,
    setShowTexture,
    setScale,
    setHeightFactor,
    setDigitalMode,
    reloadTerrain,
  } = useTerrainPvCivil();

  const rootRef = useRef<HTMLDivElement>(null);

  const sceneContent = useMemo(
    () => (
      <>
        <PerspectiveCamera
          makeDefault
          fov={75}
          near={0.1}
          far={10000}
          position={[10, 15, 10]}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={100}
          target={[0, 0, 0]}
        />

        {digitalMode ? (
          <>
            <DigitalTerrain
              terrainData={terrainData}
              scale={scale}
              heightFactor={heightFactor}
            />
          </>
        ) : (
          <>
            <FilamentMesh
              size={60}
              density={0.4}
              height={-3}
              opacity={0.25}
              color="#4a90e2"
            />

            <TerrainPvCivilV2
              terrainData={terrainData}
              scale={scale}
              heightFactor={heightFactor}
              wireframe={wireframe}
              showTexture={showTexture}
            />
          </>
        )}

        <axesHelper args={[10]} />
      </>
    ),
    [terrainData, scale, heightFactor, wireframe, showTexture, digitalMode],
  );

  return (
    <>
      <div
        ref={rootRef}
        className="h-screen overflow-hidden relative transition-all duration-300 font-mono w-full"
      >
        {!isLoading && !error && terrainData ? (
          <Canvas
            shadows
            camera={{ position: [10, 15, 10], fov: 75 }}
            style={{
              background: digitalMode
                ? "linear-gradient(180deg, #001122 0%, #002244 50%, #003366 100%)"
                : "transparent",
            }}
          >
            {sceneContent}
          </Canvas>
        ) : null}
      </div>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-lg rounded-lg shadow-2xl p-8 text-center">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-semibold text-gray-800">
                Cargando terreno...
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Procesando datos del terreno
            </p>
          </div>
        </div>
      )}
      {error && !isLoading && (
        <div className="fixed inset-0 bg-red-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-lg rounded-lg shadow-2xl p-8 text-center max-w-md">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <FaExclamationTriangle className="text-red-600 text-3xl" />
              <span className="text-lg font-semibold text-gray-800">
                Error al cargar terreno
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={reloadTerrain}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
      <div className="absolute top-24 left-4 z-20">
        <div className="bg-black/70 backdrop-blur-lg rounded-lg p-4 text-white space-y-4 min-w-64">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaMap />
            Controles del Terreno
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Recargar datos:</label>
              <button
                onClick={reloadTerrain}
                disabled={isLoading}
                className="p-2 rounded transition-colors bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <FaRedo className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">Modo wireframe:</label>
              <button
                onClick={() => setWireframe(!wireframe)}
                className={`p-2 rounded transition-colors ${
                  wireframe
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {wireframe ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">Mostrar textura:</label>
              <button
                onClick={() => setShowTexture(!showTexture)}
                className={`p-2 rounded transition-colors ${
                  showTexture
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {showTexture ? <FaCube /> : <FaEyeSlash />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">Modo Digital:</label>
              <button
                onClick={() => setDigitalMode(!digitalMode)}
                className={`p-2 rounded transition-colors ${
                  digitalMode
                    ? "bg-cyan-600 hover:bg-cyan-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {digitalMode ? <FaRobot /> : <FaMountain />}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Escala del terreno:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs bg-gray-800 px-2 py-1 rounded min-w-16 text-center">
                  {scale.toFixed(3)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Factor de altura:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={heightFactor}
                  onChange={(e) => setHeightFactor(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs bg-gray-800 px-2 py-1 rounded min-w-16 text-center">
                  {heightFactor}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Recomendado: ≥19 (según análisis)
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                Error: {error}
              </div>
            )}

            <div className="text-xs text-gray-300 border-t border-gray-600 pt-3">
              <p>• Usa el ratón para navegar</p>
              <p>• Rueda del ratón para zoom</p>
              <p>• Clic derecho + arrastrar para rotar</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-24 right-4 z-20">
        <div className="bg-black/70 backdrop-blur-lg rounded-lg p-4 text-white">
          <h4 className="text-sm font-semibold mb-2">Estadísticas</h4>
          <div className="text-xs space-y-1">
            <p>Triángulos: {triangleCount}</p>
            <p>Escala: {scale.toFixed(3)}</p>
            <p>Factor altura: {heightFactor}</p>
            <p>
              Modo:{" "}
              {digitalMode
                ? "Digital"
                : wireframe
                  ? "Wireframe"
                  : showTexture
                    ? "Texturizado"
                    : "Sólido"}
            </p>
            <p>
              Terreno:{" "}
              {digitalMode
                ? "Digital"
                : triangleCount > 0
                  ? "Real"
                  : "Sin datos"}
            </p>
            {error && <p className="text-red-400">Estado: Error</p>}
            {isLoading && (
              <p className="text-yellow-400">Estado: Cargando...</p>
            )}
            <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">
              <p>Cámara: [10, 15, 10]</p>
              <p>Target: [0, 0, 0]</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TerrainPvCivilLayout;
