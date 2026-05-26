<script setup>
import { computed, ref, watch } from "vue";

import VendorProductImageGallery from "./VendorProductImageGallery.vue";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const mode = ref("create");
const authToken = ref("");
const targetSlug = ref("macbook-air-13-m3");
const product = ref({
  name: "MacBook Air 13 M3",
  slug: "macbook-air-13-m3",
  sku: "MBA13-M3-256",
  brand: 1,
  category: 1,
  status: "draft",
  base_price: "1099.00",
});
const specsJson = ref(
  JSON.stringify(
    {
      cpu: "Apple M3",
      ram: "16GB",
      storage: "512GB SSD",
      display: "13.6 inch Liquid Retina",
    },
    null,
    2
  )
);
const images = ref([
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    thumbnail:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80",
    alt_text: "MacBook laptop open on desk",
    sort_order: 0,
    is_primary: true,
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
    thumbnail:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80",
    alt_text: "Laptop keyboard and screen",
    sort_order: 1,
    is_primary: false,
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80",
    thumbnail:
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=300&q=80",
    alt_text: "Laptop with accessories",
    sort_order: 2,
    is_primary: false,
  },
]);
const saveState = ref("idle");
const responseMessage = ref("");
const shouldShowPayload = ref(false);

const endpointUrl = computed(() => {
  if (mode.value === "update") {
    return `${apiBaseUrl}/api/v1/catalog/products/${targetSlug.value}/`;
  }

  return `${apiBaseUrl}/api/v1/catalog/products/`;
});

const requestMethod = computed(() => (mode.value === "update" ? "PUT" : "POST"));

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

const productPayload = computed(() => ({
  name: product.value.name.trim(),
  slug: product.value.slug.trim(),
  sku: product.value.sku.trim(),
  brand: Number(product.value.brand),
  category: Number(product.value.category),
  status: product.value.status,
  base_price: product.value.base_price,
  tech_specs: parsedSpecs.value.value,
}));

const reorderPayload = computed(() => ({
  images: images.value.map((image) => ({
    id: image.id,
    sort_order: image.sort_order,
    alt_text: image.alt_text,
    is_primary: image.is_primary,
  })),
}));

const hasValidProductPayload = computed(() => {
  return Boolean(
    productPayload.value.name &&
    productPayload.value.slug &&
    productPayload.value.sku &&
    productPayload.value.brand &&
    productPayload.value.category &&
    productPayload.value.base_price &&
    parsedSpecs.value.value
  );
});

function formatSpecs() {
  if (!parsedSpecs.value.value) {
    return;
  }

  specsJson.value = JSON.stringify(parsedSpecs.value.value, null, 2);
}

