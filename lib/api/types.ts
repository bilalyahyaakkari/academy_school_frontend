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
  status: PaymentStatus;
  paidAmount: number;
  paymentDate: string | null;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentDetail = Student & {
  group: Group | null;
  payments: Payment[];
};

export type GroupDetail = Group & {
  students: Student[];
};

export type StudentMonthRow = StudentWithGroup & {
  payments: Payment[]; // length 0 or 1 (this month)
  /**
   * False when the student isn't on this month's roster but still has an
   * invoice for it — i.e. they left with a balance open.
   */
  onRoster: boolean;
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
  student: { id: string; fullName: string; phoneNumber: string | null };
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
};

export type LoginResponse = {
  accessToken: string;
  user: { id: string; email: string; name: string | null };
};
