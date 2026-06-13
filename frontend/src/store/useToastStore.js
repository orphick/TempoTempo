import { create } from "zustand";

let id = 0;

const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = "success") => {
    const toastId = ++id;
    set((state) => ({
      toasts: [...state.toasts, { id: toastId, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== toastId),
      }));
    }, 3500);
  },

  removeToast: (toastId) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== toastId),
    }));
  },
}));

export default useToastStore;
