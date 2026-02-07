import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGoldPrices() {
  return useQuery({
    queryKey: [api.gold.list.path],
    queryFn: async () => {
      const res = await fetch(api.gold.list.path);
      if (!res.ok) throw new Error("Failed to fetch gold prices");
      return api.gold.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateGoldData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.gold.update.path, {
        method: api.gold.update.method,
      });
      if (!res.ok) throw new Error("Failed to update gold data");
      return api.gold.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.gold.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.predictions.list.path] });
    },
  });
}
