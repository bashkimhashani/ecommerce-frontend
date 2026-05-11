<script setup>
import Header from './components/Header.vue'
import ShopingCart from './components/ShopingCart.vue'
</script>

<template>
  <div class="min-h-screen bg-neutral-50">
    <Header />

    <main class="mx-auto max-w-6xl px-5 py-10">
      <section class="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p class="text-sm font-semibold uppercase text-emerald-700">
            Vendora Tech
          </p>
          <h1 class="mt-3 max-w-2xl text-4xl font-bold text-neutral-950">
            New gear for work, gaming, and everything between
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            Laptops, components, networking gear, and peripherals from trusted brands.
          </p>
        </div>

        <div class="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-md bg-neutral-100 p-3">
              <p class="font-semibold text-neutral-950">Gaming laptops</p>
              <p class="mt-1 text-neutral-500">RTX builds in stock</p>
            </div>
            <div class="rounded-md bg-neutral-100 p-3">
              <p class="font-semibold text-neutral-950">PC parts</p>
              <p class="mt-1 text-neutral-500">CPUs, GPUs, memory</p>
            </div>
            <div class="rounded-md bg-neutral-100 p-3">
              <p class="font-semibold text-neutral-950">Networking</p>
              <p class="mt-1 text-neutral-500">Routers and switches</p>
            </div>
            <div class="rounded-md bg-neutral-100 p-3">
              <p class="font-semibold text-neutral-950">Peripherals</p>
              <p class="mt-1 text-neutral-500">Keyboards and displays</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <ShopingCart />
  </div>
</template>
