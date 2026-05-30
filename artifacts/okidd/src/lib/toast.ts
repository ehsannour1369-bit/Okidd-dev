type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners: Listener[] = [];

function notify() {
  listeners.forEach(l => l([...toasts]));
}

export function showToast(message: string, type: ToastType = "success") {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, 3500);
}

export function subscribeToasts(listener: Listener) {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i > -1) listeners.splice(i, 1);
  };
}
