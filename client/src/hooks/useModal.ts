import { useContext } from 'react';
import { ModalContext, ModalContextType } from '../store/modalContext';

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
