export type ValidatorState =
  "active" | "offline" | "exiting" | "pending" | "penalized";

export type Validator = {
  index: number;
  publicKey: string;
  operator: string;
  cluster: string;
  state: ValidatorState;
  effectiveness: number;
  missed: number;
  peers: number;
  client: string;
  feeRecipientOk: boolean;
  balance: number;
  lastSeenMinutes: number;
  alerts: number;
};

const operators = [
  "Northstar",
  "Helix",
  "Atlas",
  "Kestrel",
  "Axiom",
  "Meridian",
];
const clients = ["Lighthouse", "Teku", "Nimbus", "Prysm", "Lodestar"];

export function seededValue(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function createValidators(count = 5000): Validator[] {
  return Array.from({ length: count }, (_, i) => {
    const risk = seededValue(i + 41);
    const state: ValidatorState =
      risk < 0.025
        ? "offline"
        : risk < 0.045
          ? "exiting"
          : risk < 0.055
            ? "penalized"
            : risk < 0.075
              ? "pending"
              : "active";
    const effectiveness =
      state === "offline"
        ? 0
        : Math.max(
            72,
            99.8 - seededValue(i + 5) * 8 - (state === "penalized" ? 14 : 0),
          );
    const lastSeenMinutes =
      state === "offline"
        ? 18 + Math.floor(seededValue(i + 9) * 70)
        : Math.floor(seededValue(i + 7) * 6);
    const peers =
      state === "offline" ? 0 : Math.floor(22 + seededValue(i + 3) * 88);
    const feeRecipientOk = seededValue(i + 12) > 0.018;
    return {
      index: 721300 + i,
      publicKey: `0x${(i + 100000).toString(16).padStart(12, "0")}…${(i * 991).toString(16).slice(-6).padStart(6, "0")}`,
      operator: operators[i % operators.length],
      cluster: `cluster-${String((i % 18) + 1).padStart(2, "0")}`,
      state,
      effectiveness: Number(effectiveness.toFixed(1)),
      missed:
        state === "offline"
          ? 30 + Math.floor(risk * 100)
          : Math.floor(seededValue(i + 8) * 5),
      peers,
      client: clients[i % clients.length],
      feeRecipientOk,
      balance: Number((31.7 + seededValue(i + 11) * 1.4).toFixed(3)),
      lastSeenMinutes,
      alerts:
        Number(state !== "active") +
        Number(!feeRecipientOk) +
        Number(peers < 25),
    };
  });
}

export type ValidatorFilter =
  | "all"
  | "offline"
  | "effectiveness"
  | "fee"
  | "peers"
  | "exiting"
  | "penalized"
  | "stale";

export function filterValidators(
  rows: Validator[],
  query: string,
  filter: ValidatorFilter,
) {
  const normalized = query.trim().toLowerCase();
  return rows.filter((row) => {
    const matchesQuery =
      !normalized ||
      `${row.index} ${row.publicKey} ${row.operator} ${row.cluster}`
        .toLowerCase()
        .includes(normalized);
    const matchesFilter =
      filter === "all" ||
      (filter === "offline" && row.state === "offline") ||
      (filter === "effectiveness" && row.effectiveness < 95) ||
      (filter === "fee" && !row.feeRecipientOk) ||
      (filter === "peers" && row.peers < 25) ||
      (filter === "exiting" && row.state === "exiting") ||
      (filter === "penalized" && row.state === "penalized") ||
      (filter === "stale" && row.lastSeenMinutes > 10);
    return matchesQuery && matchesFilter;
  });
}

export function formatEth(value: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: value < 100 ? 2 : 0 }).format(value)} ETH`;
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function isGuardianConfirmationValid(value: string) {
  return value.trim() === "SIMULATE PAUSE";
}

export type ProtocolEvent = {
  id: string;
  sequence: number;
  type: string;
  at: string;
};

export function mergeProtocolEvents(
  current: ProtocolEvent[],
  incoming: ProtocolEvent,
) {
  if (current.some((event) => event.id === incoming.id)) return current;
  return [...current, incoming]
    .sort((a, b) => b.sequence - a.sequence)
    .slice(0, 20);
}
