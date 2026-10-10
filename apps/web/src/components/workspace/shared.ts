import type { apiRequest } from "@/lib/api/client";

export type Api = <T>(
  path: `/${string}`,
  options?: Parameters<typeof apiRequest>[2],
) => Promise<T>;

export function message(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function readable(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}

export function localTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
