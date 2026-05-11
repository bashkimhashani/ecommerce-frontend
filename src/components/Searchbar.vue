<template>
  <label class="relative block w-full lg:w-72">
    <span class="sr-only">Search products</span>
    <svg
      aria-hidden="true"
      class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
      />
    </svg>
    <input
      class="h-10 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      type="search"
      placeholder="Search products"
    >
  </label>
</template>
