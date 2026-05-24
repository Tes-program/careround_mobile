/**
 * useBadgeSync
 * Mounted once in the Nurse layout alongside useNotificationHandler.
 * Watches the ['tasks'] query cache and keeps the app icon badge count
 * in sync with the number of OVERDUE tasks.
 *
 * - Runs an initial sync on mount using whatever is already in the cache.
 * - Subscribes to cache changes and re-syncs whenever the tasks query updates.
 * - Clears the badge when overdueCount reaches 0.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { classifyTask } from '@/utils/tasks';
import { clearBadge, setBadgeCount } from '@/services/notifications.service';
import type { MedicationTaskEnriched } from '@/types/domain';

export function useBadgeSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    function sync() {
      const tasks =
        queryClient.getQueryData<MedicationTaskEnriched[]>(['tasks']) ?? [];
      const overdueCount = tasks.filter(
        (t) => classifyTask(t) === 'OVERDUE',
      ).length;

      if (overdueCount === 0) {
        void clearBadge();
      } else {
        void setBadgeCount(overdueCount);
      }
    }

    // Run immediately with cached data
    sync();

    // Re-run on every tasks cache change (new fetch, invalidation, optimistic update)
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.query.queryKey[0] === 'tasks') {
        sync();
      }
    });

    return () => unsubscribe();
  }, [queryClient]);
}
