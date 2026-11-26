/**
 * Entity types as returned by the NestJS backend.
 *
 * These mirror the Prisma models on the backend, but with Decimal → number
 * (handled by the backend's `serialize` helper) and Date → ISO string
 * (handled automatically by JSON.stringify on the wire).
 */

export type PaymentStatus = "PAID" | "UNPAID" | "PARTIAL";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "OTHER";

export type ScheduleSlot = {
  day:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  startTime: string; // "HH:MM"
  endTime: string;
};

export type GroupSummary = {
  id: string;
  name: string;
};

export type Group = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
  schedule: ScheduleSlot[];
  monthlyFee: number;
  maxCapacity: number | null;
  coachName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroupWithCount = Group & {
  _count: { students: number };
};

export type StudentSummary = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  isActive: boolean;
};

export type Student = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  address: string | null;
  school: string | null;
  phoneNumber: string | null;
  groupId: string | null;
  isActive: boolean;
  archived: boolean;
  archivedAt: string | null;
  /** Per-student override of the group's monthly fee. Null = inherit. */
  monthlyFee: number | null;
  notes: string | null;
  /** Siblings share a familyId (null = no linked siblings). */
  familyId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentWithGroup = Student & {
  group: GroupSummary | null;
};

export type Payment = {
  id: string;
  studentId: string;
  month: number;
  year: number;
  amount: number;
  /** Sibling discount already taken off `amount` (0 = none). */
  discount: number;
  status: PaymentStatus;
  paidAmount: number;
  paymentDate: string | null;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SiblingSummary = {
  id: string;
  fullName: string;
  archived: boolean;
  group: GroupSummary | null;
};

export type StudentDetail = Student & {
  group: Group | null;
  payments: Payment[];
  /** Linked siblings (same familyId), excluding this student. */
  siblings: SiblingSummary[];
};

export type SiblingSuggestion = SiblingSummary & { phoneNumber: string | null };

export type GroupDetail = Group & {
  students: Student[];
};

/**
 * A student on a given month's roster, with that month's invoice embedded.
 * Students removed from the month are not returned at all.
 */
export type StudentMonthRow = StudentWithGroup & {
  payments: Payment[]; // length 0 or 1 (this month)
};

export type PaymentWithStudent = Payment & {
  student: { id: string; fullName: string };
};

export type Settings = {
  id: "singleton";
  academyName: string;
  defaultFee: number;
  whatsappCountry: string;
  /** Custom reminder template. Null = use the built-in default. */
  whatsappTemplate: string | null;
  /** Custom WhatsApp receipt template; null = built-in default. */
  whatsappReceiptTemplate: string | null;
  /** Sibling discount on monthly fees (2nd child onwards). */
  siblingDiscountType: "NONE" | "PERCENT" | "FIXED";
  siblingDiscountValue: number;
  updatedAt: string;
};

/** Free-form size label (e.g. "S", "M", "XXL", "6Y"). Max 20 chars in the DB. */
export type UniformSize = string;

export type Uniform = {
  id: string;
  studentId: string;
  size: UniformSize;
  price: number;
  isPaid: boolean;
  paidAt: string | null;
  paidAmount: number;
  isReceived: boolean;
  receivedAt: string | null;
  orderedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UniformWithStudent = Uniform & {
  /** `archived` = the student has left; their unpaid uniforms still count. */
  student: { id: string; fullName: string; phoneNumber: string | null; archived: boolean };
};

// ---------- Monthly roster ----------

export type RosterPayment = {
  id: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
};

export type RosterStudent = {
  enrollmentId: string;
  studentId: string;
  fullName: string;
  phoneNumber: string | null;
  isActive: boolean;
  archived: boolean;
  /** The group this student trained with during this month. */
  group: GroupSummary | null;
  /** True when they were not on the previous month's roster. */
  isNew: boolean;
  payment: RosterPayment | null;
};

export type RosterMonth = {
  year: number;
  month: number;
  /** How many rows were just carried over from the previous month. */
  seeded: number;
  previous: { year: number; month: number };
  students: RosterStudent[];
  newCount: number;
  leftCount: number;
  left: { studentId: string; fullName: string }[];
};

export type RosterCandidate = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  archived: boolean;
  group: GroupSummary | null;
};

export type RosterMonthSummary = {
  year: number;
  month: number;
  count: number;
};

// ---------- Attendance ----------

export type AttendanceGroupCard = {
  groupId: string;
  groupName: string;
  coachName: string | null;
  schedule: ScheduleSlot[];
  studentCount: number;
  sessionCount: number;
  lastSessionDate: string | null;
  /** Percentage of ticked boxes across the month, or null with no checklists. */
  attendanceRate: number | null;
};

export type AttendanceOverview = {
  year: number;
  month: number;
  groups: AttendanceGroupCard[];
};

export type AttendanceSessionSummary = {
  id: string;
  date: string;
  notes: string | null;
  /** Cancelled sessions (rain, holiday…) never count as absences. */
  cancelled: boolean;
  cancelReason: string | null;
  presentCount: number;
  totalCount: number;
};

export type AttendanceGridStudent = {
  studentId: string;
  fullName: string;
  phoneNumber: string | null;
  /** False = they have marks this month but are no longer on the roster. */
  onRoster: boolean;
  presentCount: number;
  absentCount: number;
  /** One cell per checklist, in date order. null = not on that checklist. */
  cells: { sessionId: string; present: boolean | null }[];
};

export type AttendanceGrid = {
  group: { id: string; name: string; coachName: string | null; schedule: ScheduleSlot[] };
  year: number;
  month: number;
  sessions: AttendanceSessionSummary[];
  students: AttendanceGridStudent[];
  sessionCount: number;
};

export type AttendanceChecklist = {
  id: string;
  groupId: string;
  group: { id: string; name: string; coachName: string | null };
  date: string;
  notes: string | null;
  year: number;
  month: number;
  students: {
    studentId: string;
    fullName: string;
    phoneNumber: string | null;
    present: boolean;
  }[];
  presentCount: number;
  /** True until the checklist has been saved for the first time. */
  isNew: boolean;
  /** Cancelled (rain, holiday…): kept for the record, never an absence. */
  cancelled: boolean;
  cancelReason: string | null;
  /** Children coming to try this group on this day (not students). */
  trials: { id: string; fullName: string; phoneNumber: string | null; status: TrialStatus }[];
};

export type LoginResponse = {
  accessToken: string;
  user: { id: string; email: string; name: string | null };
};

/** GET /payments/history — capped list plus the real total. */
export type PaymentHistory = {
  rows: PaymentWithStudent[];
  total: number;
  /** True when more rows matched than were returned (cap: 500). */
  truncated: boolean;
};

/** GET /payments/stats?year= — aggregates computed in the database. */
export type PaymentStats = {
  year: number;
  /** Money received on invoices of `year`. */
  revenue: number;
  /** Invoices of `year` with any money received. */
  paymentsCount: number;
  /** Latest payments received (any year), newest first. */
  recent: PaymentWithStudent[];
};

// ---------- Receipts ----------

/** GET /payments/:id/receipt and /uniforms/:id/receipt */
export type Receipt = {
  kind: "FEE" | "UNIFORM";
  student: { id: string; fullName: string; phoneNumber: string | null };
  /** FEE only */
  month?: number;
  year?: number;
  /** UNIFORM only */
  size?: string;
  total: number;
  paid: number;
  remaining: number;
  /** The latest money received (null when nothing was paid). */
  last: { amount: number; date: string; method: PaymentMethod } | null;
};

// ---------- Daily cash report ----------

export type LedgerTransaction = {
  id: string;
  kind: "FEE" | "UNIFORM";
  /** Negative = an undo / correction. */
  amount: number;
  method: PaymentMethod;
  date: string;
  note: string | null;
  createdAt: string;
  student: { id: string; fullName: string };
  payment: { id: string; month: number; year: number } | null;
  uniform: { id: string; size: string } | null;
};

/** GET /reports/daily?date= (or ?from=&to=) */
export type DailyReport = {
  from: string;
  to: string;
  total: number;
  count: number;
  byMethod: Record<PaymentMethod, number>;
  byKind: { FEE: number; UNIFORM: number };
  transactions: LedgerTransaction[];
};

// ---------- Trials ----------

export type TrialStatus = "SCHEDULED" | "ATTENDED" | "NO_SHOW" | "JOINED" | "DECLINED";

export type Trial = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  groupId: string | null;
  trialDate: string;
  status: TrialStatus;
  notes: string | null;
  /** Set once the trial turned into a real student. */
  studentId: string | null;
  createdAt: string;
  updatedAt: string;
  group: GroupSummary | null;
  student: { id: string; fullName: string } | null;
};

// ---------- Families page ----------

export type FamilyMember = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  familyId: string | null;
  archived: boolean;
  group: GroupSummary | null;
};

/** GET /students/families */
export type FamiliesOverview = {
  /** Existing families (2+ members). */
  families: { familyId: string; members: FamilyMember[] }[];
  /** Current students sharing a parent phone, not yet one family. */
  suggestions: { phone: string; members: FamilyMember[] }[];
  /** Every current student (for manual linking). */
  students: FamilyMember[];
};
