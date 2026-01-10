import { useEffect } from 'react';

export const useKeyboardShortcuts = (handlers: {
  onSpace?: () => void;
  onReset?: () => void;
  onSkip?: () => void;
  onPreset1?: () => void;
  onPreset2?: () => void;
  onPreset3?: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case ' ':
          event.preventDefault();
          handlers.onSpace?.();
          break;
        case 'r':
          event.preventDefault();
          handlers.onReset?.();
          break;
        case 's':
          event.preventDefault();
          handlers.onSkip?.();
          break;
        case '1':
          event.preventDefault();
          handlers.onPreset1?.();
          break;
        case '2':
          event.preventDefault();
          handlers.onPreset2?.();
          break;
        case '3':
          event.preventDefault();
          handlers.onPreset3?.();
          break;
      }
    };

    // Only add listener on web
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handlers]);
};
