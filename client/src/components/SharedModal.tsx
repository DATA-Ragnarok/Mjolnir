import React from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { ModalOptions } from '../store/modalContext';

interface SharedModalProps {
  isOpen: boolean;
  content: React.ReactNode;
  options: ModalOptions;
  onClose: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

const SharedModal: React.FC<SharedModalProps> = ({ 
  isOpen, 
  content, 
  options, 
  onClose,
  onBack,
  canGoBack
}) => {
  if (!isOpen) return null;

  const { 
    maxWidth = 'md', 
    showCloseButton = true, 
    closeOnBackdropClick = true,
    ribbonColor
  } = options;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
          onClick={closeOnBackdropClick ? onClose : undefined}
        ></div>

        {/* Modal Panel */}
        <div className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full ${maxWidthClasses[maxWidth]} transform transition-all flex flex-col max-h-[90vh]`}>
          {/* Progress Ribbon */}
          {ribbonColor && (
            <div className={`h-1.5 w-full ${ribbonColor} transition-colors duration-500`}></div>
          )}

          {/* Header Actions - Now as a dedicated bar if navigation is present */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50 bg-white sticky top-0 z-20">
            <div>
              {canGoBack && (
                <button 
                  onClick={onBack} 
                  className="p-2 -ml-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all flex items-center gap-1.5 group"
                >
                  <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-wider">Back</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {showCloseButton && (
                <button 
                  onClick={onClose} 
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
          
          <div className="w-full overflow-y-auto custom-scrollbar">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedModal;
