export type Role = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'SUPERVISOR';
export type AcuityColor = 'GREEN' | 'AMBER' | 'RED';
export type VhiStatus = 'STABLE' | 'WATCH' | 'CRITICAL';
export type AdmissionType = 'EMERGENCY' | 'ELECTIVE' | 'TRANSFER';
export type PatientStatus = 'ADMITTED' | 'DISCHARGED';
export type PatientGender = 'MALE' | 'FEMALE' | 'OTHER';
export type NoteType =
  | 'WARD_ROUND_NOTE'
  | 'PROGRESS_NOTE'
  | 'ADMISSION_NOTE'
  | 'DISCHARGE_NOTE'
  | 'HANDOVER_NOTE'
  | 'NURSING_REPORT';
export type PrescriptionStatus = 'ACTIVE' | 'DISCONTINUED' | 'COMPLETED';
export type TaskStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  hospitalId: string;
  role: Role;
}

export interface User {
  id: string;
  hospitalId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ward {
  id: string;
  hospitalId: string;
  name: string;
  specialty?: string;
  totalBeds: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  hospitalId: string;
  wardId: string;
  bedNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: PatientGender;
  hospitalNumber: string;
  phoneNumber?: string;
  address?: string;
  previousConditions?: string;
  currentMedications?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  admissionDate: string;
  admissionType: AdmissionType;
  primaryDiagnosis?: string;
  acuityColor: AcuityColor;
  status: PatientStatus;
  registeredById: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientVitals {
  id: string;
  patientId: string;
  hospitalId: string;
  recordedById: string;
  pulse?: number;
  systolicBp?: number;
  diastolicBp?: number;
  respiratoryRate?: number;
  temperature?: number;
  spo2?: number;
  vhiScore: number;
  vhiStatus: VhiStatus;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  hospitalId: string;
  authorId: string;
  noteType: NoteType;
  content: string;
  rawTranscription?: string;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SoapContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface AdministrationSlot {
  scheduledTime: string;
  completedAt?: string;
  completedByName?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  hospitalId: string;
  clinicalNoteId?: string;
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours: number;
  totalDoses: number;
  startTime: string;
  administrationTimes: AdministrationSlot[];
  confirmedById: string;
  confirmedAt: string;
  status: PrescriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationTask {
  id: string;
  medicationChartId: string;
  patientId: string;
  hospitalId: string;
  wardId: string;
  assignedNurseId?: string;
  scheduledTime: string;
  status: TaskStatus;
  completedAt?: string;
  completedById?: string;
  completedByName?: string;
  actualDoseGiven?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  id: string;
  hospitalId: string;
  taskOverdueReminderMinutes: number;
  taskEscalationMinutes: number;
  pushNotificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cr_access_token',
  REFRESH_TOKEN: 'cr_refresh_token',
  USER: 'cr_user',
  ROLE: 'cr_role',
  FCM_TOKEN: 'cr_fcm_token',
  NOTIF_DENIED: 'cr_notif_denied',
  NOTIF_PROMPTED: 'cr_notif_prompted',
} as const;

// ── Enriched types (server joins the user name) ───────────────────────────────

export interface PatientVitalsEnriched extends PatientVitals {
  recordedByName: string;
}

export interface ClinicalNoteEnriched extends ClinicalNote {
  authorName: string;
  authorRole: string;
}

export interface PrescriptionEnriched extends Prescription {
  confirmedByName: string;
}

export interface MedicationTaskEnriched extends MedicationTask {
  patientName: string;
  bedNumber?: string;
  wardName?: string;
  drugName: string;
  dose: string;
  route: string;
  minutesOverdue?: number;
}

// ── AI / Voice-note types ─────────────────────────────────────────────────────

export interface AiPrescription {
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours: number;
  totalDoses: number;
  administrationTimes: string[];
}

export interface AiProcessingResult {
  rawTranscription: string;
  clinicalNote: SoapContent;
  prescriptions: AiPrescription[];
}

export interface ConfirmNoteRequest {
  rawTranscription: string;
  clinicalNote: SoapContent;
  prescriptions: AiPrescription[];
}
