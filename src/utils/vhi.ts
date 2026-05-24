import type { VhiStatus } from '@/types/domain';

export interface VhiBreakdown {
  pulse: number;
  systolicBp: number;
  respiratoryRate: number;
  temperature: number;
  spo2: number;
  total: number;
  status: VhiStatus;
}

function toNum(value: number | string | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(n) ? undefined : n;
}

function scoreRespiratoryRate(rr: number | undefined): number {
  if (rr === undefined) return 0;
  if (rr <= 8) return 3;
  if (rr <= 11) return 1;
  if (rr <= 20) return 0;
  if (rr <= 24) return 2;
  return 3;
}

function scoreSpo2(spo2: number | undefined): number {
  if (spo2 === undefined) return 0;
  if (spo2 <= 91) return 3;
  if (spo2 <= 93) return 2;
  if (spo2 <= 95) return 1;
  return 0;
}

function scoreSystolicBp(bp: number | undefined): number {
  if (bp === undefined) return 0;
  if (bp <= 90) return 3;
  if (bp <= 100) return 2;
  if (bp <= 110) return 1;
  if (bp <= 219) return 0;
  return 3;
}

function scorePulse(pulse: number | undefined): number {
  if (pulse === undefined) return 0;
  if (pulse <= 40) return 3;
  if (pulse <= 50) return 1;
  if (pulse <= 90) return 0;
  if (pulse <= 110) return 1;
  if (pulse <= 130) return 2;
  return 3;
}

function scoreTemperature(temp: number | undefined): number {
  if (temp === undefined) return 0;
  if (temp <= 35.0) return 3;
  if (temp <= 36.0) return 1;
  if (temp <= 38.0) return 0;
  if (temp <= 39.0) return 1;
  return 2;
}

export function vhiStatusFromScore(score: number): VhiStatus {
  if (score <= 2) return 'STABLE';
  if (score <= 4) return 'WATCH';
  return 'CRITICAL';
}

export function computeVhi(vitals: {
  pulse?: number | string;
  systolicBp?: number | string;
  respiratoryRate?: number | string;
  temperature?: number | string;
  spo2?: number | string;
}): VhiBreakdown {
  const pulseScore = scorePulse(toNum(vitals.pulse));
  const systolicBpScore = scoreSystolicBp(toNum(vitals.systolicBp));
  const respiratoryRateScore = scoreRespiratoryRate(toNum(vitals.respiratoryRate));
  const temperatureScore = scoreTemperature(toNum(vitals.temperature));
  const spo2Score = scoreSpo2(toNum(vitals.spo2));

  const total = pulseScore + systolicBpScore + respiratoryRateScore + temperatureScore + spo2Score;
  const status = vhiStatusFromScore(total);

  return {
    pulse: pulseScore,
    systolicBp: systolicBpScore,
    respiratoryRate: respiratoryRateScore,
    temperature: temperatureScore,
    spo2: spo2Score,
    total,
    status,
  };
}

export function countFilledVitals(vitals: object): number {
  const VITAL_KEYS = ['pulse', 'systolicBp', 'diastolicBp', 'respiratoryRate', 'temperature', 'spo2'];
  let count = 0;
  const v = vitals as Record<string, unknown>;
  for (const key of VITAL_KEYS) {
    const val = v[key];
    if (val !== undefined && val !== null && val !== 0 && val !== '') {
      count += 1;
    }
  }
  return count;
}
