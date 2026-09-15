import { Button, Modal, ModalBody, ModalHeader } from "flowbite-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal show={open} size="md" onClose={onCancel} popup>
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mb-5 text-sm text-gray-500">{message}</p>
          <div className="flex justify-center gap-3">
            <Button color="failure" onClick={onConfirm} disabled={loading}>
              {loading ? "Working…" : confirmLabel}
            </Button>
            <Button color="light" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
