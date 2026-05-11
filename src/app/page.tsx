import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Bahrawy Calendar — a calendar that gets out of your way",
  description:
    "Bahrawy Calendar is a local-first calendar with multi-provider sync, drag-to-reschedule, recurrence done right, and zero signup. Built by Bahrawy.",
  openGraph: {
    title: "Bahrawy Calendar — a calendar that gets out of your way",
    description:
      "Local-first calendar. Multi-provider sync. Drag, recurrence, contexts. No account, no servers, no nonsense.",
    url: "https://bahrawys-calender.vercel.app",
    siteName: "Bahrawy Calendar",
    type: "website",
  },
};

export default function Home() {
  return <Landing />;
}
