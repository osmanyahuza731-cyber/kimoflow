import type { ReactNode } from "react";

import { useCurrentUser } from "@/hooks/use-session";
import type { Permission } from "@/lib/access";
import { EmptyState } from "@/components/ui-kit";

/** UI guard only — the database access rules are the real enforcement. */
export function RequirePermission({ perm, children }: { perm: Permission; children: ReactNode }) {
  const { user } = useCurrentUser();
  if (!user?.can(perm)) {
    return (
      <EmptyState
        title="You don't have access to this area"
        message="Ask an administrator to assign you a role that includes this module."
      />
    );
  }
  return <>{children}</>;
}
