import type { ChartConfig } from "@/components/ui/chart";

const people = [
  { name: "Alex Morgan", initials: "AM", avatar: "" },
  { name: "Sarah Chen", initials: "SC", avatar: "" },
  { name: "James Wilson", initials: "JW", avatar: "" },
  { name: "Maya Patel", initials: "MP", avatar: "" },
];

export const app1User = people[0];
export const app1ChartConfig = {
  opened: { label: "Opened", color: "#94a3b8" },
  completed: { label: "Completed", color: "#2563eb" },
} satisfies ChartConfig;
export const app1Chart = [
  { week: "Aug 18", opened: 42, completed: 30 },
  { week: "Aug 25", opened: 58, completed: 44 },
  { week: "Sep 01", opened: 49, completed: 41 },
  { week: "Sep 08", opened: 72, completed: 56 },
  { week: "Sep 15", opened: 64, completed: 60 },
  { week: "Sep 22", opened: 81, completed: 68 },
  { week: "Sep 29", opened: 75, completed: 72 },
  { week: "Oct 06", opened: 94, completed: 86 },
];
export const app1Projects: {
  id: string; name: string; status: "In progress" | "In review" | "Planning";
  description: string; progress: number; team: typeof people; dueDate: string;
}[] = [
  { id: "website", name: "Website redesign", status: "In progress", description: "A fresh experience for our next chapter.", progress: 68, team: people.slice(0, 3), dueDate: "Oct 24" },
  { id: "mobile", name: "Mobile experience", status: "In review", description: "Making every interaction feel effortless.", progress: 92, team: people.slice(1), dueDate: "Oct 18" },
  { id: "system", name: "Design system", status: "Planning", description: "One shared language across the product.", progress: 24, team: [people[0], people[3]], dueDate: "Nov 08" },
];
export const app1Activity = [
  { id: "1", person: people[1], action: "completed the homepage exploration", time: "12 minutes ago" },
  { id: "2", person: people[2], action: "added 3 tasks to Mobile experience", time: "38 minutes ago" },
  { id: "3", person: people[3], action: "shared a new design system proposal", time: "1 hour ago" },
  { id: "4", person: people[0], action: "updated the project milestones", time: "2 hours ago" },
];
