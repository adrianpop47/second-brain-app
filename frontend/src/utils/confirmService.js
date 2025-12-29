const confirmEmitter = new EventTarget();

export const confirmAction = ({
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  options = null
} = {}) => {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  return new Promise((resolve) => {
    const responseHandler = (event) => {
      if (event.detail.id === id) {
        resolve(event.detail.result);
        confirmEmitter.removeEventListener('confirm-response', responseHandler);
      }
    };

    confirmEmitter.addEventListener('confirm-response', responseHandler);
    confirmEmitter.dispatchEvent(
      new CustomEvent('confirm-request', {
        detail: { id, title, message, confirmLabel, cancelLabel, tone, options }
      })
    );
  });
};

export const subscribeToConfirmations = (callback) => {
  const handler = (event) => callback(event.detail);
  confirmEmitter.addEventListener('confirm-request', handler);
  return () => confirmEmitter.removeEventListener('confirm-request', handler);
};

export const sendConfirmResponse = (id, result) => {
  confirmEmitter.dispatchEvent(
    new CustomEvent('confirm-response', {
      detail: { id, result }
    })
  );
};
