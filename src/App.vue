<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import AppFooter from "./components/AppFooter.vue";
import ChatWidget from "./components/ChatWidget.vue";
import CheckoutWizard from "./components/CheckoutWizard.vue";
import ForgotPasswordPage from "./components/ForgotPasswordPage.vue";
import Header from "./components/Header.vue";
import LoginPage from "./components/LoginPage.vue";
import OrderDetail from "./components/OrderDetail.vue";
import OrderHistory from "./components/OrderHistory.vue";
import ProfileEditPage from "./components/ProfileEditPage.vue";
import ProductDetailPage from "./components/ProductDetailPage.vue";
import ProductListingPage from "./components/ProductListingPage.vue";
import RefundPolicyPage from "./components/RefundPolicyPage.vue";
import RegisterPage from "./components/RegisterPage.vue";
import ResetPasswordPage from "./components/ResetPasswordPage.vue";
import ShopingCart from "./components/ShopingCart.vue";
import TenantRegistrationPage from "./components/TenantRegistrationPage.vue";
import VendorDashboard from "./components/VendorDashboard.vue";
import WishlistPage from "./components/WishlistPage.vue";

import { useAuthStore } from "./stores/authStore";
import { useThemeStore } from "./stores/themeStore";
import { useWishlistStore } from "./stores/wishlistStore";
import { shouldShowAppChrome } from "./utils/appChrome";
import { resolveCheckoutAccess } from "./utils/checkoutAccess";

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const themeStore = useThemeStore();
const wishlistStore = useWishlistStore();

const isCheckoutOpen = ref(false);
const selectedCategory = ref(null);
const isScrollTopVisible = ref(false);

const activeView = computed(() => {
  if (route.query.uid && route.query.token) return "reset-password";
  return route.meta.activeView || "catalog";
});
const showAppChrome = computed(
  () => shouldShowAppChrome(activeView.value, authStore.isAuthenticated)
);
const isVendorUser = computed(() => ["vendor_admin", "store_staff", "superadmin"].includes(authStore.role));

const selectedOrderNumber = computed(() => String(route.params.orderNumber || ""));
const selectedProductSlug = computed(() => String(route.params.productSlug || ""));
const resetPasswordUid = computed(() => String(route.query.uid || ""));
const resetPasswordToken = computed(() => String(route.query.token || ""));

function openCheckout() {
  const access = resolveCheckoutAccess({
    isAuthenticated: authStore.isAuthenticated,
    redirectPath: route.fullPath,
    role: authStore.role,
  });

  if (!access.allowed) {
    isCheckoutOpen.value = false;
    router.push(access.route);
    return;
  }

  isCheckoutOpen.value = true;
}

function closeCheckout() {
  isCheckoutOpen.value = false;
}

function showCatalog() {
  isCheckoutOpen.value = false;
  selectedCategory.value = null;
  router.push({ name: "catalog" });
}

function showVendor() {
  isCheckoutOpen.value = false;
  router.push({ name: "vendor" });
}

function showOrders() {
  isCheckoutOpen.value = false;
  router.push({ name: "orders" });
}

function showWishlist() {
  isCheckoutOpen.value = false;
  router.push({ name: "wishlist" });
}

function showProfile() {
  isCheckoutOpen.value = false;
  router.push({ name: "profile" });
}

function showLogin() {
  isCheckoutOpen.value = false;
  router.push({ name: "login" });
}

function showForgotPassword() {
  isCheckoutOpen.value = false;
  router.push({ name: "forgot-password" });
}

function showRegister() {
  isCheckoutOpen.value = false;
  router.push({ name: "register" });
}

function showTenantRegister() {
  isCheckoutOpen.value = false;
  router.push({ name: "tenant-register" });
}

function handleRegisterSuccess() {
  showCatalog();
}

function handleTenantRegisterSuccess() {
  router.push({ name: "vendor" });
}

function handleLoginSuccess() {
  const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "";
  if (redirect.startsWith("/")) return router.push(redirect);
  showCatalog();
}

function showOrderDetail(orderNumber) {
  isCheckoutOpen.value = false;
  router.push({ name: "order-detail", params: { orderNumber } });
}

