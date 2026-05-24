import type { AcuityColor } from '@/types/domain';

export function acuityOrder(color: AcuityColor): number {
  switch (color) {
    case 'RED':
      return 0;
    case 'AMBER':
      return 1;
    case 'GREEN':
      return 2;
  }
}

export function sortByAcuity<T extends { acuityColor: AcuityColor; lastName: string }>(
  patients: T[],
): T[] {
  return [...patients].sort((a, b) => {
    const orderDiff = acuityOrder(a.acuityColor) - acuityOrder(b.acuityColor);
    if (orderDiff !== 0) return orderDiff;
    return a.lastName.localeCompare(b.lastName);
  });
}

export function acuityBorderColor(color: AcuityColor): string {
  switch (color) {
    case 'RED':
      return '#dc2626';
    case 'AMBER':
      return '#f59e0b';
    case 'GREEN':
      return '#22c55e';
  }
}

export function acuityBadgeStyle(
  color: AcuityColor,
  active: boolean,
): { bg: string; text: string; border: string } {
  const acuityColor = acuityBorderColor(color);
  if (active) {
    return { bg: acuityColor, text: '#ffffff', border: acuityColor };
  }
  return { bg: '#ffffff', text: acuityColor, border: acuityColor };
}
