const alertEmitter = new EventTarget();

export const showAppAlert = (message, options = {}) => {
  if (!message) return;
  alertEmitter.dispatchEvent(
    new CustomEvent('app-alert', {
      detail: {
        id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        message,
        type: options.type || 'error',
        duration: options.duration || 4500
      }
    })
  );
};

export const subscribeToAlerts = (callback) => {
  const handler = (event) => callback(event.detail);
  alertEmitter.addEventListener('app-alert', handler);
  return () => alertEmitter.removeEventListener('app-alert', handler);
};
