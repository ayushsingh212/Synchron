import React from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ConfirmModal: React.FC<Props> = ({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-7 rounded-xl shadow-xl w-full max-w-sm border border-blue-200 animate-[fadeIn_0.25s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-blue-600 text-center">{title}</h2>
        <p className="text-center text-gray-600 mt-3">{message}</p>

        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            onClick={onClose}
          >
            {cancelText}
          </button>

          <button
            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
