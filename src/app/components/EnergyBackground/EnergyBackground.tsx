"use client";

import React, { useState, useEffect } from "react";

const EnergyBackground: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="energy-background">
      <div className="energy-particles">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="energy-particle"
            style={
              {
                "--delay": `${Math.random() * 4}s`,
                "--duration": `${2 + Math.random() * 3}s`,
                "--x": `${Math.random() * 100}%`,
                "--y": `${Math.random() * 100}%`,
                "--size": `${3 + Math.random() * 4}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="energy-glow">
        <div className="glow-orb glow-1"></div>
        <div className="glow-orb glow-2"></div>
        <div className="glow-orb glow-3"></div>
      </div>

      <div className="energy-grid">
        <svg
          className="grid-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="energyGrid"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="rgba(147, 51, 234, 0.15)"
                strokeWidth="0.3"
              />
            </pattern>
            <linearGradient
              id="energyGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
              <stop offset="20%" stopColor="rgba(147, 51, 234, 0.6)" />
              <stop offset="40%" stopColor="rgba(59, 130, 246, 0.6)" />
              <stop offset="60%" stopColor="rgba(147, 51, 234, 0.6)" />
              <stop offset="80%" stopColor="rgba(236, 72, 153, 0.6)" />
              <stop offset="100%" stopColor="rgba(147, 51, 234, 0.6)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#energyGrid)" />
        </svg>
      </div>
    </div>
  );
};

export default EnergyBackground;
