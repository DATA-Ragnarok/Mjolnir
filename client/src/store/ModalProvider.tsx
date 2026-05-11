import React, { useState, ReactNode, useCallback } from 'react';
import { ModalContext, ModalOptions } from './modalContext';
import SharedModal from '../components/SharedModal';

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stack, setStack] = useState<Array<{ content: ReactNode; options: ModalOptions }>>([]);
  const isOpen = stack.length > 0;

  const openModal = useCallback((content: ReactNode, options: ModalOptions = {}) => {
    setStack((prev) => [...prev, { content, options }]);
  }, []);

  const setOptions = useCallback((newOptions: Partial<ModalOptions>) => {
    setStack((prev) => {
      if (prev.length === 0) return prev;
      const newStack = [...prev];
      const lastIndex = newStack.length - 1;
      newStack[lastIndex] = {
        ...newStack[lastIndex],
        options: { ...newStack[lastIndex].options, ...newOptions }
      };
      return newStack;
    });
  }, []);

  const closeModal = useCallback(() => {
    // Call onClose for all items in the stack from top to bottom
    [...stack].reverse().forEach(item => {
      item.options.onClose?.();
    });
    setStack([]);
  }, [stack]);

  const goBack = useCallback(() => {
    const poppedItem = stack[stack.length - 1];
    poppedItem?.options.onClose?.();
    setStack((prev) => prev.slice(0, -1));
  }, [stack]);

  const currentModal = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  const value = React.useMemo(() => ({
    openModal,
    setOptions,
    closeModal,
    goBack,
    canGoBack,
    isOpen
  }), [openModal, setOptions, closeModal, goBack, canGoBack, isOpen]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <SharedModal 
        isOpen={isOpen} 
        content={currentModal?.content || null} 
        options={currentModal?.options || {}} 
        onClose={closeModal}
        onBack={goBack}
        canGoBack={canGoBack}
      />
    </ModalContext.Provider>
  );
};
