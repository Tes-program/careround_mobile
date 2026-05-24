import { useMemo, useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsService } from '@/services/patients.service';
import { tasksService } from '@/services/tasks.service';
import type { Patient, MedicationTaskEnriched } from '@/types/domain';

export interface HourlyDataPoint {
  hour: number;
  label: string;
  count: number;
}

export interface DashboardMetrics {
  admittedCount: number;
  overdueCount: number;
  atRiskCount: number;
  completedTodayCount: number;
  overdueTasks: MedicationTaskEnriched[];
  patientsSorted: Patient[];
  hourlyData: HourlyDataPoint[];
}

const ACUITY_ORDER: Record<string, number> = { RED: 0, AMBER: 1, GREEN: 2 };

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isTaskOverdue(task: MedicationTaskEnriched): boolean {
  if (task.status === 'OVERDUE') return true;
  if (task.status === 'COMPLETED') return false;
  return new Date(task.scheduledTime) < new Date();
}

export function useSupervisorDashboard(): {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  isError: boolean;
  refetchPatients: () => void;
  refetchTasks: () => void;
  lastUpdatedAt: Date | null;
  isFetchingPatients: boolean;
  isFetchingTasks: boolean;
} {
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const patientsQuery = useQuery({
    queryKey: ['supervisor-patients', { status: 'ADMITTED' }] as const,
    queryFn: (): Promise<Patient[]> => patientsService.getPatients({ status: 'ADMITTED' }),
    staleTime: 10_000,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });

  const tasksQuery = useQuery({
    queryKey: ['supervisor-tasks'] as const,
    queryFn: (): Promise<MedicationTaskEnriched[]> => tasksService.getMedicationTasks({}),
    staleTime: 10_000,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });

  // Track last successful fetch time
  const prevPatientsFetchTime = useRef<number>(0);
  const prevTasksFetchTime = useRef<number>(0);

  useEffect(() => {
    const pTime = patientsQuery.dataUpdatedAt;
    const tTime = tasksQuery.dataUpdatedAt;
    if (
      pTime > 0 &&
      tTime > 0 &&
      (pTime !== prevPatientsFetchTime.current || tTime !== prevTasksFetchTime.current)
    ) {
      prevPatientsFetchTime.current = pTime;
      prevTasksFetchTime.current = tTime;
      setLastUpdatedAt(new Date());
    }
  }, [patientsQuery.dataUpdatedAt, tasksQuery.dataUpdatedAt]);

  const metrics = useMemo<DashboardMetrics | null>(() => {
    const patients = patientsQuery.data;
    const tasks = tasksQuery.data;
    if (!patients || !tasks) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // overdueTasks
    const overdueTasks = tasks
      .filter(isTaskOverdue)
      .sort((a: MedicationTaskEnriched, b: MedicationTaskEnriched) => {
        const aMin = a.minutesOverdue ?? 0;
        const bMin = b.minutesOverdue ?? 0;
        if (bMin !== aMin) return bMin - aMin;
        return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      });

    // completedToday
    const completedTodayCount = tasks.filter((t: MedicationTaskEnriched) => {
      if (t.status !== 'COMPLETED' || !t.completedAt) return false;
      return isSameDay(new Date(t.completedAt), today);
    }).length;

    // atRisk
    const atRiskCount = patients.filter(
      (p: Patient) => p.acuityColor === 'RED' || p.acuityColor === 'AMBER',
    ).length;

    // patientsSorted: RED → AMBER → GREEN, then alphabetically
    const patientsSorted = [...patients].sort((a, b) => {
      const aOrder = ACUITY_ORDER[a.acuityColor] ?? 3;
      const bOrder = ACUITY_ORDER[b.acuityColor] ?? 3;
      if (aOrder !== bOrder) return aOrder - bOrder;
      const aName = `${a.lastName} ${a.firstName}`;
      const bName = `${b.lastName} ${b.firstName}`;
      return aName.localeCompare(bName);
    });

    // hourlyData: 24 buckets
    const counts = new Array<number>(24).fill(0);
    for (const t of tasks) {
      if (t.status === 'COMPLETED' && t.completedAt) {
        const d = new Date(t.completedAt);
        if (isSameDay(d, today)) {
          counts[d.getHours()]++;
        }
      }
    }
    const hourlyData: HourlyDataPoint[] = counts.map((count, hour) => ({
      hour,
      label: String(hour).padStart(2, '0'),
      count,
    }));

    return {
      admittedCount: patients.length,
      overdueCount: overdueTasks.length,
      atRiskCount,
      completedTodayCount,
      overdueTasks,
      patientsSorted,
      hourlyData,
    };
  }, [patientsQuery.data, tasksQuery.data]);

  const isLoading =
    (patientsQuery.isLoading || tasksQuery.isLoading) && metrics === null;
  const isError =
    (patientsQuery.isError || tasksQuery.isError) && metrics === null;

  return {
    metrics,
    isLoading,
    isError,
    refetchPatients: patientsQuery.refetch,
    refetchTasks: tasksQuery.refetch,
    lastUpdatedAt,
    isFetchingPatients: patientsQuery.isFetching && !patientsQuery.isLoading,
    isFetchingTasks: tasksQuery.isFetching && !tasksQuery.isLoading,
  };
}
