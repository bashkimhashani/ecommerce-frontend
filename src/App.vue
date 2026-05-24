<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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

const route = useRoute()
const router = useRouter()
const isCheckoutOpen = ref(false)
const selectedCategory = ref(null)
const selectedProductSlug = ref('')

const activeView = computed(() => {
  if (route.query.uid && route.query.token) {
    return 'reset-password'
  }

  return route.meta.activeView || 'catalog'
})
const selectedOrderNumber = computed(() => String(route.params.orderNumber || ''))
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
  selectedProductSlug.value = ''
  router.push({ name: 'catalog' })
}

function showVendor() {
  isCheckoutOpen.value = false
  selectedProductSlug.value = ''
  router.push({ name: 'vendor' })
}

function showOrders() {
  isCheckoutOpen.value = false
  selectedProductSlug.value = ''
  router.push({ name: 'orders' })
}

function showProfile() {
  isCheckoutOpen.value = false
  selectedProductSlug.value = ''
  router.push({ name: 'profile' })
}

function showLogin() {
  isCheckoutOpen.value = false
  selectedProductSlug.value = ''
  router.push({ name: 'login' })
}

function showForgotPassword() {
  isCheckoutOpen.value = false
  selectedProductSlug.value = ''
  router.push({ name: 'forgot-password' })
}

function showRegister() {
  isCheckoutOpen.value = false
  selectedProductSlug.value = ''
  router.push({ name: 'register' })
}

function showTenantRegister() {
  isCheckoutOpen.value = false
  selectedProductSlug.value = ''
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
  selectedProductSlug.value = ''
  router.push({ name: 'order-detail', params: { orderNumber } })
}

function selectCategory(category) {
  selectedCategory.value = category
  selectedProductSlug.value = ''
  router.push({ name: 'catalog' })
}

function openProductFromChat(slug) {
  isCheckoutOpen.value = false
  selectedProductSlug.value = slug
  router.push({ name: 'catalog' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-950">
    <Header
      :active-view="activeView === 'order-detail' ? 'orders' : activeView"
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

    <div v-else class="mx-auto w-full max-w-7xl border-x border-slate-200 bg-white">
      <main class="flex min-h-[calc(100vh-81px)] w-full bg-white">
        <VendorDashboard v-if="activeView === 'vendor'" />
        <template v-else>
          <CategoryTree @select="selectCategory" />
          <ProductDetailPage
            v-if="selectedProductSlug"
            :slug="selectedProductSlug"
            @back="selectedProductSlug = ''"
          />
          <ProductListingPage
            v-else
            :selected-category="selectedCategory"
            @view-product="selectedProductSlug = $event"
          />
        </template>
      </main>
    </div>

    <ShopingCart v-if="!isCheckoutOpen" @checkout="openCheckout" />
    <ChatWidget @view-product="openProductFromChat" />
  </div>
</template>
