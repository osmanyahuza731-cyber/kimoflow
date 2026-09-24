export type AppRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "secretary"
  | "cashier"
  | "accountant"
  | "graphic_artist"
  | "production_operator"
  | "storekeeper";

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  manager: "Manager",
  secretary: "Secretary / Front Desk",
  cashier: "Cashier",
  accountant: "Accountant",
  graphic_artist: "Graphic Artist",
  production_operator: "Production Operator",
  storekeeper: "Storekeeper",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as AppRole[];

export type Permission =
  | "customers.view"
  | "customers.manage"
  | "jobs.view"
  | "jobs.manage"
  | "jobs.approve"
  | "payments.view"
  | "payments.record"
  | "payments.confirm"
  | "inventory.view"
  | "inventory.adjust"
  | "assets.view"
  | "assets.manage"
  | "ledger.view"
  | "ledger.manage"
  | "reports.view"
  | "config.manage"
  | "users.manage"
  | "audit.view";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  super_admin: [
    "customers.view",
    "customers.manage",
    "jobs.view",
    "jobs.manage",
    "jobs.approve",
    "payments.view",
    "payments.record",
    "payments.confirm",
    "inventory.view",
    "inventory.adjust",
    "assets.view",
    "assets.manage",
    "ledger.view",
    "ledger.manage",
    "reports.view",
    "config.manage",
    "users.manage",
    "audit.view",
  ],
  admin: [
    "customers.view",
    "customers.manage",
    "jobs.view",
    "jobs.manage",
    "jobs.approve",
    "payments.view",
    "payments.record",
    "payments.confirm",
    "inventory.view",
    "inventory.adjust",
    "assets.view",
    "assets.manage",
    "ledger.view",
    "ledger.manage",
    "reports.view",
    "config.manage",
    "users.manage",
    "audit.view",
  ],
  manager: [
    "customers.view",
    "customers.manage",
    "jobs.view",
    "jobs.manage",
    "jobs.approve",
    "payments.view",
    "inventory.view",
    "assets.view",
    "ledger.view",
    "reports.view",
    "audit.view",
  ],
  secretary: ["customers.view", "customers.manage", "jobs.view", "jobs.manage", "payments.view"],
  cashier: [
    "customers.view",
    "jobs.view",
    "payments.view",
    "payments.record",
    "payments.confirm",
    "reports.view",
  ],
  accountant: [
    "customers.view",
    "jobs.view",
    "payments.view",
    "payments.record",
    "ledger.view",
    "ledger.manage",
    "reports.view",
  ],
  graphic_artist: ["customers.view", "jobs.view", "jobs.manage"],
  production_operator: ["jobs.view", "jobs.manage", "inventory.view", "inventory.adjust"],
  storekeeper: ["inventory.view", "inventory.adjust", "assets.view", "jobs.view"],
};

export function permissionsFor(roles: AppRole[]): Set<Permission> {
  const set = new Set<Permission>();
  roles.forEach((r) => ROLE_PERMISSIONS[r]?.forEach((p) => set.add(p)));
  return set;
}
