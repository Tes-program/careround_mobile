/**
 * Mock data for demo mode.
 * When EXPO_PUBLIC_DEMO_MODE=true, the Axios interceptor returns these instead of real API calls.
 */

// ── Wards ──────────────────────────────────────────────────────────────────────

export const MOCK_WARDS = [
  { id: 'ward-1', name: 'Ward A — General Medicine', hospitalId: 'demo-hospital', specialty: 'General Medicine', totalBeds: 20, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'ward-2', name: 'Ward B — Cardiology', hospitalId: 'demo-hospital', specialty: 'Cardiology', totalBeds: 15, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'ward-3', name: 'Ward C — Surgery', hospitalId: 'demo-hospital', specialty: 'Surgery', totalBeds: 18, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

// ── Users ──────────────────────────────────────────────────────────────────────

export const MOCK_USERS = [
  { id: 'user-doctor-1', hospitalId: 'demo-hospital', firstName: 'Alice', lastName: 'Chen', email: 'doctor@careround.demo', role: 'DOCTOR' as const, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-doctor-2', hospitalId: 'demo-hospital', firstName: 'Ben', lastName: 'Harrington', email: 'doctor2@careround.demo', role: 'DOCTOR' as const, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-nurse-1', hospitalId: 'demo-hospital', firstName: 'Maria', lastName: 'Santos', email: 'nurse@careround.demo', role: 'NURSE' as const, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-nurse-2', hospitalId: 'demo-hospital', firstName: 'James', lastName: 'Okafor', email: 'nurse2@careround.demo', role: 'NURSE' as const, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-nurse-3', hospitalId: 'demo-hospital', firstName: 'Sarah', lastName: 'Kimani', email: 'nurse3@careround.demo', role: 'NURSE' as const, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-supervisor-1', hospitalId: 'demo-hospital', firstName: 'David', lastName: 'Patel', email: 'supervisor@careround.demo', role: 'SUPERVISOR' as const, isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

// ── Patients ───────────────────────────────────────────────────────────────────

export const MOCK_PATIENTS = [
  {
    id: 'patient-1', hospitalId: 'demo-hospital', wardId: 'ward-1', bedNumber: '4A',
    firstName: 'George', lastName: 'Thompson', dateOfBirth: '1948-03-12',
    gender: 'MALE' as const, hospitalNumber: 'HN-10042',
    primaryDiagnosis: 'Acute COPD exacerbation', acuityColor: 'RED' as const,
    status: 'ADMITTED' as const, admissionDate: '2026-05-20T08:00:00Z',
    admissionType: 'EMERGENCY' as const, registeredById: 'user-doctor-1',
    createdAt: '2026-05-20T08:00:00Z', updatedAt: '2026-05-24T08:00:00Z',
  },
  {
    id: 'patient-2', hospitalId: 'demo-hospital', wardId: 'ward-1', bedNumber: '2B',
    firstName: 'Margaret', lastName: 'Williams', dateOfBirth: '1955-07-22',
    gender: 'FEMALE' as const, hospitalNumber: 'HN-10089',
    primaryDiagnosis: 'Type 2 diabetes — poor glycaemic control', acuityColor: 'AMBER' as const,
    status: 'ADMITTED' as const, admissionDate: '2026-05-22T10:30:00Z',
    admissionType: 'ELECTIVE' as const, registeredById: 'user-doctor-1',
    createdAt: '2026-05-22T10:30:00Z', updatedAt: '2026-05-24T08:00:00Z',
  },
  {
    id: 'patient-3', hospitalId: 'demo-hospital', wardId: 'ward-1', bedNumber: '7C',
    firstName: 'Robert', lastName: 'Johnson', dateOfBirth: '1962-11-05',
    gender: 'MALE' as const, hospitalNumber: 'HN-10103',
    primaryDiagnosis: 'Community-acquired pneumonia', acuityColor: 'GREEN' as const,
    status: 'ADMITTED' as const, admissionDate: '2026-05-23T14:00:00Z',
    admissionType: 'EMERGENCY' as const, registeredById: 'user-doctor-1',
    createdAt: '2026-05-23T14:00:00Z', updatedAt: '2026-05-24T08:00:00Z',
  },
  {
    id: 'patient-4', hospitalId: 'demo-hospital', wardId: 'ward-2', bedNumber: '1A',
    firstName: 'Patricia', lastName: 'Moore', dateOfBirth: '1970-02-18',
    gender: 'FEMALE' as const, hospitalNumber: 'HN-10118',
    primaryDiagnosis: 'Hypertensive emergency', acuityColor: 'AMBER' as const,
    status: 'ADMITTED' as const, admissionDate: '2026-05-21T09:00:00Z',
    admissionType: 'EMERGENCY' as const, registeredById: 'user-doctor-2',
    createdAt: '2026-05-21T09:00:00Z', updatedAt: '2026-05-24T08:00:00Z',
  },
  {
    id: 'patient-5', hospitalId: 'demo-hospital', wardId: 'ward-3', bedNumber: '3D',
    firstName: 'Charles', lastName: 'Davis', dateOfBirth: '1985-09-30',
    gender: 'MALE' as const, hospitalNumber: 'HN-10125',
    primaryDiagnosis: 'Post-operative recovery — appendectomy', acuityColor: 'GREEN' as const,
    status: 'ADMITTED' as const, admissionDate: '2026-05-24T07:00:00Z',
    admissionType: 'ELECTIVE' as const, registeredById: 'user-doctor-1',
    createdAt: '2026-05-24T07:00:00Z', updatedAt: '2026-05-24T08:00:00Z',
  },
];

// ── Vitals ─────────────────────────────────────────────────────────────────────

const NOW = new Date('2026-05-24T14:00:00Z');
function hoursAgo(h: number): string {
  return new Date(NOW.getTime() - h * 3600000).toISOString();
}

export const MOCK_VITALS: Record<string, object[]> = {
  'patient-1': [
    {
      id: 'vitals-1-1', patientId: 'patient-1', hospitalId: 'demo-hospital', recordedById: 'user-nurse-1',
      recordedByName: 'Maria Santos', recordedAt: hoursAgo(2),
      temperature: 38.4, pulse: 110, systolicBp: 145, diastolicBp: 92,
      respiratoryRate: 24, spo2: 91, vhiScore: 7, vhiStatus: 'CRITICAL',
      createdAt: hoursAgo(2), updatedAt: hoursAgo(2),
    },
    {
      id: 'vitals-1-2', patientId: 'patient-1', hospitalId: 'demo-hospital', recordedById: 'user-nurse-2',
      recordedByName: 'James Okafor', recordedAt: hoursAgo(6),
      temperature: 38.8, pulse: 118, systolicBp: 150, diastolicBp: 96,
      respiratoryRate: 26, spo2: 89, vhiScore: 9, vhiStatus: 'CRITICAL',
      createdAt: hoursAgo(6), updatedAt: hoursAgo(6),
    },
  ],
  'patient-2': [
    {
      id: 'vitals-2-1', patientId: 'patient-2', hospitalId: 'demo-hospital', recordedById: 'user-nurse-1',
      recordedByName: 'Maria Santos', recordedAt: hoursAgo(3),
      temperature: 37.1, pulse: 88, systolicBp: 138, diastolicBp: 85,
      respiratoryRate: 18, spo2: 97, vhiScore: 3, vhiStatus: 'WATCH',
      createdAt: hoursAgo(3), updatedAt: hoursAgo(3),
    },
  ],
  'patient-3': [
    {
      id: 'vitals-3-1', patientId: 'patient-3', hospitalId: 'demo-hospital', recordedById: 'user-nurse-3',
      recordedByName: 'Sarah Kimani', recordedAt: hoursAgo(4),
      temperature: 37.6, pulse: 82, systolicBp: 122, diastolicBp: 78,
      respiratoryRate: 20, spo2: 96, vhiScore: 2, vhiStatus: 'STABLE',
      createdAt: hoursAgo(4), updatedAt: hoursAgo(4),
    },
  ],
  'patient-4': [],
  'patient-5': [],
};

// ── Notes ──────────────────────────────────────────────────────────────────────

export const MOCK_NOTES: Record<string, object[]> = {
  'patient-1': [
    {
      id: 'note-1-1', patientId: 'patient-1', hospitalId: 'demo-hospital', authorId: 'user-doctor-1',
      authorName: 'Dr. Alice Chen', authorRole: 'DOCTOR',
      noteType: 'WARD_ROUND_NOTE', isAiGenerated: true,
      content: 'SOAP note generated from ward round recording.',
      subjective: 'Patient reports increased breathlessness over past 24h. Poor sleep.',
      objective: 'SpO2 91% on room air. RR 24. Widespread expiratory wheeze.',
      assessment: 'Acute COPD exacerbation — severe. NEWS2 score 7.',
      plan: 'Salbutamol NEB q4h. Prednisolone 40mg OD × 5 days. Consider NIV.',
      rawTranscription: 'Patient states breathlessness worse...',
      createdAt: hoursAgo(2), updatedAt: hoursAgo(2),
    },
  ],
  'patient-2': [
    {
      id: 'note-2-1', patientId: 'patient-2', hospitalId: 'demo-hospital', authorId: 'user-doctor-1',
      authorName: 'Dr. Alice Chen', authorRole: 'DOCTOR',
      noteType: 'PROGRESS_NOTE', isAiGenerated: false,
      content: 'CBG readings trending down — 16.2 this morning. Metformin dose reviewed. Dietitian referral placed.',
      createdAt: hoursAgo(5), updatedAt: hoursAgo(5),
    },
  ],
  'patient-3': [
    {
      id: 'note-3-1', patientId: 'patient-3', hospitalId: 'demo-hospital', authorId: 'user-doctor-1',
      authorName: 'Dr. Alice Chen', authorRole: 'DOCTOR',
      noteType: 'WARD_ROUND_NOTE', isAiGenerated: true,
      content: 'SOAP note from ward round.',
      subjective: 'Patient feeling better. Cough still productive but less frequent.',
      objective: 'Temp 37.6, SpO2 96% on 2L O2. CXR — right lower lobe consolidation improving.',
      assessment: 'CAP — improving on current treatment.',
      plan: 'Continue Amoxicillin IV. Step down to oral if temp normal for 24h.',
      createdAt: hoursAgo(8), updatedAt: hoursAgo(8),
    },
  ],
  'patient-4': [],
  'patient-5': [],
};

// ── Prescriptions ──────────────────────────────────────────────────────────────

export const MOCK_PRESCRIPTIONS: Record<string, object[]> = {
  'patient-1': [
    {
      id: 'rx-1-1', patientId: 'patient-1', hospitalId: 'demo-hospital', clinicalNoteId: 'note-1-1',
      confirmedById: 'user-doctor-1', confirmedByName: 'Dr. Alice Chen',
      drugName: 'Salbutamol', dose: '2.5mg', route: 'NEB',
      frequencyString: 'Q4H', frequencyHours: 4, totalDoses: 30,
      startTime: '2026-05-20T08:00:00Z', administrationTimes: [],
      status: 'ACTIVE', confirmedAt: '2026-05-20T08:30:00Z',
      createdAt: '2026-05-20T08:30:00Z', updatedAt: '2026-05-24T08:00:00Z',
    },
    {
      id: 'rx-1-2', patientId: 'patient-1', hospitalId: 'demo-hospital', clinicalNoteId: 'note-1-1',
      confirmedById: 'user-doctor-1', confirmedByName: 'Dr. Alice Chen',
      drugName: 'Prednisolone', dose: '40mg', route: 'PO',
      frequencyString: 'OD', frequencyHours: 24, totalDoses: 5,
      startTime: '2026-05-20T08:00:00Z', administrationTimes: [],
      status: 'ACTIVE', confirmedAt: '2026-05-20T08:30:00Z',
      createdAt: '2026-05-20T08:30:00Z', updatedAt: '2026-05-24T08:00:00Z',
    },
  ],
  'patient-2': [
    {
      id: 'rx-2-1', patientId: 'patient-2', hospitalId: 'demo-hospital',
      confirmedById: 'user-doctor-1', confirmedByName: 'Dr. Alice Chen',
      drugName: 'Metformin', dose: '1g', route: 'PO',
      frequencyString: 'BD', frequencyHours: 12, totalDoses: 60,
      startTime: '2026-05-22T08:00:00Z', administrationTimes: [],
      status: 'ACTIVE', confirmedAt: '2026-05-22T08:30:00Z',
      createdAt: '2026-05-22T08:30:00Z', updatedAt: '2026-05-24T08:00:00Z',
    },
  ],
  'patient-3': [
    {
      id: 'rx-3-1', patientId: 'patient-3', hospitalId: 'demo-hospital',
      confirmedById: 'user-doctor-1', confirmedByName: 'Dr. Alice Chen',
      drugName: 'Amoxicillin', dose: '1g', route: 'IV',
      frequencyString: 'TDS', frequencyHours: 8, totalDoses: 21,
      startTime: '2026-05-23T08:00:00Z', administrationTimes: [],
      status: 'ACTIVE', confirmedAt: '2026-05-23T08:30:00Z',
      createdAt: '2026-05-23T08:30:00Z', updatedAt: '2026-05-24T08:00:00Z',
    },
  ],
  'patient-4': [],
  'patient-5': [],
};

// ── Tasks ──────────────────────────────────────────────────────────────────────

const past2h = new Date(NOW.getTime() - 2 * 3600000).toISOString();
const past30m = new Date(NOW.getTime() - 30 * 60000).toISOString();
const future30m = new Date(NOW.getTime() + 30 * 60000).toISOString();
const future2h = new Date(NOW.getTime() + 2 * 3600000).toISOString();

export const MOCK_TASKS = [
  {
    id: 'task-1', patientId: 'patient-1', hospitalId: 'demo-hospital', wardId: 'ward-1',
    medicationChartId: 'chart-1', patientName: 'George Thompson', bedNumber: '4A',
    wardName: 'Ward A', drugName: 'Salbutamol', dose: '2.5mg', route: 'NEB',
    scheduledTime: past2h, status: 'PENDING' as const, minutesOverdue: 120,
    createdAt: past2h, updatedAt: past2h,
  },
  {
    id: 'task-2', patientId: 'patient-1', hospitalId: 'demo-hospital', wardId: 'ward-1',
    medicationChartId: 'chart-2', patientName: 'George Thompson', bedNumber: '4A',
    wardName: 'Ward A', drugName: 'Prednisolone', dose: '40mg', route: 'PO',
    scheduledTime: past30m, status: 'PENDING' as const, minutesOverdue: 30,
    createdAt: past30m, updatedAt: past30m,
  },
  {
    id: 'task-3', patientId: 'patient-2', hospitalId: 'demo-hospital', wardId: 'ward-1',
    medicationChartId: 'chart-3', patientName: 'Margaret Williams', bedNumber: '2B',
    wardName: 'Ward A', drugName: 'Metformin', dose: '1g', route: 'PO',
    scheduledTime: future30m, status: 'PENDING' as const,
    createdAt: future30m, updatedAt: future30m,
  },
  {
    id: 'task-4', patientId: 'patient-3', hospitalId: 'demo-hospital', wardId: 'ward-1',
    medicationChartId: 'chart-4', patientName: 'Robert Johnson', bedNumber: '7C',
    wardName: 'Ward A', drugName: 'Amoxicillin', dose: '1g', route: 'IV',
    scheduledTime: future2h, status: 'PENDING' as const,
    createdAt: future2h, updatedAt: future2h,
  },
  {
    id: 'task-5', patientId: 'patient-1', hospitalId: 'demo-hospital', wardId: 'ward-1',
    medicationChartId: 'chart-1', patientName: 'George Thompson', bedNumber: '4A',
    wardName: 'Ward A', drugName: 'Salbutamol', dose: '2.5mg', route: 'NEB',
    scheduledTime: hoursAgo(6), status: 'COMPLETED' as const,
    completedAt: hoursAgo(5.9), completedByName: 'Maria Santos',
    createdAt: hoursAgo(6), updatedAt: hoursAgo(5.9),
  },
  {
    id: 'task-6', patientId: 'patient-2', hospitalId: 'demo-hospital', wardId: 'ward-1',
    medicationChartId: 'chart-3', patientName: 'Margaret Williams', bedNumber: '2B',
    wardName: 'Ward A', drugName: 'Metformin', dose: '1g', route: 'PO',
    scheduledTime: hoursAgo(8), status: 'COMPLETED' as const,
    completedAt: hoursAgo(7.8), completedByName: 'James Okafor',
    createdAt: hoursAgo(8), updatedAt: hoursAgo(7.8),
  },
];

// ── Mutable demo state ─────────────────────────────────────────────────────────
// These get mutated by POST/PUT operations so writes appear to "persist" during
// a single demo session (resets on app reload).

// Use object type to allow flexible mutation (completed status, completedAt, etc.)
const mutableTasks: Record<string, unknown>[] = MOCK_TASKS.map((t) => ({ ...(t as object) }));
const mutableNotes: Record<string, object[]> = Object.fromEntries(
  Object.entries(MOCK_NOTES).map(([k, v]) => [k, [...v]]),
);
const mutableVitals: Record<string, object[]> = Object.fromEntries(
  Object.entries(MOCK_VITALS).map(([k, v]) => [k, [...v]]),
);

// ── Response helper ────────────────────────────────────────────────────────────

export interface DemoApiResponse {
  success: boolean;
  data: unknown;
  message?: string;
}

// ── Auth helpers ───────────────────────────────────────────────────────────────

function getMockAuthResponse(email: string): object {
  const lower = email.toLowerCase();
  let user = MOCK_USERS[0];
  if (lower.includes('nurse')) user = MOCK_USERS[2];
  else if (lower.includes('supervisor')) user = MOCK_USERS[5];

  return {
    accessToken: `demo.${user.role}.${user.id}`,
    refreshToken: `demo-refresh.${user.id}`,
    tokenType: 'Bearer',
    expiresIn: 86400,
    userId: user.id,
    hospitalId: user.hospitalId,
    role: user.role,
  };
}

function getUserFromToken(token: string): object {
  const parts = token.split('.');
  const userId = parts[2] ?? '';
  return MOCK_USERS.find((u) => u.id === userId) ?? MOCK_USERS[0];
}

// ── Main dispatcher ────────────────────────────────────────────────────────────

export function getMockResponse(
  url: string | undefined,
  method: string | undefined,
  requestData?: unknown,
  headers?: Record<string, string>,
): DemoApiResponse {
  const path = url ?? '';
  const verb = (method ?? 'GET').toUpperCase();

  // Auth
  if (path.includes('/auth/login') && verb === 'POST') {
    const body = requestData as { email?: string } | null;
    return { success: true, data: getMockAuthResponse(body?.email ?? '') };
  }

  if (path.includes('/auth/refresh')) {
    const authHeader = headers?.['Authorization'] ?? headers?.['authorization'] ?? '';
    const token = authHeader.replace('Bearer ', '');
    return { success: true, data: getMockAuthResponse(token.split('.')[2] ?? '') };
  }

  if (path.includes('/users/me') && !path.includes('device-token') && verb === 'GET') {
    const authHeader = headers?.['Authorization'] ?? headers?.['authorization'] ?? '';
    const token = authHeader.replace('Bearer ', '');
    return { success: true, data: getUserFromToken(token) };
  }

  if (path.includes('/users/me/device-token')) {
    return { success: true, data: {} };
  }

  if (path.includes('/users') && verb === 'GET') {
    return { success: true, data: MOCK_USERS };
  }

  // Vitals
  const vitalsPostMatch = path.match(/\/patients\/([^/?]+)\/vitals/) && verb === 'POST';
  const vitalsGetMatch = path.match(/\/patients\/([^/?]+)\/vitals/);
  if (vitalsGetMatch && verb === 'POST') {
    const id = vitalsGetMatch[1];
    const rec = {
      id: `vitals-${Date.now()}`,
      patientId: id,
      hospitalId: 'demo-hospital',
      recordedById: 'demo-user',
      recordedByName: 'Demo User',
      recordedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vhiScore: 0,
      vhiStatus: 'STABLE',
      ...((requestData as Record<string, unknown>) ?? {}),
    };
    if (!mutableVitals[id]) mutableVitals[id] = [];
    (mutableVitals[id] as object[]).unshift(rec);
    return { success: true, data: rec };
  }
  void vitalsPostMatch;
  if (vitalsGetMatch && verb === 'GET') {
    const id = vitalsGetMatch[1];
    return { success: true, data: mutableVitals[id] ?? [] };
  }

  // Confirm note (AI voice)
  const confirmNoteMatch = path.match(/\/patients\/([^/?]+)\/notes\/confirm/);
  if (confirmNoteMatch && verb === 'POST') {
    const id = confirmNoteMatch[1];
    const note = {
      id: `note-${Date.now()}`,
      patientId: id,
      hospitalId: 'demo-hospital',
      authorId: 'demo-user',
      authorName: 'Dr. Demo',
      authorRole: 'DOCTOR',
      isAiGenerated: true,
      noteType: 'WARD_ROUND_NOTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...((requestData as Record<string, unknown>) ?? {}),
    };
    if (!mutableNotes[id]) mutableNotes[id] = [];
    (mutableNotes[id] as object[]).unshift(note);
    return { success: true, data: note };
  }

  // Notes
  const notesMatch = path.match(/\/patients\/([^/?]+)\/notes/);
  if (notesMatch && verb === 'GET') {
    const id = notesMatch[1];
    return { success: true, data: mutableNotes[id] ?? [] };
  }
  if (notesMatch && verb === 'POST') {
    const id = notesMatch[1];
    const note = {
      id: `note-${Date.now()}`,
      patientId: id,
      hospitalId: 'demo-hospital',
      authorId: 'demo-user',
      authorName: 'Demo User',
      authorRole: 'NURSE',
      isAiGenerated: false,
      noteType: 'PROGRESS_NOTE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...((requestData as Record<string, unknown>) ?? {}),
    };
    if (!mutableNotes[id]) mutableNotes[id] = [];
    (mutableNotes[id] as object[]).unshift(note);
    return { success: true, data: note };
  }

  // Prescriptions
  const prescrMatch = path.match(/\/patients\/([^/?]+)\/prescriptions/);
  if (prescrMatch && verb === 'GET') {
    const id = prescrMatch[1];
    return { success: true, data: MOCK_PRESCRIPTIONS[id] ?? [] };
  }
  if (prescrMatch) {
    return {
      success: true,
      data: {
        id: `rx-${Date.now()}`,
        hospitalId: 'demo-hospital',
        confirmedByName: 'Dr. Demo',
        administrationTimes: [],
        ...((requestData as Record<string, unknown>) ?? {}),
      },
    };
  }

  // Patient detail
  const patientDetailMatch = path.match(/\/patients\/([^/?]+)$/);
  if (patientDetailMatch && verb === 'GET') {
    const id = patientDetailMatch[1];
    const patient = MOCK_PATIENTS.find((p) => p.id === id);
    if (patient) return { success: true, data: patient };
    return { success: false, data: null, message: 'Patient not found' };
  }

  // Patient list
  if ((path.endsWith('/patients') || path.includes('/patients?')) && verb === 'GET') {
    return { success: true, data: MOCK_PATIENTS };
  }

  // Medication task complete
  const completeTaskMatch = path.match(/\/medication-tasks\/([^/?]+)\/complete/);
  if (completeTaskMatch && (verb === 'PUT' || verb === 'POST')) {
    const taskId = completeTaskMatch[1];
    const idx = mutableTasks.findIndex((t) => t['id'] === taskId);
    if (idx !== -1) {
      mutableTasks[idx] = {
        ...mutableTasks[idx],
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        completedByName: 'Demo User',
      };
      return { success: true, data: mutableTasks[idx] };
    }
    return { success: false, data: null, message: 'Task not found' };
  }

  // Medication task list
  if (path.includes('/medication-tasks') && verb === 'GET') {
    return { success: true, data: mutableTasks };
  }

  // AI voice processing
  if (path.includes('/ai/process-voice-note')) {
    const patientId = path.match(/patients\/([^/?]+)/)?.[1] ?? 'patient-1';
    return {
      success: true,
      data: {
        rawTranscription: 'Patient reports improved breathlessness. SpO2 94% on 2L O2.',
        clinicalNote: {
          subjective: 'Patient reports improved breathlessness since yesterday.',
          objective: 'SpO2 94% on 2L O2. RR 20. HR 94. Chest clearer.',
          assessment: 'Improving on current management.',
          plan: 'Step down O2 to 1L. Continue current medications. Reassess in 4 hours.',
        },
        prescriptions: [
          { drugName: 'Salbutamol', dose: '2.5mg', route: 'NEB', frequencyString: 'Q6H', frequencyHours: 6, totalDoses: 20, administrationTimes: [] },
        ],
        patientId,
      },
    };
  }

  // Wards
  if (path.includes('/wards') && verb === 'GET') {
    return { success: true, data: MOCK_WARDS };
  }

  // Default — success with echoed body
  return { success: true, data: (requestData as Record<string, unknown>) ?? {} };
}
