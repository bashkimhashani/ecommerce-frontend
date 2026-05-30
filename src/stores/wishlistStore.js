import { defineStore } from "pinia";

const STORAGE_KEY = "wishlistItems";

function readWishlistItems() {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeWishlistItems(items) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function normalizeProduct(product) {
  const firstImage = Array.isArray(product.images) ? product.images[0] : null;
  const thumbnail =
    product.thumbnail ||
    product.product_thumbnail ||
    product.image_url ||
    product.image ||
    product.primary_image ||
    firstImage?.thumbnail ||
    firstImage?.medium ||
    firstImage?.large ||
    firstImage?.image ||
    "";

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    thumbnail,
    avg_rating: product.avg_rating,
    vendor: product.vendor || null,
    vendor_name: product.vendor_name || product.vendor?.store_name || "",
  };
}

export const useWishlistStore = defineStore("wishlist", {
  state: () => ({
    items: readWishlistItems(),
  }),
  getters: {
    count: (state) => state.items.length,
  },
  actions: {
    has(productId) {
      return this.items.some((item) => item.id === productId);
    },
    add(product) {
      if (!product?.id || this.has(product.id)) {
        return;
      }

      this.items = [normalizeProduct(product), ...this.items];
      writeWishlistItems(this.items);
    },
    remove(productId) {
      this.items = this.items.filter((item) => item.id !== productId);
      writeWishlistItems(this.items);
    },
    update(product) {
      if (!product?.id) {
        return;
      }

      this.items = this.items.map((item) =>
        item.id === product.id ? { ...item, ...normalizeProduct({ ...item, ...product }) } : item
      );
      writeWishlistItems(this.items);
    },
    toggle(product) {
      if (this.has(product.id)) {
        this.remove(product.id);
        return false;
      }

      this.add(product);
      return true;
    },
    clear() {
      this.items = [];
      writeWishlistItems(this.items);
    },
  },
});
