export const unwrapListResponse = <T>(response: unknown): T[] => {
  let value = response;

  for (let depth = 0; depth < 2; depth += 1) {
    if (Array.isArray(value)) {
      return value as T[];
    }

    if (!value || typeof value !== "object" || !("data" in value)) {
      return [];
    }

    value = (value as { data?: unknown }).data;
  }

  return Array.isArray(value) ? (value as T[]) : [];
};

export const unwrapDataResponse = <T>(response: unknown): T | null => {
  let value = response;

  for (let depth = 0; depth < 2; depth += 1) {
    if (!value || typeof value !== "object" || !("data" in value)) {
      break;
    }

    value = (value as { data?: unknown }).data;
  }

  return value == null ? null : (value as T);
};
