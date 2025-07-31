"use client";

import React from "react";

const EnergyBackground: React.FC = () => {
  return (
    <div className="energy-background">
      <div className="energy-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="energy-particle"
            style={
              {
                "--delay": `${Math.random() * 3}s`,
                "--duration": `${2 + Math.random() * 2}s`,
                "--x": `${Math.random() * 100}%`,
                "--y": `${Math.random() * 100}%`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="energy-waves">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      <div className="energy-grid">
        <svg
          className="grid-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="rgba(136, 138, 255, 0.1)"
                strokeWidth="0.5"
              />
            </pattern>
            <linearGradient
              id="energyGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(136, 138, 255, 0.3)" />
              <stop offset="50%" stopColor="rgba(107, 203, 184, 0.2)" />
              <stop offset="100%" stopColor="rgba(255, 137, 88, 0.3)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect
            width="100%"
            height="100%"
            fill="url(#energyGradient)"
            opacity="0.1"
          />
        </svg>
      </div>
    </div>
  );
};

export default EnergyBackground;
