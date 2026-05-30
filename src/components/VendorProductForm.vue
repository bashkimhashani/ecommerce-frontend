<script setup>
import { computed, ref, watch } from "vue";
import { useAuthStore } from "../stores/authStore";

import VendorProductImageGallery from "./VendorProductImageGallery.vue";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const authStore = useAuthStore();

const blankProduct = {
  name: "",
  slug: "",
  sku: "",
  brandName: "",
  categoryName: "General",
  status: "draft",
  base_price: "",
  stockQuantity: 0,
  color: "",
  storage: "",
  ram: "",
};

const mode = ref("create");
const targetSlug = ref("");
const product = ref({ ...blankProduct });
const specsJson = ref(
  JSON.stringify(
    {
      cpu: "",
      ram: "",
      storage: "",
      display: "",
    },
    null,
    2
  )
);
const images = ref([]);
const saveState = ref("idle");
const responseMessage = ref("");
const shouldShowPayload = ref(false);

const endpointUrl = computed(() => {
  if (mode.value === "update") {
    return `${apiBaseUrl}/api/v1/catalog/products/${targetSlug.value || product.value.slug}/`;
  }

  return `${apiBaseUrl}/api/v1/catalog/products/`;
});

const requestMethod = computed(() => (mode.value === "update" ? "PUT" : "POST"));
const primaryImage = computed(() => {
  return images.value.find((image) => image.is_primary) || images.value[0] || null;
});
const previewImage = computed(() => {
  return primaryImage.value?.previewUrl || primaryImage.value?.image || primaryImage.value?.thumbnail || "";
});
const previewPrice = computed(() => {
  const price = Number(product.value.base_price || 0);
  return price
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price)
    : "$0.00";
});
const previewVendor = computed(() => {
  return product.value.brandName || authStore.user?.tenant_name || authStore.user?.tenant || "Vendor";
});

const parsedSpecs = computed(() => {
  try {
    return {
      value: JSON.parse(specsJson.value || "{}"),
      error: "",
    };
  } catch (error) {
    return {
      value: null,
      error: error.message,
    };
  }
});

const specRows = computed(() => {
  return Object.entries(parsedSpecs.value.value || {}).filter(([, value]) => String(value).trim());
});

const productPayload = computed(() => ({
  name: product.value.name.trim(),
  slug: product.value.slug.trim(),
  sku: product.value.sku.trim(),
  brand_name: product.value.brandName.trim(),
  category_name: product.value.categoryName.trim(),
  status: product.value.status,
  base_price: product.value.base_price,
  stock_quantity: Number(product.value.stockQuantity || 0),
  color: product.value.color.trim(),
  storage: product.value.storage.trim(),
  ram: product.value.ram.trim(),
  tech_specs: parsedSpecs.value.value,
}));

const reorderPayload = computed(() => ({
  images: images.value
    .filter((image) => !image.file)
    .map((image) => ({
      id: image.id,
      sort_order: image.sort_order,
      alt_text: image.alt_text,
      is_primary: image.is_primary,
    })),
}));

const localImages = computed(() => images.value.filter((image) => image.file));
const hasValidProductPayload = computed(() => {
  return Boolean(
      productPayload.value.name &&
      productPayload.value.slug &&
      productPayload.value.sku &&
      productPayload.value.category_name &&
      productPayload.value.base_price &&
      parsedSpecs.value.value
  );
});