function selectCategory(category) {
  selectedCategory.value = category;
  router.push({ name: "catalog" });
}

function showProduct(productSlug) {
  isCheckoutOpen.value = false;
  router.push({ name: "product-detail", params: { productSlug } });
}

function openProductFromChat(slug) {
  showProduct(slug);
}

watch(
  () => authStore.user?.id || authStore.user?.email || "guest",
  () => themeStore.syncForCurrentUser()
);

function updateScrollTopVisibility() {
  isScrollTopVisible.value = window.scrollY > 420;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  updateScrollTopVisibility();
  window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateScrollTopVisibility);
});
</script>

<template>
  <div
    class="flex flex-col bg-transparent text-slate-950 transition-colors duration-300 dark:text-slate-100"
    :class="showAppChrome ? 'h-screen overflow-hidden' : 'min-h-screen overflow-y-auto'"
  >
    <Header
      v-if="showAppChrome"
      :active-view="
        activeView === 'order-detail'
          ? 'orders'
          : activeView === 'product-detail'
            ? 'catalog'
            : activeView
      "
      :selected-category-slug="selectedCategory?.slug || ''"
      :wishlist-count="wishlistStore.count"
      @select-category="selectCategory"
      @show-catalog="showCatalog"
      @show-wishlist="showWishlist"
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

      <ForgotPasswordPage v-else-if="activeView === 'forgot-password'" @back-to-login="showLogin" />

      <ResetPasswordPage
        v-else-if="activeView === 'reset-password'"
        :uid="resetPasswordUid"
        :token="resetPasswordToken"
        @back-to-login="showLogin"
      />

      <RegisterPage
        v-else-if="activeView === 'register'"
        @register-success="handleRegisterSuccess"
      />

      <TenantRegistrationPage
        v-else-if="activeView === 'tenant-register'"
        @tenant-register-success="handleTenantRegisterSuccess"
      />

      <OrderHistory v-else-if="activeView === 'orders'" @view-order="showOrderDetail" />

      <ProfileEditPage v-else-if="activeView === 'profile'" />

      <RefundPolicyPage v-else-if="activeView === 'refund-policy'" />

      <WishlistPage v-else-if="activeView === 'wishlist'" @view-product="showProduct" />

      <OrderDetail
        v-else-if="activeView === 'order-detail'"
        :order-number="selectedOrderNumber"
        @back="showOrders"
      />

      <div v-else class="mx-auto flex min-h-0 w-full max-w-7xl flex-1 px-3 py-3 sm:px-4">
        <main
          class="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-xl shadow-cyan-950/10 backdrop-blur transition-colors duration-300 dark:border-cyan-400/10 dark:bg-slate-950/90 dark:shadow-black/40"
        >
          <VendorDashboard v-if="activeView === 'vendor'" />
          <template v-else>
            <Transition name="product-modal" mode="out-in" appear>
              <ProductDetailPage
                v-if="selectedProductSlug"
                :key="`product-${selectedProductSlug}`"
                :slug="selectedProductSlug"
                @back="showCatalog"
              />
              <ProductListingPage
                v-else
                key="catalog-listing"
                :selected-category="selectedCategory"
                @view-product="showProduct"
              />
            </Transition>
          </template>
        </main>
      </div>
    </Transition>

    <ShopingCart v-if="showAppChrome && !isCheckoutOpen && !isVendorUser" @checkout="openCheckout" />
    <ChatWidget v-if="showAppChrome" @view-product="openProductFromChat" />
    <AppFooter class="hidden" />
    <button
      v-if="isScrollTopVisible"
      type="button"
      class="fixed bottom-40 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-200 bg-white text-xl font-semibold leading-none text-cyan-700 shadow-lg shadow-cyan-900/15 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-cyan-50 dark:border-cyan-400/30 dark:bg-slate-950 dark:text-cyan-200 dark:hover:bg-slate-900"
      aria-label="Back to top"
      title="Back to top"
      @click="scrollToTop"
    >
      ^
    </button>
  </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

.product-modal-enter-active,
.product-modal-leave-active {
  transition:
    opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: center;
}

.product-modal-enter-from,
.product-modal-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
