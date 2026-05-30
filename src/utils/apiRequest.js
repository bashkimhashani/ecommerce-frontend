export function buildJsonRequestOptions(options = {}, authHeaders = {}) {
  const { headers = {}, ...fetchOptions } = options;

  return {
    ...fetchOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
  };
}
