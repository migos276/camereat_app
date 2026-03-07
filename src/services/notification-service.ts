import axiosService from "./axios-instance"
import { ENDPOINTS } from "../constants/endpoints"
import type { Notification } from "../types"

const api = axiosService.getInstance()

export const notificationService = {
  async listNotifications(page = 1): Promise<{ results: Notification[]; count: number }> {
    const response = await api.get<{ results: Notification[]; count: number }>(
      `${ENDPOINTS.NOTIFICATIONS_LIST}?page=${page}`,
    )
    return response.data
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.post<Notification>(ENDPOINTS.NOTIFICATIONS_MARK_READ(id))
    return response.data
  },

  async markAllAsRead(): Promise<void> {
    await api.post(ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ)
  },
}
