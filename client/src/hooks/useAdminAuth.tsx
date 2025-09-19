import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAdminAuth() {
  const queryClient = useQueryClient();

  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/admin/check'],
    retry: false,
  });

  const isAdmin = (authData as any)?.isAdmin === true;

  const logout = useMutation({
    mutationFn: () => apiRequest('/api/admin/logout', {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/check'] });
    },
  });

  return {
    isAdmin,
    isLoading,
    logout: logout.mutate,
    isLoggingOut: logout.isPending,
  };
}