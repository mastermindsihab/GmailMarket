import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/notifications/unread-count"],
    retry: false,
    refetchInterval: 30000, // Check every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/notifications/${id}/mark-read`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("/api/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}