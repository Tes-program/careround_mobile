import type { MedicationTaskEnriched } from '@/types/domain';

export type TaskGroup = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'COMPLETED';

const DUE_SOON_MINUTES = 30;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Classify a task into a display group based on its status and scheduled time.
 * COMPLETED  — task.status === 'COMPLETED'
 * OVERDUE    — task.status === 'OVERDUE' OR scheduledTime is in the past
 * DUE_SOON   — scheduledTime is within the next 30 minutes
 * UPCOMING   — everything else
 */
export function classifyTask(task: MedicationTaskEnriched): TaskGroup {
  if (task.status === 'COMPLETED') return 'COMPLETED';

  const now = new Date();
  const scheduled = new Date(task.scheduledTime);

  if (task.status === 'OVERDUE' || scheduled <= now) return 'OVERDUE';

  const diffMs = scheduled.getTime() - now.getTime();
  const diffMin = diffMs / 60_000;

  if (diffMin <= DUE_SOON_MINUTES) return 'DUE_SOON';

  return 'UPCOMING';
}

/**
 * Group tasks into the four display buckets, each sorted by scheduledTime ascending.
 */
export function groupTasks(
  tasks: MedicationTaskEnriched[],
): Record<TaskGroup, MedicationTaskEnriched[]> {
  const groups: Record<TaskGroup, MedicationTaskEnriched[]> = {
    OVERDUE: [],
    DUE_SOON: [],
    UPCOMING: [],
    COMPLETED: [],
  };

  for (const task of tasks) {
    groups[classifyTask(task)].push(task);
  }

  const byTime = (a: MedicationTaskEnriched, b: MedicationTaskEnriched) =>
    new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();

  groups.OVERDUE.sort(byTime);
  groups.DUE_SOON.sort(byTime);
  groups.UPCOMING.sort(byTime);
  groups.COMPLETED.sort(byTime);

  return groups;
}

/**
 * Count tasks that require immediate nurse attention: OVERDUE + DUE_SOON.
 */
export function pendingTaskCount(tasks: MedicationTaskEnriched[]): number {
  return tasks.filter((t) => {
    const g = classifyTask(t);
    return g === 'OVERDUE' || g === 'DUE_SOON';
  }).length;
}

/**
 * Format a scheduled time ISO string for display:
 *   "Today at 10:30"
 *   "Tomorrow at 08:00"
 *   "Mon 20 May at 14:00"
 */
export function formatScheduledTime(iso: string): string {
  const now = new Date();
  const d = new Date(iso);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000);
  const dayAfterStart = new Date(todayStart.getTime() + 2 * 86_400_000);

  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;

  if (d >= todayStart && d < tomorrowStart) return `Today at ${timeStr}`;
  if (d >= tomorrowStart && d < dayAfterStart) return `Tomorrow at ${timeStr}`;

  const dayName = DAY_NAMES[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTH_NAMES[d.getMonth()];
  return `${dayName} ${dayNum} ${monthName} at ${timeStr}`;
}

/**
 * How many minutes past the scheduled time is a task.
 * Returns 0 if the scheduled time is in the future.
 */
export function overdueMinutes(scheduledTime: string): number {
  const now = new Date();
  const scheduled = new Date(scheduledTime);
  return Math.max(0, Math.floor((now.getTime() - scheduled.getTime()) / 60_000));
}