function authHeaders(contentType = "application/json") {
  return {
    ...(contentType ? { "Content-Type": contentType } : {}),
    ...(authStore.accessToken ? { Authorization: `Bearer ${authStore.accessToken}` } : {}),
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function syncSlugFromName() {
  if (!product.value.slug.trim() || mode.value === "create") {
    product.value.slug = slugify(product.value.name);
  }
}

function formatSpecs() {
  if (!parsedSpecs.value.value) return;
  specsJson.value = JSON.stringify(parsedSpecs.value.value, null, 2);
}

function resetForm() {
  product.value = { ...blankProduct };
  targetSlug.value = "";
  images.value = [];
  specsJson.value = JSON.stringify(
    {
      cpu: "",
      ram: "",
      storage: "",
      display: "",
    },
    null,
    2
  );
  responseMessage.value = "";
  saveState.value = "idle";
}

function parseSaveError(payload) {
  if (payload?.detail) return payload.detail;

  const firstField = Object.keys(payload || {})[0];
  const firstError = firstField ? payload[firstField] : "";
  if (Array.isArray(firstError)) return firstError[0];
  if (typeof firstError === "string") return firstError;

  return "Could not save product.";
}

async function uploadLocalImages(slug) {
  if (!localImages.value.length) return;

  await Promise.all(
    localImages.value.map(async (image, index) => {
      const formData = new FormData();
      formData.append("image", image.file);
      formData.append("alt_text", image.alt_text || product.value.name || "Product image");
      formData.append("sort_order", String(index));
      formData.append("is_primary", String(Boolean(image.is_primary || index === 0)));

      const response = await fetch(`${apiBaseUrl}/api/v1/catalog/products/${slug}/images/`, {
        method: "POST",
        headers: authHeaders(null),
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(parseSaveError(payload));
      }
    })
  );
}

async function saveProduct() {
  shouldShowPayload.value = false;

  if (!hasValidProductPayload.value) {
    responseMessage.value = "Complete the required product details first.";
    saveState.value = "error";
    return;
  }

  saveState.value = "saving";
  responseMessage.value = "";

  try {
    const response = await fetch(endpointUrl.value, {
      method: requestMethod.value,
      headers: authHeaders(),
      body: JSON.stringify(productPayload.value),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(parseSaveError(payload));
    }

    await uploadLocalImages(payload.slug);
    product.value.slug = payload.slug;
    targetSlug.value = payload.slug;
    product.value.status = payload.status;
    responseMessage.value = localImages.value.length
      ? "Product and images saved."
      : "Product saved.";
    saveState.value = "saved";
  } catch (error) {
    responseMessage.value = error.message || "Could not save product.";
    saveState.value = "error";
  }
}

watch(mode, () => {
  targetSlug.value = product.value.slug;
  responseMessage.value = "";
  saveState.value = "idle";
});
</script>

<template>
  <section class="min-w-0 flex-1 px-4 py-4 sm:px-5">
    <div
      class="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-950"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800"
      >
        <div>
          <p class="text-xs font-black uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
            Vendor listing
          </p>
          <h1 class="mt-1 text-xl font-black text-slate-950 dark:text-white">
            Product composer
          </h1>
        </div>

        <div class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            class="rounded-md px-3 py-2 text-sm font-black transition"
            :class="
              mode === 'create'
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-100 dark:text-slate-950'
                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            "
            @click="mode = 'create'"
          >
            Create
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-2 text-sm font-black transition"
            :class="
              mode === 'update'
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-100 dark:text-slate-950'
                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            "
            @click="mode = 'update'"
          >
            Update
          </button>
        </div>
      </div>

      <form
        class="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]"
        @submit.prevent="saveProduct"
      >
        <div class="space-y-5">
          <section
            class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-sm font-black text-slate-950 dark:text-white">Listing details</h2>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Required information for the catalog card and product page.
                </p>
              </div>
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-cyan-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white"
                @click="resetForm"
              >
                Clear
              </button>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="block md:col-span-2">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Product name
                </span>
                <input
                  v-model="product.name"
                  type="text"
                  placeholder="Apple MacBook Air 13 M3"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                  @blur="syncSlugFromName"
                />
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Slug
                </span>
                <input
                  v-model="product.slug"
                  type="text"
                  placeholder="apple-macbook-air-13-m3"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  SKU
                </span>
                <input
                  v-model="product.sku"
                  type="text"
                  placeholder="MBA13-M3-256"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Price
                </span>
                <input
                  v-model="product.base_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1099.00"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Status
                </span>
                <select
                  v-model="product.status"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-950/60"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Brand
                </span>
                <input
                  v-model="product.brandName"
                  type="text"
                  placeholder="Apple"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Category
                </span>
                <input
                  v-model="product.categoryName"
                  type="text"
                  placeholder="Laptops"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Stock quantity
                </span>
                <input
                  v-model.number="product.stockQuantity"
                  type="number"
                  min="0"
                  placeholder="24"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Color
                </span>
                <input
                  v-model="product.color"
                  type="text"
                  placeholder="Space Gray"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Storage
                </span>
                <input
                  v-model="product.storage"
                  type="text"
                  placeholder="512GB SSD"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>

              <label class="block">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  RAM
                </span>
                <input
                  v-model="product.ram"
                  type="text"
                  placeholder="16GB"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>

              <label v-if="mode === 'update'" class="block md:col-span-2">
                <span class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Product to update
                </span>
                <input
                  v-model="targetSlug"
                  type="text"
                  placeholder="existing-product-slug"
                  class="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600 dark:focus:ring-cyan-950/60"
                />
              </label>
            </div>
          </section>

          <section
            class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-black text-slate-950 dark:text-white">Technical specs</h2>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Keep it as JSON so the product page can render structured details.
                </p>
              </div>
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-cyan-300 hover:text-slate-950 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white"
                :disabled="Boolean(parsedSpecs.error)"
                @click="formatSpecs"
              >
                Format
              </button>
            </div>

            <textarea
              v-model="specsJson"
              spellcheck="false"
              class="min-h-48 w-full resize-y rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-950/60"
              :class="parsedSpecs.error ? 'border-red-400' : 'border-slate-800'"
            ></textarea>
            <p
              v-if="parsedSpecs.error"
              class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            >
              {{ parsedSpecs.error }}
            </p>
          </section>

          <VendorProductImageGallery v-model="images" />
        </div>

        <aside class="space-y-5 xl:sticky xl:top-4 xl:self-start">
          <section
            class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="aspect-[4/3] bg-slate-100 dark:bg-slate-950">
              <img
                v-if="previewImage"
                :src="previewImage"
                :alt="product.name || 'Product preview'"
                class="h-full w-full object-contain p-5"
              />
              <div v-else class="flex h-full items-center justify-center px-8 text-center">
                <p class="text-sm font-semibold text-slate-400">
                  Upload a primary product image to preview the listing.
                </p>
              </div>
            </div>
            <div class="space-y-3 p-4">
              <div class="flex items-center justify-between gap-3">
                <span
                  class="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-200"
                >
                  {{ product.status || "draft" }}
                </span>
                <span
                  class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                >
                  {{ Number(product.stockQuantity || 0) }} in stock
                </span>
                <span class="text-sm font-black text-slate-950 dark:text-white">
                  {{ previewPrice }}
                </span>
              </div>
              <div>
                <h3 class="line-clamp-2 text-lg font-black text-slate-950 dark:text-white">
                  {{ product.name || "Product name" }}
                </h3>
                <p class="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                  {{ product.slug || "product-slug" }}
                </p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span
                    class="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600 dark:bg-slate-950 dark:text-slate-300"
                  >
                    {{ product.categoryName || "General" }}
                  </span>
                  <span
                    class="max-w-full truncate rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-black text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-200"
                  >
                    {{ previewVendor }}
                  </span>
                </div>
              </div>
              <dl class="grid grid-cols-3 gap-2 text-xs">
                <div class="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
                  <dt class="font-black uppercase text-slate-400">Color</dt>
                  <dd class="mt-1 truncate font-semibold text-slate-700 dark:text-slate-200">
                    {{ product.color || "-" }}
                  </dd>
                </div>
                <div class="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
                  <dt class="font-black uppercase text-slate-400">Storage</dt>
                  <dd class="mt-1 truncate font-semibold text-slate-700 dark:text-slate-200">
                    {{ product.storage || "-" }}
                  </dd>
                </div>
                <div class="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
                  <dt class="font-black uppercase text-slate-400">RAM</dt>
                  <dd class="mt-1 truncate font-semibold text-slate-700 dark:text-slate-200">
                    {{ product.ram || "-" }}
                  </dd>
                </div>
              </dl>
              <dl v-if="specRows.length" class="grid grid-cols-2 gap-2 text-xs">
                <div
                  v-for="[key, value] in specRows.slice(0, 4)"
                  :key="key"
                  class="rounded-lg bg-slate-50 p-2 dark:bg-slate-950"
                >
                  <dt class="font-black uppercase text-slate-400">{{ key }}</dt>
                  <dd class="mt-1 truncate font-semibold text-slate-700 dark:text-slate-200">
                    {{ value }}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-black text-slate-950 dark:text-white">Publish controls</h2>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {{ requestMethod }} product request
                </p>
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-xs font-black"
                :class="
                  authStore.accessToken
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200'
                "
              >
                {{ authStore.accessToken ? "Signed in" : "No session" }}
              </span>
            </div>

            <button
              type="submit"
              class="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-200"
              :disabled="saveState === 'saving' || !hasValidProductPayload"
            >
              {{ saveState === "saving" ? "Saving..." : mode === "update" ? "Update listing" : "Create listing" }}
            </button>

            <p
              v-if="responseMessage"
              class="mt-3 rounded-lg border px-3 py-2 text-sm font-semibold"
              :class="
                saveState === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
              "
            >
              {{ responseMessage }}
            </p>
          </section>

          <section
            class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between text-left text-sm font-black text-slate-950 dark:text-white"
              @click="shouldShowPayload = !shouldShowPayload"
            >
              Developer payload
              <span class="text-xs text-slate-500">{{ shouldShowPayload ? "Hide" : "Show" }}</span>
            </button>
            <pre
              v-if="shouldShowPayload"
              class="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs leading-5 text-slate-100"
              >{{ JSON.stringify({ product: productPayload, reorder: reorderPayload }, null, 2) }}</pre
            >
          </section>
        </aside>
      </form>
    </div>
  </section>
</template>
