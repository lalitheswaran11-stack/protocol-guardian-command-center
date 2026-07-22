"use client";

import {
  AlertTriangle,
  Bell,
  Check,
  CircleDot,
  Command,
  Download,
  Gauge,
  KeyRound,
  Moon,
  Pause,
  Radio,
  RefreshCcw,
  Search,
  Shield,
  ShieldAlert,
  Sun,
  TerminalSquare,
  Users,
  Wallet,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import {
  filterValidators,
  formatCompact,
  formatEth,
  isGuardianConfirmationValid,
  mergeProtocolEvents,
  type ProtocolEvent,
  type Validator,
  type ValidatorFilter,
} from "@/lib/protocol";
import { useWorkflowStore } from "@/lib/workflow-store";
import {
  filterOptions,
  metrics,
  trend,
  validators,
  withdrawalTrend,
} from "./command-center-data";
import { MetricCard, StatusPill, ValidatorRow } from "./command-center-ui";

export function CommandCenter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { isConnected, address, chain } = useAccount();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [filter, setFilter] = useState<ValidatorFilter>(
    (params.get("filter") as ValidatorFilter) ?? "all",
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [streamState, setStreamState] = useState<
    "connecting" | "live" | "paused" | "error"
  >("connecting");
  const [events, setEvents] = useState<ProtocolEvent[]>([]);
  const [speed, setSpeed] = useState<0 | 1 | 4>(1);
  const [dark, setDark] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [guardianOpen, setGuardianOpen] = useState(false);
  const [walletNotice, setWalletNotice] = useState(false);
  const [detailRow, setDetailRow] = useState<Validator | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [simulated, setSimulated] = useState(false);
  const [demand, setDemand] = useState(135);
  const [liquidity, setLiquidity] = useState(72);
  const [activeSection, setActiveSection] = useState("Overview");
  const { timeline, addSimulation, resetTimeline } = useWorkflowStore();

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setGuardianOpen(false);
        setDetailRow(null);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  useEffect(() => {
    if (speed === 0) return;
    const source = new EventSource("/api/events");
    source.onopen = () => setStreamState("live");
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as ProtocolEvent;
        setEvents((current) => mergeProtocolEvents(current, event));
      } catch {
        setStreamState("error");
      }
    };
    source.onerror = () => setStreamState("error");
    return () => source.close();
  }, [speed]);

  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    if (query) next.set("q", query);
    else next.delete("q");
    if (filter !== "all") next.set("filter", filter);
    else next.delete("filter");
    const timer = window.setTimeout(
      () =>
        router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
          scroll: false,
        }),
      180,
    );
    return () => window.clearTimeout(timer);
  }, [query, filter, params, pathname, router]);

  const filtered = useMemo(
    () => filterValidators(validators, query, filter),
    [query, filter],
  );
  const visible = filtered.slice(page * 8, page * 8 + 8);
  const stressQueue = Math.round(12_483 * (demand / 100) * (100 / liquidity));
  const waitDays = Math.max(1.2, stressQueue / 4200).toFixed(1);

  function selectFilter(value: ValidatorFilter) {
    setFilter(value);
    setPage(0);
  }
  function toggleRow(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }
  function changeSpeed(nextSpeed: 0 | 1 | 4) {
    setSpeed(nextSpeed);
    setStreamState(nextSpeed === 0 ? "paused" : "connecting");
  }
  function exportCsv() {
    const header =
      "index,public_key,operator,cluster,state,effectiveness,peers,fee_recipient,balance,last_seen_minutes\n";
    const body = filtered
      .map((r) =>
        [
          r.index,
          r.publicKey,
          r.operator,
          r.cluster,
          r.state,
          r.effectiveness,
          r.peers,
          r.feeRecipientOk,
          r.balance,
          r.lastSeenMinutes,
        ].join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([header + body], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `validators-${filter}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function runSimulation() {
    if (!isGuardianConfirmationValid(confirmation)) return;
    setSimulated(true);
    addSimulation({
      id: `sim-${Date.now()}`,
      label: "Pause simulated — not broadcast",
      detail:
        "StakingRouter.pauseDeposits() · inferred state diff · 184,210 gas",
      at: new Date().toLocaleTimeString([], { hour12: false }),
    });
  }
  function resetSimulation() {
    setEvents([]);
    setDemand(100);
    setLiquidity(100);
    resetTimeline();
    setStreamState(speed === 0 ? "paused" : "connecting");
  }

  const nav = [
    ["Overview", Gauge],
    ["Validators", Users],
    ["Oracle", Radio],
    ["Withdrawals", Waves],
    ["Permissions", KeyRound],
    ["Incidents", ShieldAlert],
  ] as const;

  return (
    <div className={dark ? "dark" : "light"}>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="pointer-events-none fixed inset-0 opacity-[.025] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:32px_32px]" />

        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[228px] border-r border-[var(--line)] bg-[var(--sidebar)] lg:flex lg:flex-col">
          <div className="flex h-[68px] items-center gap-3 border-b border-[var(--line)] px-5">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#93e676]/30 bg-[#93e676]/10 text-[#aef590]">
              <Shield size={17} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.18em]">
                Protocol Guardian
              </p>
              <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[.24em] text-[var(--faint)]">
                Command Center
              </p>
            </div>
          </div>
          <nav aria-label="Primary" className="flex-1 space-y-1 px-3 py-5">
            <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[.18em] text-[var(--faint)]">
              Operations
            </p>
            {nav.map(([label, Icon]) => (
              <button
                key={label}
                onClick={() => {
                  setActiveSection(label);
                  document
                    .getElementById(label.toLowerCase())
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition ${activeSection === label ? "bg-[#93e676]/10 font-semibold text-[#b6f99c]" : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"}`}
              >
                <Icon size={15} />
                {label}
                {label === "Incidents" && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#ff6f6f]/15 px-1 text-[9px] font-bold text-[#ff9292]">
                    3
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="m-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--muted)]">
                Simulation
              </span>
              <StatusPill
                label={speed === 0 ? "Paused" : `${speed}×`}
                tone={speed === 0 ? "warn" : "ok"}
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1">
              <button
                aria-label="Pause simulation"
                onClick={() => changeSpeed(0)}
                className="sim-button"
              >
                <Pause size={12} />
              </button>
              <button
                aria-label="Normal simulation speed"
                onClick={() => changeSpeed(1)}
                className="sim-button"
              >
                1×
              </button>
              <button
                aria-label="Accelerate simulation"
                onClick={() => changeSpeed(4)}
                className="sim-button"
              >
                4×
              </button>
              <button
                aria-label="Reset simulation"
                onClick={resetSimulation}
                className="sim-button"
              >
                <RefreshCcw size={12} />
              </button>
            </div>
          </div>
        </aside>

        <div className="lg:pl-[228px]">
          <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[var(--line)] bg-[var(--header)] px-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <StatusPill label="Operational" />
                  <span className="hidden text-[10px] text-[var(--faint)] sm:inline">
                    Main protocol · Epoch 312,884
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  Read-only educational environment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-2.5 py-2 md:flex">
                <CircleDot
                  size={12}
                  className={
                    streamState === "live" ? "text-[#93e676]" : "text-[#ffb45d]"
                  }
                />
                <span className="text-[10px] capitalize text-[var(--muted)]">
                  Stream {streamState}
                </span>
                <span className="text-[var(--line-strong)]">|</span>
                <span className="font-mono text-[9px] text-[var(--faint)]">
                  SSE · MOCK
                </span>
              </div>
              <button
                onClick={() => setPaletteOpen(true)}
                className="hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-[10px] text-[var(--muted)] transition hover:border-[var(--line-strong)] sm:flex"
              >
                <Search size={13} /> Command{" "}
                <kbd className="rounded border border-[var(--line)] px-1 font-mono text-[8px]">
                  ⌘K
                </kbd>
              </button>
              <button
                aria-label="Toggle theme"
                onClick={() => setDark(!dark)}
                className="icon-button"
              >
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                aria-label="View incidents"
                className="icon-button relative"
                onClick={() => {
                  setActiveSection("Incidents");
                  document
                    .getElementById("incidents")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Bell size={15} />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ff6f6f]" />
              </button>
              <button
                onClick={() => setWalletNotice(true)}
                className="flex items-center gap-2 rounded-lg bg-[#e8ece8] px-3 py-2 text-[10px] font-bold text-[#101310] transition hover:bg-white"
              >
                <Wallet size={13} />
                {isConnected
                  ? `${address?.slice(0, 5)}…${address?.slice(-3)}`
                  : "Connect wallet"}
              </button>
            </div>
          </header>

          <main className="relative mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
            <section id="overview" aria-labelledby="overview-heading">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow">Protocol operations</p>
                  <h1
                    id="overview-heading"
                    className="mt-1 text-2xl font-semibold tracking-[-.04em] sm:text-3xl"
                  >
                    System overview
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--faint)]">
                  <span className="h-2 w-2 rounded-full bg-[#93e676] shadow-[0_0_12px_#93e676]" />{" "}
                  Oracle quorum 7/9{" "}
                  <span className="mx-1 text-[var(--line-strong)]">·</span> Last
                  report 4m ago
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {metrics.map((metric, index) => (
                  <MetricCard key={metric.label} item={metric} index={index} />
                ))}
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
              <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
                  <div>
                    <p className="eyebrow">Asset & share rate</p>
                    <h2 className="mt-1 text-sm font-semibold">
                      Protocol value trajectory
                    </h2>
                  </div>
                  <div className="flex gap-4 text-[10px] text-[var(--muted)]">
                    <span>
                      <i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#93e676]" />
                      Pooled ETH
                    </span>
                    <span>
                      <i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#5f8cff]" />
                      Share rate
                    </span>
                  </div>
                </div>
                <div className="h-[230px] p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trend}
                      margin={{ top: 15, left: 0, right: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="pooled" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0"
                            stopColor="#93e676"
                            stopOpacity={0.28}
                          />
                          <stop
                            offset="1"
                            stopColor="#93e676"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        stroke="var(--faint)"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis hide domain={[970, 1010]} />
                      <ChartTooltip
                        contentStyle={{
                          background: "#151a17",
                          border: "1px solid #2c342e",
                          borderRadius: 10,
                          fontSize: 10,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#93e676"
                        strokeWidth={2}
                        fill="url(#pooled)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article
                id="oracle"
                className="overflow-hidden rounded-2xl border border-[#ffb45d]/20 bg-[var(--panel)]"
              >
                <div className="flex items-center justify-between border-b border-[var(--line)] p-4">
                  <div>
                    <p className="eyebrow">Oracle inspector</p>
                    <h2 className="mt-1 text-sm font-semibold">
                      Report OR-2481
                    </h2>
                  </div>
                  <StatusPill label="Review required" tone="warn" />
                </div>
                <div className="p-4">
                  <div className="mb-4 rounded-xl border border-[#ffb45d]/20 bg-[#ffb45d]/[.06] p-3">
                    <div className="flex gap-2">
                      <AlertTriangle
                        size={15}
                        className="mt-0.5 shrink-0 text-[#ffb45d]"
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#ffc476]">
                          Circuit-breaker threshold approached
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted)]">
                          Proposed pooled ETH delta is 2.8σ above the 30-day
                          baseline. Quorum is valid; economic impact requires
                          review.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="datum">
                      <span>Previous</span>
                      <strong>1.1517</strong>
                    </div>
                    <div className="datum">
                      <span>Proposed</span>
                      <strong className="text-[#ffb45d]">1.1526</strong>
                    </div>
                    <div className="datum">
                      <span>Delta</span>
                      <strong>+0.078%</strong>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-2 text-[10px]">
                    <div className="detail-line">
                      <dt>Validity window</dt>
                      <dd>11m 42s remaining</dd>
                    </div>
                    <div className="detail-line">
                      <dt>Signer quorum</dt>
                      <dd className="text-[#93e676]">7 of 9 · valid</dd>
                    </div>
                    <div className="detail-line">
                      <dt>Affected validators</dt>
                      <dd>4,621</dd>
                    </div>
                    <div className="detail-line">
                      <dt>Duplicate / stale</dt>
                      <dd className="text-[#93e676]">None detected</dd>
                    </div>
                  </dl>
                </div>
              </article>
            </section>

            <section
              id="validators"
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)]"
              aria-labelledby="validators-heading"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
                <div>
                  <p className="eyebrow">Validator fleet</p>
                  <h2
                    id="validators-heading"
                    className="mt-1 text-sm font-semibold"
                  >
                    5,000 deterministic validator records
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={exportCsv} className="secondary-button">
                    <Download size={13} /> Export CSV
                  </button>
                  {selected.size > 0 && (
                    <button
                      onClick={() => setGuardianOpen(true)}
                      className="danger-button"
                    >
                      <ShieldAlert size={13} /> Review {selected.size} selected
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3 border-b border-[var(--line)] p-3 lg:flex-row lg:items-center">
                <label className="flex min-w-52 flex-1 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2">
                  <Search size={13} className="text-[var(--faint)]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search index, key, operator or cluster"
                    aria-label="Search validators"
                    className="w-full bg-transparent text-xs outline-none placeholder:text-[var(--faint)]"
                  />
                </label>
                <div className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
                  {filterOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => selectFilter(option.key)}
                      className={`whitespace-nowrap rounded-lg border px-2.5 py-2 text-[10px] transition ${filter === option.key ? "border-[#93e676]/30 bg-[#93e676]/10 text-[#b6f99c]" : "border-[var(--line)] text-[var(--muted)] hover:bg-[var(--hover)]"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[var(--panel-2)] text-[9px] uppercase tracking-[.11em] text-[var(--faint)]">
                      <th className="px-4 py-2.5">
                        <input
                          aria-label="Select visible validators"
                          type="checkbox"
                          onChange={(event) =>
                            setSelected(
                              event.target.checked
                                ? new Set(visible.map((row) => row.index))
                                : new Set(),
                            )
                          }
                          className="accent-[#93e676]"
                        />
                      </th>
                      <th className="px-2">Index</th>
                      <th className="px-2">Public key</th>
                      <th className="px-2">Operator</th>
                      <th className="px-2">State</th>
                      <th className="px-2">Effectiveness</th>
                      <th className="px-2">Peers / client</th>
                      <th className="px-2">Fee recipient</th>
                      <th className="px-2">Balance</th>
                      <th className="px-2">Last seen</th>
                      <th className="px-4 text-right">Alerts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <ValidatorRow
                        key={row.index}
                        row={row}
                        selected={selected.has(row.index)}
                        onSelect={() => toggleRow(row.index)}
                        onInspect={() => setDetailRow(row)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--line)] p-3 text-[10px] text-[var(--muted)]">
                <span>
                  Showing {filtered.length ? page * 8 + 1 : 0}–
                  {Math.min(page * 8 + 8, filtered.length)} of{" "}
                  {formatCompact(filtered.length)}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(Math.max(0, page - 1))}
                    className="page-button"
                  >
                    Previous
                  </button>
                  <button
                    disabled={(page + 1) * 8 >= filtered.length}
                    onClick={() => setPage(page + 1)}
                    className="page-button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <article
                id="withdrawals"
                className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="eyebrow">Withdrawal stress lab</p>
                    <h2 className="mt-1 text-sm font-semibold">
                      Liquidity scenario
                    </h2>
                  </div>
                  <StatusPill
                    label={stressQueue > 22_000 ? "High stress" : "Watch"}
                    tone={stressQueue > 22_000 ? "danger" : "warn"}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="datum">
                    <span>Projected queue</span>
                    <strong>{formatEth(stressQueue)}</strong>
                  </div>
                  <div className="datum">
                    <span>Mean wait</span>
                    <strong>{waitDays} days</strong>
                  </div>
                  <div className="datum">
                    <span>Exits needed</span>
                    <strong>{Math.ceil(stressQueue / 32)}</strong>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <label className="range-label">
                    <span>
                      Withdrawal demand <b>{demand}%</b>
                    </span>
                    <input
                      type="range"
                      min="50"
                      max="250"
                      value={demand}
                      onChange={(e) => setDemand(Number(e.target.value))}
                    />
                  </label>
                  <label className="range-label">
                    <span>
                      Available liquidity <b>{liquidity}%</b>
                    </span>
                    <input
                      type="range"
                      min="25"
                      max="150"
                      value={liquidity}
                      onChange={(e) => setLiquidity(Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="mt-5 h-28">
                  <ResponsiveContainer>
                    <AreaChart data={withdrawalTrend}>
                      <Area
                        type="monotone"
                        dataKey="queued"
                        stroke="#ffb45d"
                        fill="#ffb45d20"
                      />
                      <Area
                        type="monotone"
                        dataKey="processed"
                        stroke="#93e676"
                        fill="#93e67610"
                      />
                      <XAxis
                        dataKey="time"
                        fontSize={8}
                        stroke="var(--faint)"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis hide />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[9px] leading-relaxed text-[var(--faint)]">
                  All projections are deterministic model outputs. No
                  transaction or oracle update is submitted.
                </p>
              </article>

              <article
                id="permissions"
                className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="eyebrow">Who can do what?</p>
                    <h2 className="mt-1 text-sm font-semibold">
                      Authority topology
                    </h2>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="permission-node">
                    <KeyRound size={15} />
                    <span>
                      <b>Guardian 3-of-5</b>
                      <small>0x71f3…9b21</small>
                    </span>
                  </div>
                  <div className="h-px w-6 bg-[#ffb45d]/50" />
                  <div className="permission-node border-[#ffb45d]/20">
                    <ShieldAlert size={15} className="text-[#ffb45d]" />
                    <span>
                      <b>Pause Controller</b>
                      <small>immediate authority</small>
                    </span>
                  </div>
                </div>
                <div className="ml-[calc(50%-1px)] h-5 w-px bg-[var(--line-strong)]" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="permission-node">
                    <TerminalSquare size={15} />
                    <span>
                      <b>Staking Router</b>
                      <small>pause deposits</small>
                    </span>
                  </div>
                  <div className="permission-node">
                    <Radio size={15} />
                    <span>
                      <b>Oracle Hub</b>
                      <small>reject report</small>
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-[#ff6f6f]/20 bg-[#ff6f6f]/[.05] p-3">
                  <p className="flex items-center gap-2 text-[10px] font-semibold text-[#ff9292]">
                    <AlertTriangle size={13} /> Dangerous role combination
                    detected
                  </p>
                  <p className="mt-1 pl-5 text-[9px] leading-relaxed text-[var(--muted)]">
                    Guardian-02 can both pause deposits and replace the oracle
                    implementation after the 48h timelock.
                  </p>
                </div>
              </article>
            </section>

            <section
              id="incidents"
              className="grid gap-5 xl:grid-cols-[1fr_.9fr]"
            >
              <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow">Incident center</p>
                    <h2 className="mt-1 text-sm font-semibold">
                      Active response queue
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--faint)]">
                    3 open · 1 contained
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    [
                      "SEV-2",
                      "Abnormal oracle delta",
                      "OracleHub · 14m",
                      "Investigating",
                    ],
                    [
                      "SEV-2",
                      "Validator cluster outage",
                      "cluster-07 · 21m",
                      "Containing",
                    ],
                    [
                      "SEV-3",
                      "Withdrawal liquidity stress",
                      "WithdrawalVault · 38m",
                      "Monitoring",
                    ],
                  ].map((incident, i) => (
                    <button
                      key={incident[1]}
                      className="flex w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] p-3 text-left transition hover:border-[var(--line-strong)]"
                    >
                      <span
                        className={`rounded-md px-2 py-1 font-mono text-[9px] font-bold ${i < 2 ? "bg-[#ff6f6f]/10 text-[#ff9292]" : "bg-[#ffb45d]/10 text-[#ffc476]"}`}
                      >
                        {incident[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-xs">{incident[1]}</b>
                        <small className="mt-1 block font-mono text-[9px] text-[var(--faint)]">
                          {incident[2]}
                        </small>
                      </span>
                      <StatusPill
                        label={incident[3]}
                        tone={i === 1 ? "warn" : "neutral"}
                      />
                    </button>
                  ))}
                </div>
              </article>
              <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow">Evidence timeline</p>
                    <h2 className="mt-1 text-sm font-semibold">
                      Latest operational events
                    </h2>
                  </div>
                  <Radio
                    size={14}
                    className={
                      streamState === "live"
                        ? "animate-pulse text-[#93e676]"
                        : "text-[#ffb45d]"
                    }
                  />
                </div>
                <div className="mt-4 space-y-0">
                  {timeline.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="relative flex gap-3 pb-4">
                      <div className="relative z-10 mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#93e676] ring-4 ring-[#93e676]/10" />
                      {index < timeline.slice(0, 5).length - 1 && (
                        <div className="absolute left-[3px] top-4 h-full w-px bg-[var(--line)]" />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-medium">{item.label}</p>
                          <time className="font-mono text-[8px] text-[var(--faint)]">
                            {item.at}
                          </time>
                        </div>
                        <p className="mt-1 text-[9px] leading-relaxed text-[var(--muted)]">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <footer className="flex flex-col gap-2 border-t border-[var(--line)] py-4 text-[9px] text-[var(--faint)] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Educational demonstration · Mock protocol data · Not audited or
                production-ready
              </p>
              <p className="font-mono">
                Data source: deterministic seed + simulated SSE ·{" "}
                {events[0] ? `seq ${events[0].sequence}` : "awaiting event"}
              </p>
            </footer>
          </main>
        </div>

        {guardianOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guardian-title"
            className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm"
          >
            <button
              aria-label="Close guardian workflow"
              className="absolute inset-0"
              onClick={() => setGuardianOpen(false)}
            />
            <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-[var(--line)] bg-[var(--sidebar)] p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="eyebrow">Guardian action · simulation only</p>
                  <h2
                    id="guardian-title"
                    className="mt-2 text-xl font-semibold"
                  >
                    Pause protocol deposits
                  </h2>
                </div>
                <button
                  aria-label="Close"
                  onClick={() => setGuardianOpen(false)}
                  className="icon-button"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-1 text-center text-[9px] uppercase tracking-[.1em]">
                <span className="step active">1 · Build</span>
                <span className="step active">2 · Simulate</span>
                <span className={`step ${simulated ? "active" : ""}`}>
                  3 · Review
                </span>
              </div>
              <div className="mt-6 rounded-xl border border-[#ffb45d]/25 bg-[#ffb45d]/[.06] p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-[#ffc476]">
                  <ShieldAlert size={15} /> No transaction will be broadcast
                </p>
                <p className="mt-2 text-[10px] leading-relaxed text-[var(--muted)]">
                  The calldata and state changes below are deterministic
                  simulation outputs. A connected wallet is not required.
                </p>
              </div>
              <dl className="mt-5 space-y-1 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 text-[10px]">
                {[
                  ["Contract", "StakingRouter · 0x8a2d…71cc"],
                  ["Function", "pauseDeposits()"],
                  [
                    "Caller",
                    isConnected
                      ? `${address?.slice(0, 8)}… · ${chain?.name}`
                      : "0xGuardianDemo…0001 (mocked)",
                  ],
                  ["Required role", "PAUSE_GUARDIAN_ROLE"],
                  ["Native value", "0 ETH"],
                  ["Estimated gas", "184,210 · inferred"],
                  ["Expected event", "DepositsPaused(caller, timestamp)"],
                  ["State change", "depositsPaused: false → true"],
                  [
                    "Blocked operations",
                    "New user deposits; validator provisioning",
                  ],
                  ["Allowance changes", "None"],
                ].map(([term, value]) => (
                  <div key={term} className="detail-line py-2">
                    <dt>{term}</dt>
                    <dd className="max-w-[65%] text-right font-mono">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 rounded-xl border border-[#ff6f6f]/20 bg-[#ff6f6f]/[.05] p-4">
                <p className="text-xs font-semibold text-[#ff9292]">
                  Operational consequences
                </p>
                <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-[var(--muted)]">
                  <li>
                    • All new deposits revert until a guardian unpauses the
                    router.
                  </li>
                  <li>• Existing withdrawals and validator duties continue.</li>
                  <li>
                    • State diff is inferred; no complete RPC trace is available
                    in demo mode.
                  </li>
                </ul>
              </div>
              <label className="mt-6 block text-[10px] font-semibold text-[var(--muted)]">
                Type{" "}
                <span className="font-mono text-[var(--text)]">
                  SIMULATE PAUSE
                </span>{" "}
                to continue
                <input
                  value={confirmation}
                  onChange={(event) => {
                    setConfirmation(event.target.value);
                    setSimulated(false);
                  }}
                  className="mt-2 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-3 font-mono text-xs outline-none focus:border-[#ffb45d]/50"
                  placeholder="SIMULATE PAUSE"
                />
              </label>
              <button
                disabled={!isGuardianConfirmationValid(confirmation)}
                onClick={runSimulation}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#ffb45d] px-4 py-3 text-xs font-bold text-[#21150a] transition hover:bg-[#ffc476] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Zap size={14} /> Run simulation — do not broadcast
              </button>
              {simulated && (
                <div
                  role="status"
                  className="mt-4 flex gap-3 rounded-xl border border-[#93e676]/20 bg-[#93e676]/[.06] p-4"
                >
                  <Check size={16} className="text-[#93e676]" />
                  <div>
                    <p className="text-xs font-semibold text-[#aef590]">
                      Simulation completed
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      No revert detected. The inferred action was added to the
                      incident timeline.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {detailRow && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Validator details"
            className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
          >
            <button
              aria-label="Close validator details"
              className="absolute inset-0"
              onClick={() => setDetailRow(null)}
            />
            <div className="relative w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--sidebar)] p-5 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="eyebrow">Validator profile</p>
                  <h2 className="mt-2 font-mono text-lg">#{detailRow.index}</h2>
                </div>
                <button
                  aria-label="Close"
                  onClick={() => setDetailRow(null)}
                  className="icon-button"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {[
                  ["Operator", detailRow.operator],
                  ["Cluster", detailRow.cluster],
                  ["Effectiveness", `${detailRow.effectiveness}%`],
                  ["Peer count", String(detailRow.peers)],
                  ["Balance", `${detailRow.balance} ETH`],
                  ["Last seen", `${detailRow.lastSeenMinutes}m ago`],
                ].map(([label, value]) => (
                  <div key={label} className="datum">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setSelected(new Set([detailRow.index]));
                  setDetailRow(null);
                  setGuardianOpen(true);
                }}
                className="danger-button mt-4 w-full justify-center"
              >
                <ShieldAlert size={13} /> Open review workflow
              </button>
            </div>
          </div>
        )}

        {paletteOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="fixed inset-0 z-[60] flex justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          >
            <button
              aria-label="Close command palette"
              className="absolute inset-0"
              onClick={() => setPaletteOpen(false)}
            />
            <div className="relative h-fit w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[var(--sidebar)] shadow-2xl">
              <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
                <Command size={15} className="text-[#93e676]" />
                <p className="flex-1 text-xs text-[var(--muted)]">
                  Quick actions
                </p>
                <kbd className="font-mono text-[9px] text-[var(--faint)]">
                  ESC
                </kbd>
              </div>
              <div className="p-2">
                {[
                  ["Inspect abnormal oracle report", Radio],
                  ["Filter offline validators", Users],
                  ["Open withdrawal stress lab", Waves],
                  ["Simulate emergency pause", ShieldAlert],
                ].map(([label, Icon], index) => (
                  <button
                    key={label as string}
                    onClick={() => {
                      setPaletteOpen(false);
                      if (index === 1) selectFilter("offline");
                      if (index === 3) setGuardianOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
                  >
                    {typeof Icon !== "string" && <Icon size={14} />}
                    {label as string}
                    <span className="ml-auto font-mono text-[8px] text-[var(--faint)]">
                      ↵
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {walletNotice && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Wallet connection information"
            className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
          >
            <button
              aria-label="Close"
              className="absolute inset-0"
              onClick={() => setWalletNotice(false)}
            />
            <div className="relative max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--sidebar)] p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#93e676]/10 text-[#93e676]">
                  <Wallet size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold">Read-only demo mode</p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                    Wallet connectors are intentionally disabled.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[10px] leading-relaxed text-[var(--muted)]">
                The application includes wagmi and viem provider foundations,
                but this read-only build will never request keys, sign, or
                broadcast a transaction. A testnet-only connector can be added
                for a controlled demonstration.
              </p>
              <button
                onClick={() => setWalletNotice(false)}
                className="secondary-button mt-4 w-full justify-center"
              >
                Continue read-only
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
