import { defineStore } from "pinia";

const STORAGE_KEY_PREFIX = "wishlistItems";

function storageKey(ownerKey = "guest") {
  return `${STORAGE_KEY_PREFIX}:${ownerKey || "guest"}`;
}

function readWishlistItems(ownerKey = "guest") {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const items = JSON.parse(localStorage.getItem(storageKey(ownerKey)));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeWishlistItems(items, ownerKey = "guest") {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(storageKey(ownerKey), JSON.stringify(items));
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    thumbnail: product.thumbnail,
    avg_rating: product.avg_rating,
    vendor: product.vendor || null,
  };
}

export const useWishlistStore = defineStore("wishlist", {
  state: () => ({
    ownerKey: "guest",
    items: readWishlistItems("guest"),
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
      writeWishlistItems(this.items, this.ownerKey);
    },
    remove(productId) {
      this.items = this.items.filter((item) => item.id !== productId);
      writeWishlistItems(this.items, this.ownerKey);
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
      writeWishlistItems(this.items, this.ownerKey);
    },
    syncForUser(user) {
      const nextOwnerKey = user?.id ? `user:${user.id}` : user?.email ? `user:${user.email}` : "guest";
      if (nextOwnerKey === this.ownerKey) {
        return;
      }

      this.ownerKey = nextOwnerKey;
      this.items = readWishlistItems(this.ownerKey);
    },
  },
});
