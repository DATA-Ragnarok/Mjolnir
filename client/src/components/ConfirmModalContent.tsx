import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useModal } from '../hooks/useModal';

type ConfirmModalContentProps = {
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
};

const ConfirmModalContent: React.FC<ConfirmModalContentProps> = ({
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
}) => {
  const { closeModal } = useModal();

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-full ${confirmVariant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
          <AlertTriangle size={24} />
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-8 leading-relaxed">
        {message}
      </p>

      <div className="flex space-x-3">
        <button
          onClick={closeModal}
          className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            closeModal();
          }}
          className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
            confirmVariant === 'danger' 
              ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default ConfirmModalContent;
