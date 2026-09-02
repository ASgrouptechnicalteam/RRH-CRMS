import { useState, useEffect } from 'react';
import { BeforeInstallPromptEvent } from '../types';

let deferredPrompt: BeforeInstallPromptEvent | null = null;
type Listener = (prompt: BeforeInstallPromptEvent | null) => void;
let listeners: Listener[] = [];

// Listen globally
window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  listeners.forEach(l => l(deferredPrompt));
});

export const usePWAInstall = () => {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(deferredPrompt);

  useEffect(() => {
    const listener = (p: BeforeInstallPromptEvent | null) => setPrompt(p);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const install = async () => {
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      listeners.forEach(l => l(null));
      return true;
    }
    return false;
  };

  return {
    canInstall: !!prompt,
    install,
    promptEvent: prompt,
    dismiss: () => {
      deferredPrompt = null;
      listeners.forEach(l => l(null));
    }
  };
};
