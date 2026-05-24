<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
  },
  expandedIds: {
    type: Object,
    required: true,
  },
  selectedSlug: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['toggle', 'select'])

const hasChildren = computed(() => Boolean(props.category.children?.length))
const isExpanded = computed(() => props.expandedIds.has(props.category.id))
const isSelected = computed(() => props.selectedSlug === props.category.slug)

const indentation = computed(() => ({
  paddingLeft: `${props.depth * 0.875}rem`,
}))
</script>

<template>
  <li>
    <div
      class="group flex min-h-10 items-center gap-1 rounded-md pr-2 text-sm transition-colors"
      :class="isSelected ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'"
      :style="indentation"
    >
      <button
        v-if="hasChildren"
        type="button"
        class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-base transition-transform hover:bg-black/5 dark:hover:bg-white/10"
        :aria-label="`${isExpanded ? 'Collapse' : 'Expand'} ${category.name}`"
        :aria-expanded="isExpanded"
        @click.stop="emit('toggle', category.id)"
      >
        <span :class="{ 'rotate-90': isExpanded }" class="block transition-transform">&gt;</span>
      </button>

      <span v-else class="h-8 w-8 shrink-0" aria-hidden="true"></span>

      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 rounded-md py-2 text-left"
        @click="emit('select', category)"
      >
        <img
          v-if="category.icon_url"
          :src="category.icon_url"
          :alt="`${category.name} icon`"
          class="h-4 w-4 shrink-0 object-contain"
        >
        <span class="truncate">{{ category.name }}</span>
      </button>
    </div>

    <ul v-if="hasChildren && isExpanded" class="mt-1 space-y-1">
      <CategoryTreeNode
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :depth="depth + 1"
        :expanded-ids="expandedIds"
        :selected-slug="selectedSlug"
        @toggle="emit('toggle', $event)"
        @select="emit('select', $event)"
      />
    </ul>
  </li>
</template>
