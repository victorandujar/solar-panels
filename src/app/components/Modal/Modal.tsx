"use client";

import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ">
      <div
        className="absolute inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
      />

      <div className="relative rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/30 bg-gradient-to-t from-white/30 to-white/20 backdrop-blur-md shadow-[0_8px_32px_0_rgba(31,38,135,0.37),inset_0_4px_6px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-white">
            {title || "Detalle de Placa Solar"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-600 transition-colors"
            aria-label="Cerrar modal"
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

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
