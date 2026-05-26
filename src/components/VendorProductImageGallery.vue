<script setup>
import { computed, onBeforeUnmount, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "reorder", "remove", "set-primary", "upload"]);

const fileInput = ref(null);
const draggedImageId = ref(null);
const objectUrls = new Set();

const sortedImages = computed(() => {
  return [...props.modelValue].sort((first, second) => {
    return first.sort_order - second.sort_order || first.id - second.id;
  });
});

function imageSource(image) {
  return image.thumbnail || image.medium || image.image || image.previewUrl;
}

function normalizeSortOrder(images) {
  return images.map((image, index) => ({
    ...image,
    sort_order: index,
  }));
}

function updateImages(images) {
  const normalizedImages = normalizeSortOrder(images);
  emit("update:modelValue", normalizedImages);
  emit("reorder", normalizedImages);
}

function moveImage(targetImageId) {
  if (!draggedImageId.value || draggedImageId.value === targetImageId) {
    draggedImageId.value = null;
    return;
  }

  const images = [...sortedImages.value];
  const fromIndex = images.findIndex((image) => image.id === draggedImageId.value);
  const toIndex = images.findIndex((image) => image.id === targetImageId);

  if (fromIndex === -1 || toIndex === -1) {
    draggedImageId.value = null;
    return;
  }

  const [movedImage] = images.splice(fromIndex, 1);
  images.splice(toIndex, 0, movedImage);
  draggedImageId.value = null;
  updateImages(images);
}

function updateAltText(imageId, altText) {
  const images = sortedImages.value.map((image) => {
    if (image.id !== imageId) {
      return image;
    }

    return {
      ...image,
      alt_text: altText,
    };
  });

  emit("update:modelValue", images);
}

function setPrimary(imageId) {
  const images = sortedImages.value.map((image) => ({
    ...image,
    is_primary: image.id === imageId,
  }));

  emit("update:modelValue", images);
  emit(
    "set-primary",
    images.find((image) => image.id === imageId)
  );
}

function removeImage(imageId) {
  const imageToRemove = sortedImages.value.find((image) => image.id === imageId);
  const images = normalizeSortOrder(sortedImages.value.filter((image) => image.id !== imageId));

  if (imageToRemove?.previewUrl) {
    URL.revokeObjectURL(imageToRemove.previewUrl);
    objectUrls.delete(imageToRemove.previewUrl);
  }

  const hasPrimaryImage = images.some((image) => image.is_primary);
  const nextImages = images.map((image, index) => ({
    ...image,
    is_primary: hasPrimaryImage ? image.is_primary : index === 0,
  }));

  emit("update:modelValue", nextImages);
  emit("remove", imageToRemove);
}

function openFilePicker() {
  fileInput.value?.click();
}

function handleFileSelection(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) {
    return;
  }

  const currentImages = sortedImages.value;
  const nextImages = files.map((file, index) => {
    const previewUrl = URL.createObjectURL(file);
    objectUrls.add(previewUrl);

    return {
      id: `local-${Date.now()}-${index}`,
      file,
      image: previewUrl,
      previewUrl,
      alt_text: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      sort_order: currentImages.length + index,
      is_primary: currentImages.length === 0 && index === 0,
    };
  });

  const images = normalizeSortOrder([...currentImages, ...nextImages]);
  emit("update:modelValue", images);
  emit("upload", files);
  event.target.value = "";
}

onBeforeUnmount(() => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
});
</script>

<template>
  <section class="rounded-md border border-slate-200 bg-white">
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"
    >
      <div>
        <h2 class="text-sm font-semibold text-slate-950">Product images</h2>
        <p class="mt-1 text-xs text-slate-500">Drag images to reorder them.</p>
      </div>

      <button
        type="button"
        class="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        @click="openFilePicker"
      >
        Upload images
      </button>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleFileSelection"
      />
    </div>

    <div v-if="!sortedImages.length" class="px-4 py-10 text-center">
      <p class="text-sm font-medium text-slate-700">No images uploaded yet.</p>
      <p class="mt-1 text-sm text-slate-500">Add product photos before publishing.</p>
    </div>

    <ul v-else class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
      <li
        v-for="image in sortedImages"
        :key="image.id"
        draggable="true"
        class="rounded-md border border-slate-200 bg-slate-50 transition hover:border-slate-300"
        :class="{ 'ring-2 ring-slate-900': draggedImageId === image.id }"
        @dragstart="draggedImageId = image.id"
        @dragend="draggedImageId = null"
        @dragover.prevent
        @drop.prevent="moveImage(image.id)"
      >
        <div class="aspect-square overflow-hidden rounded-t-md bg-slate-100">
          <img
            :src="imageSource(image)"
            :alt="image.alt_text || 'Product image'"
            class="h-full w-full object-cover"
          />
        </div>

        <div class="space-y-3 p-3">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-slate-500">
              Order {{ image.sort_order + 1 }}
            </span>
            <span
              v-if="image.is_primary"
              class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
            >
              Primary
            </span>
          </div>

          <label class="block">
            <span class="text-xs font-medium text-slate-600">Alt text</span>
            <input
              :value="image.alt_text"
              type="text"
              class="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-slate-500"
              @input="updateAltText(image.id, $event.target.value)"
            />
          </label>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex-1 rounded-md border border-slate-200 px-2 py-2 text-sm font-medium text-slate-700 hover:bg-white"
              @click="setPrimary(image.id)"
            >
              Set primary
            </button>
            <button
              type="button"
              class="rounded-md border border-red-200 px-2 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              @click="removeImage(image.id)"
            >
              Remove
            </button>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
