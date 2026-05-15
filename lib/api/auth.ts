import { api } from "./client";

export const authApi = {
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.patch<{ success: true }>("/auth/change-password", body),
};
