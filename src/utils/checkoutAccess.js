export function resolveCheckoutAccess({
  isAuthenticated = false,
  redirectPath = "/",
  role = "guest",
} = {}) {
  if (!isAuthenticated) {
    return {
      allowed: false,
      route: {
        name: "login",
        query: {
          redirect: normalizeRedirectPath(redirectPath),
        },
      },
    };
  }

  if (role !== "customer") {
    return {
      allowed: false,
      route: { name: "catalog" },
    };
  }

  return { allowed: true };
}

function normalizeRedirectPath(path) {
  return typeof path === "string" && path.startsWith("/") ? path : "/";
}
