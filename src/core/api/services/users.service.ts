import { httpClient } from "@/core/api/client";
import { ENDPOINTS } from "@/core/api/endpoints";
import type { User, UpdateProfilePayload } from "@/core/types";

/**
 * Real, confirmed routes per docs/API.md — any authenticated role.
 * `phone` is the one field registration (password or Google) never
 * collects; `GET /users/me`'s `phone: null` is what should drive a
 * "complete your profile" prompt (see `CompleteProfileScreen`).
 */
export const usersService = {
  async getMe(): Promise<User> {
    return httpClient.get<User>(ENDPOINTS.users.me);
  },

  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    return httpClient.patch<User>(ENDPOINTS.users.me, payload);
  },
};
