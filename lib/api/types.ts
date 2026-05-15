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
  orderedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UniformWithStudent = Uniform & {
  student: { id: string; fullName: string; phoneNumber: string | null };
};

export type LoginResponse = {
  accessToken: string;
  user: { id: string; email: string; name: string | null };
};
