import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

/**
 * Custom hook for API queries using React Query
 * Wraps useQuery with consistent error handling and typing
 */
export function useApiQuery<T>({
  key,
  fn,
  options,
}: {
  key: readonly unknown[];
  fn: () => Promise<T>;
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">;
}) {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn: fn,
    ...options,
  });
}

/**
 * Simplified hook for GET requests
 * Uses the URL as the query key automatically
 */
export function useApiGet<T>(
  url: string,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
) {
  return useQuery<T, Error>({
    queryKey: [url],
    queryFn: async () => {
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      return response.json();
    },
    ...options,
  });
}

