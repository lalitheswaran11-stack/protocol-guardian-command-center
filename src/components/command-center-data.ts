import { createValidators, type ValidatorFilter } from "@/lib/protocol";

export const validators = createValidators();

export const trend = [
  { time: "03:00", value: 983 },
  { time: "06:00", value: 988 },
  { time: "09:00", value: 991 },
  { time: "12:00", value: 997 },
  { time: "15:00", value: 994 },
  { time: "18:00", value: 1002 },
  { time: "Now", value: 1006 },
];

export const withdrawalTrend = [
  { time: "Mon", queued: 9.2, processed: 7.1 },
  { time: "Tue", queued: 8.1, processed: 7.8 },
  { time: "Wed", queued: 12.4, processed: 8.3 },
  { time: "Thu", queued: 11.1, processed: 9.2 },
  { time: "Fri", queued: 14.8, processed: 9.5 },
  { time: "Sat", queued: 13.2, processed: 10.1 },
  { time: "Sun", queued: 16.1, processed: 10.4 },
];

export const metrics = [
  {
    label: "Total pooled",
    value: "1,006,482 ETH",
    change: "+0.42%",
    tone: "good",
    source: "StakingRouter",
    detail:
      "ETH controlled by the protocol across active, pending, and exited validators.",
  },
  {
    label: "Protocol shares",
    value: "873.2K",
    change: "+0.31%",
    tone: "good",
    source: "ShareToken",
    detail:
      "Accounting units representing proportional claims on pooled assets.",
  },
  {
    label: "Share conversion",
    value: "1.1526 ETH",
    change: "+0.08%",
    tone: "good",
    source: "Oracle report",
    detail:
      "Current ETH value of one protocol share after the last finalized report.",
  },
  {
    label: "Withdrawal liquidity",
    value: "8,240 ETH",
    change: "−18.4%",
    tone: "warn",
    source: "WithdrawalVault",
    detail:
      "Immediately available ETH that can satisfy queued withdrawal claims.",
  },
  {
    label: "Pending withdrawals",
    value: "12,483 ETH",
    change: "+9.7%",
    tone: "warn",
    source: "Queue contract",
    detail: "Requested withdrawals not yet claimable by users.",
  },
  {
    label: "Validator effectiveness",
    value: "98.72%",
    change: "−0.16%",
    tone: "warn",
    source: "Beacon telemetry",
    detail:
      "Attestation performance aggregated across the active validator fleet.",
  },
];

export const filterOptions: { key: ValidatorFilter; label: string }[] = [
  { key: "all", label: "All validators" },
  { key: "offline", label: "Offline" },
  { key: "effectiveness", label: "Low effectiveness" },
  { key: "fee", label: "Fee recipient" },
  { key: "peers", label: "Low peer count" },
  { key: "exiting", label: "Pending exit" },
  { key: "penalized", label: "Penalized" },
  { key: "stale", label: "Stale telemetry" },
];
