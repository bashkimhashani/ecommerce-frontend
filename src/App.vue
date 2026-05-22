<script setup>
import { ref } from 'vue'

import CategoryTree from './components/CategoryTree.vue'
import CheckoutWizard from './components/CheckoutWizard.vue'
import ForgotPasswordPage from './components/ForgotPasswordPage.vue'
import Header from './components/Header.vue'
import LoginPage from './components/LoginPage.vue'
import OrderDetail from './components/OrderDetail.vue'
import OrderHistory from './components/OrderHistory.vue'
import ProductDetailPage from './components/ProductDetailPage.vue'
import ProductListingPage from './components/ProductListingPage.vue'
import RegisterPage from './components/RegisterPage.vue'
import ResetPasswordPage from './components/ResetPasswordPage.vue'
import ShopingCart from './components/ShopingCart.vue'
import VendorDashboard from './components/VendorDashboard.vue'

const isCheckoutOpen = ref(false)
const selectedCategory = ref(null)
const selectedOrderNumber = ref('')
const selectedProductSlug = ref('')
const resetPasswordUid = ref('')
const resetPasswordToken = ref('')
const initialResetParams = new URLSearchParams(window.location.search)
const activeView = ref(
  initialResetParams.has('uid') && initialResetParams.has('token')
    ? 'reset-password'
    : 'catalog',
)

if (activeView.value === 'reset-password') {
  resetPasswordUid.value = initialResetParams.get('uid') || ''
  resetPasswordToken.value = initialResetParams.get('token') || ''
}

function openCheckout() {
  isCheckoutOpen.value = true
}

function closeCheckout() {
  isCheckoutOpen.value = false
}

function showCatalog() {
  isCheckoutOpen.value = false
  selectedOrderNumber.value = ''
  activeView.value = 'catalog'
}

function showVendor() {
  isCheckoutOpen.value = false
  selectedOrderNumber.value = ''
  activeView.value = 'vendor'
}

function showOrders() {
  isCheckoutOpen.value = false
  selectedOrderNumber.value = ''
  activeView.value = 'orders'
}

function showLogin() {
  isCheckoutOpen.value = false
  selectedOrderNumber.value = ''
  selectedProductSlug.value = ''
  activeView.value = 'login'
}

function showForgotPassword() {
  isCheckoutOpen.value = false
  selectedOrderNumber.value = ''
  selectedProductSlug.value = ''
  activeView.value = 'forgot-password'
}

function showRegister() {
  isCheckoutOpen.value = false
  selectedOrderNumber.value = ''
  selectedProductSlug.value = ''
  activeView.value = 'register'
}

function handleRegisterSuccess() {
  showCatalog()
}

function handleLoginSuccess() {
  showCatalog()
}

function showOrderDetail(orderNumber) {
  isCheckoutOpen.value = false
  selectedOrderNumber.value = orderNumber
  activeView.value = 'order-detail'
}

function selectCategory(category) {
  selectedCategory.value = category
  selectedProductSlug.value = ''
  activeView.value = 'catalog'
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-950">
    <Header
      :active-view="activeView === 'order-detail' ? 'orders' : activeView"
      @show-catalog="showCatalog"
      @show-vendor="showVendor"
      @show-orders="showOrders"
      @show-login="showLogin"
      @show-register="showRegister"
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

    <OrderHistory v-else-if="activeView === 'orders'" @view-order="showOrderDetail" />

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
  </div>
</template>
