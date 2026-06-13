import { create } from "zustand";
import api from "../api/axios";
import useToastStore from "./useToastStore";

const useCartStore = create((set) => ({
  cart: null,
  itemCount: 0,

  fetchCart: async () => {
    try {
      const res = await api.get("/cart/");
      set({ cart: res.data, itemCount: res.data.items.length });
    } catch {
      set({ cart: null, itemCount: 0 });
    }
  },

  addToCart: async (variantId, quantity = 1) => {
    const res = await api.post("/cart/", { variant_id: variantId, quantity });
    set({ cart: res.data, itemCount: res.data.items.length });
    useToastStore.getState().addToast("محصول به سبد خرید اضافه شد", "success");
  },

  removeFromCart: async (itemId) => {
    const res = await api.delete(`/cart/${itemId}/`);
    set({ cart: res.data, itemCount: res.data.items.length });
    useToastStore.getState().addToast("محصول از سبد خرید حذف شد", "info");
  },

  updateQuantity: async (itemId, quantity) => {
    const res = await api.patch(`/cart/${itemId}/`, { quantity });
    set({ cart: res.data, itemCount: res.data.items.length });
  },
}));

export default useCartStore;
