export const JOB_STATUSES = [
  "draft",
  "quoted",
  "awaiting_approval",
  "approved",
  "awaiting_payment",
  "ready_for_production",
  "in_production",
  "quality_check",
  "ready_for_collection",
  "completed",
  "on_hold",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  quoted: "Quoted",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  awaiting_payment: "Awaiting payment",
  ready_for_production: "Ready for production",
  in_production: "In production",
  quality_check: "Quality check",
  ready_for_collection: "Ready for collection",
  completed: "Completed",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

/** Allowed forward transitions. Enforced in the database layer too. */
export const JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ["quoted", "cancelled"],
  quoted: ["awaiting_approval", "cancelled", "on_hold"],
  awaiting_approval: ["approved", "cancelled", "on_hold"],
  approved: ["awaiting_payment", "ready_for_production", "cancelled", "on_hold"],
  awaiting_payment: ["ready_for_production", "cancelled", "on_hold"],
  ready_for_production: ["in_production", "on_hold", "cancelled"],
  in_production: ["quality_check", "on_hold"],
  quality_check: ["ready_for_collection", "in_production"],
  ready_for_collection: ["completed"],
  completed: [],
  on_hold: ["approved", "ready_for_production", "in_production", "cancelled"],
  cancelled: [],
};

export type ToneKey = "neutral" | "info" | "warning" | "success" | "danger" | "accent";

export const JOB_STATUS_TONE: Record<JobStatus, ToneKey> = {
  draft: "neutral",
  quoted: "info",
  awaiting_approval: "warning",
  approved: "info",
  awaiting_payment: "warning",
  ready_for_production: "accent",
  in_production: "accent",
  quality_check: "info",
  ready_for_collection: "success",
  completed: "success",
  on_hold: "warning",
  cancelled: "danger",
};

export const PAYMENT_STATUS_TONE: Record<string, ToneKey> = {
  unpaid: "danger",
  partial: "warning",
  paid: "success",
  refunded: "neutral",
};

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "momo", label: "Mobile Money" },
  { value: "bank", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
];

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
