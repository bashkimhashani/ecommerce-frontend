export const authViews = [
  "login",
  "register",
  "tenant-register",
  "forgot-password",
  "reset-password",
];

export const publicChromeViews = ["catalog", "product-detail"];

export function shouldShowAppChrome(activeView, isAuthenticated) {
  if (authViews.includes(activeView)) {
    return false;
  }

  return Boolean(isAuthenticated) || publicChromeViews.includes(activeView);
}
