import { ArrowDownRight, ArrowUpRight, Clock3 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { Validator } from "@/lib/protocol";
import { metrics, trend } from "./command-center-data";

export function StatusPill({
  label,
  tone = "ok",
}: {
  label: string;
  tone?: "ok" | "warn" | "danger" | "neutral";
}) {
  const colors = {
    ok: "border-[#93e676]/25 bg-[#93e676]/10 text-[#aef590]",
    warn: "border-[#ffb45d]/25 bg-[#ffb45d]/10 text-[#ffc476]",
    danger: "border-[#ff6f6f]/25 bg-[#ff6f6f]/10 text-[#ff9292]",
    neutral: "border-white/10 bg-white/[.04] text-[var(--muted)]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.12em] ${colors[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function MetricCard({
  item,
  index,
}: {
  item: (typeof metrics)[number];
  index: number;
}) {
  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 transition hover:border-[var(--line-strong)]"
      title={item.detail}
    >
      <div className="mb-5 flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[var(--muted)]">{item.label}</p>
        <span className="rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-1.5 py-1 font-mono text-[9px] text-[var(--faint)]">
          {item.source}
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xl font-semibold tracking-[-.04em] text-[var(--text)]">
            {item.value}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--faint)]">
            <Clock3 size={10} /> updated 8s ago
          </p>
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-semibold ${item.tone === "good" ? "text-[#93e676]" : "text-[#ffb45d]"}`}
        >
          {item.change.startsWith("+") ? (
            <ArrowUpRight size={13} />
          ) : (
            <ArrowDownRight size={13} />
          )}
          {item.change}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#93e676]/30 to-transparent opacity-0 transition group-hover:opacity-100" />
      {index === 5 && (
        <div className="absolute right-3 top-12 h-8 w-16 opacity-30">
          <ResponsiveContainer>
            <AreaChart data={trend}>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ffb45d"
                fill="#ffb45d22"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

export function ValidatorRow({
  row,
  selected,
  onSelect,
  onInspect,
}: {
  row: Validator;
  selected: boolean;
  onSelect: () => void;
  onInspect: () => void;
}) {
  const stateTone =
    row.state === "active"
      ? "ok"
      : row.state === "offline" || row.state === "penalized"
        ? "danger"
        : "warn";

  return (
    <tr className="border-b border-[var(--line)] text-xs transition hover:bg-[var(--hover)]">
      <td className="px-4 py-3">
        <input
          aria-label={`Select validator ${row.index}`}
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="accent-[#93e676]"
        />
      </td>
      <td className="px-2 py-3">
        <button
          onClick={onInspect}
          className="font-mono font-medium text-[var(--text)] hover:text-[#aef590]"
        >
          {row.index}
        </button>
      </td>
      <td className="px-2 py-3 font-mono text-[10px] text-[var(--muted)]">
        {row.publicKey}
      </td>
      <td className="px-2 py-3 text-[var(--text)]">
        {row.operator}
        <span className="block font-mono text-[9px] text-[var(--faint)]">
          {row.cluster}
        </span>
      </td>
      <td className="px-2 py-3">
        <StatusPill label={row.state} tone={stateTone} />
      </td>
      <td className="px-2 py-3">
        <span
          className={
            row.effectiveness < 95 ? "text-[#ffb45d]" : "text-[var(--text)]"
          }
        >
          {row.effectiveness.toFixed(1)}%
        </span>
        <span className="block text-[9px] text-[var(--faint)]">
          {row.missed} missed
        </span>
      </td>
      <td className="px-2 py-3 text-[var(--text)]">
        {row.peers}
        <span className="block text-[9px] text-[var(--faint)]">
          {row.client}
        </span>
      </td>
      <td className="px-2 py-3">
        {row.feeRecipientOk ? (
          <span className="text-[#93e676]">Verified</span>
        ) : (
          <span className="text-[#ff6f6f]">Mismatch</span>
        )}
      </td>
      <td className="px-2 py-3 font-mono text-[var(--text)]">{row.balance}</td>
      <td className="px-2 py-3 text-[var(--muted)]">
        {row.lastSeenMinutes < 1 ? "now" : `${row.lastSeenMinutes}m`}
      </td>
      <td className="px-4 py-3 text-right">
        {row.alerts > 0 ? (
          <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-[#ff6f6f]/15 px-1 text-[10px] font-bold text-[#ff9292]">
            {row.alerts}
          </span>
        ) : (
          <span className="text-[var(--faint)]">—</span>
        )}
      </td>
    </tr>
  );
}
