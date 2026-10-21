import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { unwrap } from "@/lib/queries";
import { dateTime } from "@/lib/format";

type Notice = { id: string; title: string; body: string | null; kind: string | null; link: string | null; is_read: boolean; created_at: string };

export function NotificationBell() {
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const q = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: () =>
      unwrap(supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30)) as Promise<Notice[]>,
    refetchInterval: 60_000,
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = (q.data ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-sm p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        title="Notifications"
      >
        <Bell className="size-4" />
        {unread ? (
          <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute bottom-11 left-0 z-50 w-80 rounded-md border border-border bg-surface text-foreground shadow-raised">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unread ? (
              <button className="text-xs text-accent hover:underline" onClick={() => markAll.mutate()}>
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {q.isLoading ? (
              <li className="px-3 py-4 text-sm text-muted-foreground">Loading…</li>
            ) : !q.data?.length ? (
              <li className="px-3 py-4 text-sm text-muted-foreground">
                No notifications yet. Low stock, pending payments and other alerts will appear here.
              </li>
            ) : (
              q.data.map((n) => (
                <li key={n.id} className={n.is_read ? "opacity-60" : ""}>
                  {n.link ? (
                    <Link to={n.link as never} className="block px-3 py-2.5 hover:bg-muted" onClick={() => setOpen(false)}>
                      <NoticeBody n={n} />
                    </Link>
                  ) : (
                    <div className="px-3 py-2.5"><NoticeBody n={n} /></div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function NoticeBody({ n }: { n: Notice }) {
  return (
    <>
      <p className="text-sm font-medium">{n.title}</p>
      {n.body ? <p className="text-xs text-muted-foreground">{n.body}</p> : null}
      <p className="mt-0.5 text-[11px] text-muted-foreground/70">{dateTime(n.created_at)}</p>
    </>
  );
}
