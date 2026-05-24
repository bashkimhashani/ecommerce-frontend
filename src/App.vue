<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppFooter from './components/AppFooter.vue'
import CategoryTree from './components/CategoryTree.vue'
import ChatWidget from './components/ChatWidget.vue'
import CheckoutWizard from './components/CheckoutWizard.vue'
import ForgotPasswordPage from './components/ForgotPasswordPage.vue'
import Header from './components/Header.vue'
import LoginPage from './components/LoginPage.vue'
import OrderDetail from './components/OrderDetail.vue'
import OrderHistory from './components/OrderHistory.vue'
import ProfileEditPage from './components/ProfileEditPage.vue'
import ProductDetailPage from './components/ProductDetailPage.vue'
import ProductListingPage from './components/ProductListingPage.vue'
import RegisterPage from './components/RegisterPage.vue'
import ResetPasswordPage from './components/ResetPasswordPage.vue'
import ShopingCart from './components/ShopingCart.vue'
import TenantRegistrationPage from './components/TenantRegistrationPage.vue'
import VendorDashboard from './components/VendorDashboard.vue'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const isCheckoutOpen = ref(false)
const selectedCategory = ref(null)
const isScrollTopVisible = ref(false)

const activeView = computed(() => {
  if (route.query.uid && route.query.token) {
    return 'reset-password'
  }

  return route.meta.activeView || 'catalog'
})
const selectedOrderNumber = computed(() => String(route.params.orderNumber || ''))
const selectedProductSlug = computed(() => String(route.params.productSlug || ''))
const resetPasswordUid = computed(() => String(route.query.uid || ''))
const resetPasswordToken = computed(() => String(route.query.token || ''))

function openCheckout() {
  isCheckoutOpen.value = true
}

function closeCheckout() {
  isCheckoutOpen.value = false
}

function showCatalog() {
  isCheckoutOpen.value = false
  selectedCategory.value = null
  router.push({ name: 'catalog' })
}

function showVendor() {
  isCheckoutOpen.value = false
  router.push({ name: 'vendor' })
}

function showOrders() {
  isCheckoutOpen.value = false
  router.push({ name: 'orders' })
}

function showProfile() {
  isCheckoutOpen.value = false
  router.push({ name: 'profile' })
}

function showLogin() {
  isCheckoutOpen.value = false
  router.push({ name: 'login' })
}

function showForgotPassword() {
  isCheckoutOpen.value = false
  router.push({ name: 'forgot-password' })
}

function showRegister() {
  isCheckoutOpen.value = false
  router.push({ name: 'register' })
}

function showTenantRegister() {
  isCheckoutOpen.value = false
  router.push({ name: 'tenant-register' })
}

function handleRegisterSuccess() {
  showCatalog()
}

function handleTenantRegisterSuccess() {
  router.push({ name: 'vendor' })
}

function handleLoginSuccess() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

  if (redirect.startsWith('/')) {
    router.push(redirect)
    return
  }

  showCatalog()
}

function showOrderDetail(orderNumber) {
  isCheckoutOpen.value = false
  router.push({ name: 'order-detail', params: { orderNumber } })
}

function selectCategory(category) {
  selectedCategory.value = category
  router.push({ name: 'catalog' })
}

function showProduct(productSlug) {
  isCheckoutOpen.value = false
  router.push({ name: 'product-detail', params: { productSlug } })
}

function openProductFromChat(slug) {
  showProduct(slug)
}

watch(
  () => authStore.user?.id || authStore.user?.email || 'guest',
  () => themeStore.syncForCurrentUser(),
)
function updateScrollTopVisibility() {
  isScrollTopVisible.value = window.scrollY > 420
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

onMounted(() => {
  updateScrollTopVisibility()
  window.addEventListener('scroll', updateScrollTopVisibility, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollTopVisibility)
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
    <Header
      :active-view="activeView === 'order-detail' ? 'orders' : activeView === 'product-detail' ? 'catalog' : activeView"
      :selected-category-slug="selectedCategory?.slug || ''"
      @select-category="selectCategory"
      @show-catalog="showCatalog"
      @show-vendor="showVendor"
      @show-orders="showOrders"
      @show-profile="showProfile"
      @show-login="showLogin"
      @show-register="showRegister"
      @show-tenant-register="showTenantRegister"
    />

    <Transition name="page-fade" mode="out-in">
      <CheckoutWizard v-if="isCheckoutOpen" @close="closeCheckout" />

      <LoginPage
        v-else-if="activeView === 'login'"
        @forgot-password="showForgotPassword"
        @login-success="handleLoginSuccess"
      />

      <ForgotPasswordPage
        v-else-if="activeView === 'forgot-password'"
        @back-to-login="showLogin"
      />

      <ResetPasswordPage
        v-else-if="activeView === 'reset-password'"
        :uid="resetPasswordUid"
        :token="resetPasswordToken"
        @back-to-login="showLogin"
      />

      <RegisterPage v-else-if="activeView === 'register'" @register-success="handleRegisterSuccess" />

      <TenantRegistrationPage
        v-else-if="activeView === 'tenant-register'"
        @tenant-register-success="handleTenantRegisterSuccess"
      />

      <OrderHistory v-else-if="activeView === 'orders'" @view-order="showOrderDetail" />

      <ProfileEditPage v-else-if="activeView === 'profile'" />

      <OrderDetail
        v-else-if="activeView === 'order-detail'"
        :order-number="selectedOrderNumber"
        @back="showOrders"
      />

      <div v-else class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
        <main class="flex w-full bg-white transition-colors duration-300 dark:bg-slate-900">
          <VendorDashboard v-if="activeView === 'vendor'" />
          <template v-else>
            <CategoryTree @select="selectCategory" />
            <ProductDetailPage
              v-if="selectedProductSlug"
              :slug="selectedProductSlug"
              @back="showCatalog"
            />
            <ProductListingPage
              v-else
              :selected-category="selectedCategory"
              @view-product="showProduct"
            />
          </template>
        </main>
      </div>
    </Transition>

    <ShopingCart v-if="!isCheckoutOpen" @checkout="openCheckout" />
    <ChatWidget @view-product="openProductFromChat" />
    <AppFooter />
    <button
      v-if="isScrollTopVisible"
      type="button"
      class="fixed bottom-28 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold leading-none text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      aria-label="Back to top"
      title="Back to top"
      @click="scrollToTop"
    >
      ^
    </button>
  </div>
</template>
