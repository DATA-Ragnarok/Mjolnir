import { createContext, ReactNode } from 'react';

export interface ModalOptions {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  onClose?: () => void;
  ribbonColor?: string;
}

export interface ModalContextType {
  openModal: (content: ReactNode, options?: ModalOptions) => void;
  setOptions: (options: Partial<ModalOptions>) => void;
  closeModal: () => void;
  goBack: () => void;
  canGoBack: boolean;
  isOpen: boolean;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);
