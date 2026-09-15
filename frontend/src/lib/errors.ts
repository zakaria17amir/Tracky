import { AxiosError } from "axios";

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[] | string>;
}

/**
 * Extract a human-readable message from an axios error.
 */
export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorBody | undefined;
    if (data?.message) return data.message;
  }
  return fallback;
}

/**
 * Extract a flat { field: firstMessage } map from a 422 validation response.
 */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof AxiosError)) return {};
  const errors = (error.response?.data as ApiErrorBody | undefined)?.errors;
  if (!errors) return {};
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : String(messages),
    ]),
  );
}
