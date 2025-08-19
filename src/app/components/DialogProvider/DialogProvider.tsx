"use client";

import React from "react";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import NotificationDialog from "../NotificationDialog/NotificationDialog";
import { useDialog } from "../../hooks/useDialog";

interface DialogProviderProps {
  children: React.ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const { confirmDialog, hideConfirm, notificationDialog, hideNotification } =
    useDialog();

  return (
    <>
      {children}

      <ConfirmDialog {...confirmDialog} onClose={hideConfirm} />

      <NotificationDialog {...notificationDialog} onClose={hideNotification} />
    </>
  );
};

export default DialogProvider;
