export function assertTenantMatch(expectedSpaceId: string, actualSpaceId: string) {
  return expectedSpaceId === actualSpaceId;
}

export function filterByTenant<T extends { spaceId: string }>(
  items: T[],
  spaceId: string,
) {
  return items.filter((item) => item.spaceId === spaceId);
}
