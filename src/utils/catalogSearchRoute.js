export function readCatalogSearchQuery(routeQuery = {}) {
  return typeof routeQuery.q === "string" ? routeQuery.q : "";
}

export function buildCatalogSearchLocation(currentQuery = {}, nextQuery = "") {
  const query = { ...currentQuery };
  const cleanQuery = String(nextQuery).trim();

  if (cleanQuery) {
    query.q = cleanQuery;
  } else {
    delete query.q;
  }

  return {
    name: "catalog",
    query,
  };
}