async function saveProduct() {
  shouldShowPayload.value = true;

  if (!hasValidProductPayload.value) {
    responseMessage.value = "Fix the product fields before saving.";
    return;
  }

  saveState.value = "saving";
  responseMessage.value = "";

  try {
    const response = await fetch(endpointUrl.value, {
      method: requestMethod.value,
      headers: {
        "Content-Type": "application/json",
        ...(authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}),
      },
      body: JSON.stringify(productPayload.value),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(JSON.stringify(errorPayload, null, 2) || "Could not save product.");
    }

    const savedProduct = await response.json();
    product.value.slug = savedProduct.slug;
    targetSlug.value = savedProduct.slug;
    product.value.status = savedProduct.status;
    responseMessage.value = "Product saved.";
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
  <section class="min-w-0 flex-1 px-6 py-5">
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div>
        <h1 class="text-xl font-semibold text-slate-950">Product Management</h1>
        <p class="mt-1 text-sm text-slate-500">
          Create and update catalog products for the current tenant.
        </p>
      </div>

      <div class="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          class="rounded px-3 py-1.5 text-sm font-semibold"
          :class="
            mode === 'create'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="mode = 'create'"
        >
          Create
        </button>
        <button
          type="button"
          class="rounded px-3 py-1.5 text-sm font-semibold"
          :class="
            mode === 'update'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="mode = 'update'"
        >
          Update
        </button>
      </div>
    </div>

    <form class="grid gap-5 py-5 xl:grid-cols-[minmax(0,1fr)_360px]" @submit.prevent="saveProduct">
      <div class="space-y-5">
        <section class="rounded-md border border-slate-200 bg-white">
          <div class="border-b border-slate-200 px-4 py-3">
            <h2 class="text-sm font-semibold text-slate-950">Product fields</h2>
          </div>

          <div class="grid gap-4 p-4 md:grid-cols-2">
            <label class="block">
              <span class="text-xs font-medium text-slate-600">Name</span>
              <input
                v-model="product.name"
                type="text"
                class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label class="block">
              <span class="text-xs font-medium text-slate-600">Slug</span>
              <input
                v-model="product.slug"
                type="text"
                class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label class="block">
              <span class="text-xs font-medium text-slate-600">SKU</span>
              <input
                v-model="product.sku"
                type="text"
                class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label class="block">
              <span class="text-xs font-medium text-slate-600">Base price</span>
              <input
                v-model="product.base_price"
                type="number"
                min="0"
                step="0.01"
                class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label class="block">
              <span class="text-xs font-medium text-slate-600">Brand ID</span>
              <input
                v-model.number="product.brand"
                type="number"
                min="1"
                class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label class="block">
              <span class="text-xs font-medium text-slate-600">Category ID</span>
              <input
                v-model.number="product.category"
                type="number"
                min="1"
                class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </label>

            <label class="block md:col-span-2">
              <span class="text-xs font-medium text-slate-600">Status</span>
              <select
                v-model="product.status"
                class="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>
        </section>

        <section class="rounded-md border border-slate-200 bg-white">
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
          >
            <h2 class="text-sm font-semibold text-slate-950">Tech specs JSON</h2>
            <button
              type="button"
              class="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              :disabled="Boolean(parsedSpecs.error)"
              @click="formatSpecs"
            >
              Format JSON
            </button>
          </div>

          <div class="p-4">
            <textarea
              v-model="specsJson"
              spellcheck="false"
              class="min-h-72 w-full resize-y rounded-md border bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-slate-500"
              :class="parsedSpecs.error ? 'border-red-300' : 'border-slate-800'"
            ></textarea>
            <p
              v-if="parsedSpecs.error"
              class="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {{ parsedSpecs.error }}
            </p>
          </div>
        </section>

        <VendorProductImageGallery v-model="images" />
      </div>

      <aside class="space-y-5">
        <section class="rounded-md border border-slate-200 bg-white p-4">
          <h2 class="text-sm font-semibold text-slate-950">Save product</h2>
          <dl class="mt-4 space-y-3 text-sm">
            <div v-if="mode === 'update'" class="space-y-1">
              <dt class="text-slate-500">Current slug</dt>
              <dd>
                <input
                  v-model="targetSlug"
                  type="text"
                  class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-slate-500">Method</dt>
              <dd class="font-semibold text-slate-950">{{ requestMethod }}</dd>
            </div>
            <div class="space-y-1">
              <dt class="text-slate-500">Endpoint</dt>
              <dd class="break-all font-mono text-xs text-slate-700">{{ endpointUrl }}</dd>
            </div>
            <div class="space-y-1">
              <dt class="text-slate-500">Bearer token</dt>
              <dd>
                <input
                  v-model="authToken"
                  type="password"
                  class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </dd>
            </div>
          </dl>

          <button
            type="submit"
            class="mt-4 w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="saveState === 'saving' || !hasValidProductPayload"
          >
            {{ saveState === "saving" ? "Saving..." : "Save product" }}
          </button>

          <p
            v-if="responseMessage"
            class="mt-3 rounded-md px-3 py-2 text-sm"
            :class="
              saveState === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            "
          >
            {{ responseMessage }}
          </p>
        </section>

        <section class="rounded-md border border-slate-200 bg-slate-950 p-4 text-slate-100">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold">Product payload</h2>
            <button
              type="button"
              class="rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
              @click="shouldShowPayload = !shouldShowPayload"
            >
              {{ shouldShowPayload ? "Hide" : "Show" }}
            </button>
          </div>
          <pre
            v-if="shouldShowPayload"
            class="mt-3 max-h-80 overflow-auto rounded-md bg-black/30 p-3 text-xs leading-5"
            >{{ JSON.stringify(productPayload, null, 2) }}</pre
          >
        </section>

        <section class="rounded-md border border-slate-200 bg-slate-950 p-4 text-slate-100">
          <h2 class="text-sm font-semibold">Image reorder payload</h2>
          <pre class="mt-3 max-h-64 overflow-auto rounded-md bg-black/30 p-3 text-xs leading-5">{{
            JSON.stringify(reorderPayload, null, 2)
          }}</pre>
        </section>
      </aside>
    </form>
  </section>
</template>
