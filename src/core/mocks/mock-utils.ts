import { env } from "@/core/config/env";

/** Simulates real network latency so loading states are visible during development. */
export function mockDelay(ms: number = env.mockLatencyMs): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** In-memory id generator for mock-created records. */
export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
