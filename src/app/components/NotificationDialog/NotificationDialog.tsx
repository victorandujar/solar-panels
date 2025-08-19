"use client";

import React from "react";

export interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  buttonText?: string;
  variant?: "default" | "error" | "warning" | "success" | "info";
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "OK",
  variant = "default",
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "error":
        return {
          button: "bg-red-600 hover:bg-red-700 text-white",
          icon: "❌",
          titleColor: "text-red-600",
          borderColor: "border-red-200",
          bgColor: "bg-red-50",
        };
      case "warning":
        return {
          button: "bg-yellow-600 hover:bg-yellow-700 text-white",
          icon: "⚠️",
          titleColor: "text-yellow-600",
          borderColor: "border-yellow-200",
          bgColor: "bg-yellow-50",
        };
      case "success":
        return {
          button: "bg-green-600 hover:bg-green-700 text-white",
          icon: "✅",
          titleColor: "text-green-600",
          borderColor: "border-green-200",
          bgColor: "bg-green-50",
        };
      case "info":
        return {
          button: "bg-blue-600 hover:bg-blue-700 text-white",
          icon: "ℹ️",
          titleColor: "text-blue-600",
          borderColor: "border-blue-200",
          bgColor: "bg-blue-50",
        };
      default:
        return {
          button: "bg-gray-600 hover:bg-gray-700 text-white",
          icon: "💬",
          titleColor: "text-gray-600",
          borderColor: "border-gray-200",
          bgColor: "bg-gray-50",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center p-6 border-b ${styles.borderColor} ${styles.bgColor} rounded-t-lg`}
        >
          <span className="text-2xl mr-3">{styles.icon}</span>
          <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
            {title || "Notificación"}
          </h3>
        </div>

        <div className="p-6">
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className={`px-6 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${styles.button}`}
          >
            {buttonText}
          </button>
        </div>

        {autoClose && (
          <div className="h-1 bg-gray-200 overflow-hidden rounded-b-lg">
            <div
              className={`h-full transition-all ease-linear ${styles.button.split(" ")[0]} opacity-60`}
              style={{
                animation: `shrink ${autoCloseDelay}ms linear`,
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationDialog;
