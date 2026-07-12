import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { DashboardModel, KpiCardModel } from "../lib/metrics";
import { formatCompactNumber, formatNumber, formatPercent, formatPlainPercent } from "../lib/format";

function renderValue(card: KpiCardModel) {
  if (card.valueType === "percent") return formatPlainPercent(card.value);
  return formatCompactNumber(card.value);
}

function Delta({ card }: { card: KpiCardModel }) {
  if (card.delta === undefined || card.percent === undefined) {
    return <span className="kpi-delta neutral"><Minus size={14} /> 当前周期</span>;
  }
  const positive = card.delta > 0;
  const neutral = card.delta === 0;
  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;
  const className = neutral ? "neutral" : positive ? "positive" : "negative";
  return (
    <span className={`kpi-delta ${className}`}>
      <Icon size={14} />
      {formatPercent(card.percent)} · {positive ? "+" : ""}
      {formatNumber(card.delta)}
    </span>
  );
}

export function KpiOverview({ model }: { model: DashboardModel }) {
  return (
    <section className="kpi-grid" aria-label="KPI overview">
      {model.kpis.map((card) => (
        <article className="kpi-card" key={card.id}>
          <span>{card.label}</span>
          <strong>{renderValue(card)}</strong>
          <Delta card={card} />
        </article>
      ))}
    </section>
  );
}
