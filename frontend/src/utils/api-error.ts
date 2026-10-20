export interface ApiErrorData {
  code?: string;
  message?: string | string[];
  error?: {
    code?: string;
    message?: string;
  };
}

export const getApiErrorData = (error: unknown): ApiErrorData => {
  const candidate = error as ApiErrorData & {
    response?: { data?: ApiErrorData };
  };

  return candidate.response?.data ?? candidate;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  const errorData = getApiErrorData(error);
  const message = errorData.message ?? errorData.error?.message;

  if (Array.isArray(message)) {
    return message.filter(Boolean).join(" • ") || fallback;
  }

  return typeof message === "string" && message.trim()
    ? message.trim()
    : fallback;
};
