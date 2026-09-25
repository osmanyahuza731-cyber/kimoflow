import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KIMO GRAPHYX — Staff Portal" },
      { name: "description", content: "Sign in to the KIMO GRAPHYX business management system." },
      { property: "og:title", content: "KIMO GRAPHYX — Staff Portal" },
      { property: "og:description", content: "Sign in to the KIMO GRAPHYX business management system." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
