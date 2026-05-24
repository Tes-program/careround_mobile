import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks.service';
import type { MedicationTaskEnriched } from '@/types/domain';

// ── Query ──────────────────────────────────────────────────────────────────────

export function useMedicationTasks(params?: { wardId?: string }) {
  const {
    data: tasks = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    // When no params, use bare ['tasks'] so the optimistic-update key matches exactly.
    // With params, use ['tasks', params] for cache isolation.
    queryKey: params ? (['tasks', params] as const) : (['tasks'] as const),
    queryFn: (): Promise<MedicationTaskEnriched[]> => tasksService.getMedicationTasks(params),
    staleTime: 15_000,
    refetchInterval: 30_000, // auto-refresh every 30 seconds
  });

  return { tasks, isLoading, isError, refetch };
}

// ── Mutation ───────────────────────────────────────────────────────────────────

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, actualDoseGiven }: { taskId: string; actualDoseGiven?: string }) =>
      tasksService.completeTask(taskId, actualDoseGiven),

    // Optimistic update: immediately flip the task to COMPLETED in the cache
    onMutate: async ({ taskId }) => {
      // Cancel any in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the current value for rollback
      const previous = queryClient.getQueryData<MedicationTaskEnriched[]>(['tasks']);

      // Optimistically mark the task as completed
      queryClient.setQueryData<MedicationTaskEnriched[]>(
        ['tasks'],
        (old: MedicationTaskEnriched[] | undefined) =>
          (old ?? []).map((t: MedicationTaskEnriched) =>
            t.id === taskId
              ? { ...t, status: 'COMPLETED' as const, completedAt: new Date().toISOString() }
              : t,
          ),
      );

      return { previous };
    },

    // On error: roll back to the snapshot
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['tasks'], context.previous);
      }
    },

    // Always sync with the server after settle
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
