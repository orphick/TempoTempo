import { create } from "zustand";
import api from "../api/axios";
import useToastStore from "./useToastStore";

const useWishlistStore = create((set, get) => ({
  items: [],
  productIds: new Set(),

  fetchWishlist: async () => {
    try {
      const res = await api.get("/wishlist/");
      const items = res.data;
      set({
        items,
        productIds: new Set(items.map((p) => p.id)),
      });
    } catch {
      set({ items: [], productIds: new Set() });
    }
  },

  toggle: async (productId) => {
    const { productIds } = get();
    const addToast = useToastStore.getState().addToast;
    if (productIds.has(productId)) {
      await api.delete(`/wishlist/${productId}/`);
      set((state) => {
        const newIds = new Set(state.productIds);
        newIds.delete(productId);
        return {
          items: state.items.filter((p) => p.id !== productId),
          productIds: newIds,
        };
      });
      addToast("از علاقه‌مندی‌ها حذف شد", "info");
    } else {
      await api.post("/wishlist/", { product_id: productId });
      set((state) => {
        const newIds = new Set(state.productIds);
        newIds.add(productId);
        return { productIds: newIds };
      });
      addToast("به علاقه‌مندی‌ها اضافه شد", "success");
      get().fetchWishlist();
    }
  },

  isWishlisted: (productId) => get().productIds.has(productId),
}));

export default useWishlistStore;
