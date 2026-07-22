"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TimelineEntry = {
  id: string;
  label: string;
  detail: string;
  at: string;
};

type WorkflowStore = {
  timeline: TimelineEntry[];
  addSimulation: (entry: TimelineEntry) => void;
  resetTimeline: () => void;
};

const initialTimeline: TimelineEntry[] = [
  {
    id: "t-3",
    label: "Containment review opened",
    detail: "Oracle deviation #OR-2481 assigned to Amara Chen",
    at: "09:42:18",
  },
  {
    id: "t-2",
    label: "Duplicate keeper action blocked",
    detail: "Nonce guard rejected replay from keeper-04",
    at: "09:38:51",
  },
  {
    id: "t-1",
    label: "Cluster 07 degraded",
    detail: "31 validators exceeded telemetry stale threshold",
    at: "09:31:06",
  },
];

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set) => ({
      timeline: initialTimeline,
      addSimulation: (entry) =>
        set((state) => ({ timeline: [entry, ...state.timeline].slice(0, 12) })),
      resetTimeline: () => set({ timeline: initialTimeline }),
    }),
    { name: "guardian-workflow" },
  ),
);
