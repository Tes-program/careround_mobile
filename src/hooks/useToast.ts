import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastConfig {
  message: string;
  type: ToastType;
}

export interface ToastProps extends ToastConfig {
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function useToast(defaultDuration = 3000) {
  const [config, setConfig] = useState<ToastConfig>({ message: '', type: 'info' });
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((next: ToastConfig) => {
    setConfig(next);
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  const toastProps: ToastProps = {
    ...config,
    visible,
    onHide: hideToast,
    duration: defaultDuration,
  };

  return { showToast, toastProps, hideToast };
}
