"use client";

import { useState, useCallback } from "react";
import { ConfirmDialogProps } from "../components/ConfirmDialog/ConfirmDialog";
import { NotificationDialogProps } from "../components/NotificationDialog/NotificationDialog";

interface UseDialogReturn {
  confirmDialog: Omit<ConfirmDialogProps, "onClose"> & {
    isOpen: boolean;
    onConfirm: () => void;
  };
  showConfirm: (
    options: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">,
  ) => Promise<boolean>;
  hideConfirm: () => void;

  notificationDialog: Omit<NotificationDialogProps, "onClose"> & {
    isOpen: boolean;
  };
  showNotification: (
    options: Omit<NotificationDialogProps, "isOpen" | "onClose">,
  ) => void;
  hideNotification: () => void;
}

export const useDialog = (): UseDialogReturn => {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { message: "" },
  });

  const [notificationState, setNotificationState] = useState<{
    isOpen: boolean;
    options: Omit<NotificationDialogProps, "isOpen" | "onClose">;
  }>({
    isOpen: false,
    options: { message: "" },
  });

  const showConfirm = useCallback(
    (
      options: Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">,
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmState({
          isOpen: true,
          options,
          resolve,
        });
      });
    },
    [],
  );

  const hideConfirm = useCallback(() => {
    setConfirmState((prev) => {
      if (prev.resolve) {
        prev.resolve(false);
      }
      return {
        ...prev,
        isOpen: false,
        resolve: undefined,
      };
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setConfirmState((prev) => {
      if (prev.resolve) {
        prev.resolve(true);
      }
      return {
        ...prev,
        isOpen: false,
        resolve: undefined,
      };
    });
  }, []);

  const showNotification = useCallback(
    (options: Omit<NotificationDialogProps, "isOpen" | "onClose">) => {
      setNotificationState({
        isOpen: true,
        options,
      });
    },
    [],
  );

  const hideNotification = useCallback(() => {
    setNotificationState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return {
    confirmDialog: {
      ...confirmState.options,
      isOpen: confirmState.isOpen,
      onConfirm: handleConfirm,
    },
    showConfirm,
    hideConfirm,

    notificationDialog: {
      ...notificationState.options,
      isOpen: notificationState.isOpen,
    },
    showNotification,
    hideNotification,
  };
};

export const useConfirm = () => {
  const { showConfirm } = useDialog();

  return useCallback(
    async (
      message: string,
      options?: {
        title?: string;
        confirmText?: string;
        cancelText?: string;
        variant?: "default" | "danger" | "warning" | "success";
      },
    ): Promise<boolean> => {
      return showConfirm({
        message,
        ...options,
      });
    },
    [showConfirm],
  );
};

export const useNotify = () => {
  const { showNotification } = useDialog();

  return useCallback(
    (
      message: string,
      options?: {
        title?: string;
        variant?: "default" | "error" | "warning" | "success" | "info";
        autoClose?: boolean;
        autoCloseDelay?: number;
      },
    ) => {
      showNotification({
        message,
        ...options,
      });
    },
    [showNotification],
  );
};
