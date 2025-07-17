import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity backdrop-blur-sm"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose} // Close modal on backdrop click
    >
      {/* Modal Panel */}
      <div
        className="relative w-full max-w-lg transform rounded-lg bg-slate-800 text-left shadow-xl transition-all border border-slate-700"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-700 rounded-t">
          <h3 className="text-xl font-semibold text-white" id="modal-title">
            {title}
          </h3>
          <button
            type="button"
            className="p-1 ml-auto inline-flex items-center rounded-lg bg-transparent text-slate-400 hover:bg-slate-600 hover:text-white"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;