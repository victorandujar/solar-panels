"use client";

import React from "react";
import {
  IoCheckmarkCircleOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
} from "react-icons/io5";
import { RiAlarmWarningLine } from "react-icons/ri";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning" | "success";
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  variant = "default",
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          icon: <RiAlarmWarningLine className="text-red-600" />,
          titleColor: "text-red-600",
        };
      case "warning":
        return {
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
          icon: <IoWarningOutline className="text-yellow-600" />,
          titleColor: "text-yellow-600",
        };
      case "success":
        return {
          confirmButton: "bg-green-600 hover:bg-green-700 text-white",
          icon: <IoCheckmarkCircleOutline className="text-green-600" />,
          titleColor: "text-green-600",
        };
      default:
        return {
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
          icon: <IoInformationCircleOutline className="text-blue-600" />,
          titleColor: "text-blue-600",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg text-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="backdrop-blur-sm border border-mainColor/30 ease-in-out bg-black/10 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <span className="text-2xl mr-3">{styles.icon}</span>
          <h3 className={`text-sm font-semibold ${styles.titleColor}`}>
            {title || "Confirmación"}
          </h3>
        </div>

        <div className="p-6 bg-white/60 backdrop-blur-sm">
          <p className="text-gray-800 leading-relaxed font-medium">{message}</p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm rounded-b-lg">
          <button
            onClick={handleCancel}
            className="px-4 py-2 font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-md shadow-sm hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
