const defaultToast = {
  open: true,
  variant: "default",
  autoHideDuration: 3000,
};

let queue = [];
const listeners = new Set();
const timeoutMap = new Map();

function emit() {
  listeners.forEach((listener) => listener());
}

function generateId() {
  return crypto.randomUUID();
}

export function getSnackbarQueue() {
  return queue;
}

export function subscribeSnackbar(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openSnackbar(toast) {
  const id = toast.id || generateId();
  const merged = { ...defaultToast, ...toast, id };

  queue = [...queue, merged].slice(-5);
  emit();

  const duration = merged.autoHideDuration;
  if (duration !== null && duration !== Infinity && duration > 0) {
    const prev = timeoutMap.get(id);
    if (prev) {
      clearTimeout(prev);
      timeoutMap.delete(id);
    }

    const timer = setTimeout(() => {
      closeSnackbar(id);
    }, duration);

    timeoutMap.set(id, timer);
  }

  return id;
}

export function closeSnackbar(id) {
  if (!id) {
    for (const [, timerId] of timeoutMap) {
      clearTimeout(timerId);
    }
    timeoutMap.clear();
    queue = [];
  } else {
    const timerId = timeoutMap.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timeoutMap.delete(id);
    }
    queue = queue.filter((toast) => toast.id !== id);
  }

  emit();
}
