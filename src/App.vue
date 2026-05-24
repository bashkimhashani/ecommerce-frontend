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
import WishlistPage from './components/WishlistPage.vue'

import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import { useWishlistStore } from './stores/wishlistStore'

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const themeStore = useThemeStore()
const wishlistStore = useWishlistStore()

const isCheckoutOpen = ref(false)
const selectedCategory = ref(null)
const isScrollTopVisible = ref(false)

const activeView = computed(() => {
  if (route.query.uid && route.query.token) return 'reset-password'
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

function showWishlist() {
  isCheckoutOpen.value = false
  router.push({ name: 'wishlist' })
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
  if (redirect.startsWith('/')) return router.push(redirect)
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
  () => themeStore.syncForCurrentUser()
)

function updateScrollTopVisibility() {
  isScrollTopVisible.value = window.scrollY > 420
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollTopVisibility()
  window.addEventListener('scroll', updateScrollTopVisibility, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollTopVisibility)
})
</script>