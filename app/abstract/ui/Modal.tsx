"use client";

import { Modal as MantineModal } from "@mantine/core";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function Modal({
  title,
  onClose,
  children,
  maxWidth = 520,
}: ModalProps) {
  return (
    <MantineModal
      opened
      onClose={onClose}
      title={title}
      size={maxWidth}
      styles={{ body: { padding: "20px 24px" } }}
    >
      {children}
    </MantineModal>
  );
}
