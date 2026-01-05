import {
  useQuery,
  type QueryFunction,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  Booking,
  CalendarEvent,
  CalendarSource,
  MarketingContent,
  Notification,
  Service,
  User,
} from "@shared/schema";

/**
 * Central mapping of GET endpoints -> response JSON types.
 *
 * Add entries here as we type more of the client. This allows `useApiQuery("/api/foo")`
 * to infer the correct `data` type automatically.
 */
export type ApiGetMap = {
  "/api/me": User;
  "/api/services": Service[];
  "/api/notifications": Notification[];
  "/api/notifications/unread": Notification[];
  "/api/bookings": Booking[];
  "/api/bookings/recent": Booking[];
  "/api/calendar-events": CalendarEvent[];
  "/api/calendar-sources": CalendarSource[];
  "/api/ai/marketing-contents": MarketingContent[];
};

type QueryKeyFor<K extends keyof ApiGetMap> = readonly [K];

export function useApiGet<K extends keyof ApiGetMap>(
  key: K,
  options?: Omit<UseQueryOptions<ApiGetMap[K], Error, ApiGetMap[K], QueryKeyFor<K>>, "queryKey">,
): UseQueryResult<ApiGetMap[K], Error> {
  return useQuery<ApiGetMap[K], Error, ApiGetMap[K], QueryKeyFor<K>>({
    queryKey: [key],
    ...options,
  });
}

/**
 * Preferred pattern:
 * const { data } = useApiQuery({ key: [...], fn: fetchSomething })
 */
export function useApiQuery<TData, TKey extends QueryKey>(args: {
  key: TKey;
  fn: QueryFunction<TData, TKey>;
  options?: Omit<UseQueryOptions<TData, Error, TData, TKey>, "queryKey" | "queryFn">;
}): UseQueryResult<TData, Error> {
  return useQuery<TData, Error, TData, TKey>({
    queryKey: args.key,
    queryFn: args.fn,
    ...(args.options ?? {}),
  });
}


