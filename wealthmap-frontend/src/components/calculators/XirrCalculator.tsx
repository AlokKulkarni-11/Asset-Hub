import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

type XirrMode = 'SIMPLE' | 'ADVANCED';
type InvestmentFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

interface CashFlowRow {
  id: number;
  date: string;
  amount: number;
}

const formatINR = (val: number, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatMonthYear(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

function solveXirr(flows: { timeYears: number; amount: number }[]): number | null {
  const hasPos = flows.some((f) => f.amount > 0);
  const hasNeg = flows.some((f) => f.amount < 0);
  if (!hasPos || !hasNeg || flows.length < 2) return null;

  const npv = (rate: number) =>
    flows.reduce((sum, f) => sum + f.amount / Math.pow(1 + rate, f.timeYears), 0);

  const dNpv = (rate: number) =>
    flows.reduce(
      (sum, f) => sum - (f.timeYears * f.amount) / Math.pow(1 + rate, f.timeYears + 1),
      0
    );

  // Newton-Raphson first
  let r = 0.12;
  for (let i = 0; i < 60; i++) {
    const val = npv(r);
    if (Math.abs(val) < 1e-6) return r;
    const deriv = dNpv(r);
    if (Math.abs(deriv) < 1e-10) break;
    const next = r - val / deriv;
    if (next <= -0.99 || !isFinite(next)) break;
    r = next;
  }

  // Bisection fallback
  let low = -0.95;
  let high = 10.0;
  let fLow = npv(low);
  const fHigh = npv(high);
  if (fLow * fHigh > 0) return isFinite(r) ? r : null;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-6) return mid;
    if (fLow * fMid < 0) {
      high = mid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return (low + high) / 2;
}

export default function XirrCalculator() {
  const [mode, setMode] = useState<XirrMode>('SIMPLE');

  // Simple Mode
  const [frequency, setFrequency] = useState<InvestmentFrequency>('MONTHLY');
  const [startDate, setStartDate] = useState<string>('2024-11-12');
  const [maturityDate, setMaturityDate] = useState<string>('2026-11-12');
  const [recurringAmount, setRecurringAmount] = useState<number>(10000);
  const [maturityAmount, setMaturityAmount] = useState<number>(290000);

  // Advanced Mode
  const [advancedRows, setAdvancedRows] = useState<CashFlowRow[]>([
    { id: 1, date: '2024-11-12', amount: -50000 },
    { id: 2, date: '2025-05-12', amount: -25000 },
    { id: 3, date: '2025-11-12', amount: -25000 },
    { id: 4, date: '2026-11-12', amount: 125000 },
  ]);

  const [showTimelineTable, setShowTimelineTable] = useState<boolean>(false);

  const addAdvancedRow = () => {
    setAdvancedRows((prev) => [
      ...prev,
      { id: Date.now(), date: maturityDate || '2026-11-12', amount: -10000 },
    ]);
  };

  const updateAdvancedRow = (id: number, field: 'date' | 'amount', value: string | number) => {
    setAdvancedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeAdvancedRow = (id: number) => {
    setAdvancedRows((prev) => prev.filter((row) => row.id !== id));
  };

  const generatedFlows = useMemo(() => {
    if (mode === 'ADVANCED') {
      return [...advancedRows]
        .filter((r) => r.date && !isNaN(new Date(r.date).getTime()) && r.amount !== 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((r) => ({ date: r.date, amount: Number(r.amount) || 0 }));
    }

    const start = new Date(startDate);
    const end = new Date(maturityDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return [];

    const flows: { date: string; amount: number }[] = [];
    const cur = new Date(start);
    let safety = 0;

    while (cur <= end && safety < 600) {
      flows.push({
        date: cur.toISOString().slice(0, 10),
        amount: -Math.abs(Number(recurringAmount) || 0),
      });

      if (frequency === 'WEEKLY') cur.setDate(cur.getDate() + 7);
      else if (frequency === 'MONTHLY') cur.setMonth(cur.getMonth() + 1);
      else if (frequency === 'QUARTERLY') cur.setMonth(cur.getMonth() + 3);
      else cur.setFullYear(cur.getFullYear() + 1);

      safety++;
    }

    flows.push({
      date: end.toISOString().slice(0, 10),
      amount: Math.abs(Number(maturityAmount) || 0),
    });

    return flows;
  }, [mode, frequency, startDate, maturityDate, recurringAmount, maturityAmount, advancedRows]);

  const analysis = useMemo(() => {
    if (generatedFlows.length < 2) {
      return {
        xirrPercent: null,
        periodLabel: '—',
        totalInvested: 0,
        totalReturns: 0,
        netGain: 0,
        returnPercent: 0,
        timelineRows: [],
        chartData: [],
      };
    }

    const d0 = new Date(generatedFlows[0].date).getTime();
    const dLast = new Date(generatedFlows[generatedFlows.length - 1].date).getTime();
    const totalDays = Math.max(1, Math.round((dLast - d0) / (1000 * 60 * 60 * 24)));
    const years = totalDays / 365.25;
    const periodLabel =
      years >= 1
        ? `${Number(years.toFixed(1))} ${years >= 1.5 ? 'Years' : 'Year'}`
        : `${totalDays} Days`;

    const solverFlows = generatedFlows.map((f) => ({
      timeYears: (new Date(f.date).getTime() - d0) / (1000 * 60 * 60 * 24 * 365),
      amount: f.amount,
    }));

    const xirrRate = solveXirr(solverFlows);
    const xirrPercent = xirrRate !== null ? xirrRate * 100 : null;

    const totalInvested = generatedFlows
      .filter((f) => f.amount < 0)
      .reduce((s, f) => s + Math.abs(f.amount), 0);

    const totalReturns = generatedFlows
      .filter((f) => f.amount > 0)
      .reduce((s, f) => s + f.amount, 0);

    const netGain = totalReturns - totalInvested;
    const returnPercent = totalInvested > 0 ? (netGain / totalInvested) * 100 : 0;

    let cumulative = 0;
    const timelineRows = generatedFlows.map((f, idx) => {
      cumulative += f.amount;
      return {
        index: idx + 1,
        date: f.date,
        dateLabel: formatDateShort(f.date),
        monthLabel: formatMonthYear(f.date),
        amount: f.amount,
        isInvestment: f.amount < 0,
        cumulative,
      };
    });

    // Build chart data including projected value at solved XIRR rate
    let projectedAtXirr = 0;
    const chartData = timelineRows.map((row, idx) => {
      if (idx > 0 && xirrRate !== null) {
        const dtYears =
          (new Date(row.date).getTime() - new Date(timelineRows[idx - 1].date).getTime()) /
          (1000 * 60 * 60 * 24 * 365);
        projectedAtXirr = projectedAtXirr * Math.pow(1 + xirrRate, dtYears);
      }
      if (row.isInvestment) {
        projectedAtXirr += Math.abs(row.amount);
      }
      return {
        label: row.monthLabel,
        investment: row.isInvestment ? Math.abs(row.amount) : 0,
        returnFlow: !row.isInvestment ? row.amount : 0,
        cumulativeActual: Math.round(row.cumulative),
        projectedXirr: Math.round(projectedAtXirr),
      };
    });

    return {
      xirrPercent,
      periodLabel,
      totalInvested,
      totalReturns,
      netGain,
      returnPercent,
      timelineRows,
      chartData,
    };
  }, [generatedFlows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs Card */}
        <div className="lg:col-span-6 glass-card p-6 space-y-5">
          {/* Mode Switcher */}
          <div className="flex border-b border-border gap-4">
            <button
              type="button"
              onClick={() => setMode('SIMPLE')}
              className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                mode === 'SIMPLE'
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Simple Mode
            </button>
            <button
              type="button"
              onClick={() => setMode('ADVANCED')}
              className={`pb-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                mode === 'ADVANCED'
                  ? 'border-accent-500 text-accent-500'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Cash Flows (Advanced Mode)
            </button>
          </div>

          {mode === 'SIMPLE' ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Investment Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as InvestmentFrequency)}
                  className="glass-input text-xs font-medium"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-secondary block mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="glass-input text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-secondary block mb-1.5">
                    Maturity Date
                  </label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="glass-input text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Recurring Investment Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={recurringAmount}
                  onChange={(e) => setRecurringAmount(Math.max(0, Number(e.target.value)))}
                  className="glass-input text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1.5">
                  Total Maturity Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={maturityAmount}
                  onChange={(e) => setMaturityAmount(Math.max(0, Number(e.target.value)))}
                  className="glass-input text-xs font-semibold"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-start gap-2 text-[11px] text-text-secondary">
                <Info className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
                <span>
                  Enter <strong>investments (outflows)</strong> as negative numbers (e.g.{' '}
                  <code>-10000</code>) and <strong>returns/withdrawals (inflows)</strong> as
                  positive numbers (e.g. <code>290000</code>).
                </span>
              </div>

              <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold uppercase text-text-muted">
                <span className="col-span-1">#</span>
                <span className="col-span-4">Date</span>
                <span className="col-span-3">Amount</span>
                <span className="col-span-3 text-center">Type</span>
                <span className="col-span-1 text-center">Del</span>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {advancedRows.map((row, idx) => {
                  const isInv = row.amount < 0;
                  return (
                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-1 text-[11px] font-semibold text-text-muted pl-1">
                        {idx + 1}
                      </span>
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateAdvancedRow(row.id, 'date', e.target.value)}
                        className="col-span-4 glass-input text-xs"
                      />
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) =>
                          updateAdvancedRow(row.id, 'amount', Number(e.target.value))
                        }
                        className="col-span-3 glass-input text-xs font-semibold"
                      />
                      <span
                        className={`col-span-3 text-[10px] font-bold text-center px-1.5 py-1 rounded ${
                          isInv
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {isInv ? 'INVESTMENT' : 'RETURN'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAdvancedRow(row.id)}
                        className="col-span-1 text-red-400 hover:text-red-500 flex justify-center"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addAdvancedRow}
                className="btn-primary text-xs w-full justify-center"
              >
                <Plus className="w-4 h-4" /> Add Cash Flow Row
              </button>
            </div>
          )}
        </div>

        {/* Right Summary Panel */}
        <div className="lg:col-span-6 glass-card p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-border pb-4 mb-2 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-text-muted">
                  Your XIRR ({mode === 'SIMPLE' ? 'Simple Mode' : 'Advanced Mode'})
                </p>
                <p className="text-3xl font-bold tracking-tight text-text-primary tabular-nums mt-0.5">
                  {analysis.xirrPercent !== null ? `${analysis.xirrPercent.toFixed(2)}%` : 'N/A'}
                </p>
              </div>
              <span className="text-[11px] font-medium text-text-muted">Annualized Return</span>
            </div>

            <div className="divide-y divide-border/70 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-text-secondary">Period</span>
                <span className="font-semibold text-text-primary tabular-nums">{analysis.periodLabel}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-text-secondary">Investment</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatINR(analysis.totalInvested)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-text-secondary">Total Returns</span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatINR(analysis.totalReturns)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="font-medium text-text-secondary">
                  Absolute Return / Net Gain
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    analysis.netGain >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {formatINR(analysis.netGain)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-border flex items-baseline justify-between gap-4">
            <span className="text-xs font-semibold text-text-primary">Return Percentage</span>
            <span className="text-lg font-bold tracking-tight text-accent-500 tabular-nums">
              {analysis.returnPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      {analysis.chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Timeline Bar Chart */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary">Wealth Projection (Cash Flows)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${Math.round(v / 1000)}K`
                    }
                  />
                  <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0)]} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="investment" name="Investments" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="returnFlow" name="Returns" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Projected Growth at XIRR Rate */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-base font-bold text-text-primary">
              Projected Growth at XIRR Rate
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysis.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      Math.abs(v) >= 100000
                        ? `₹${(v / 100000).toFixed(1)}L`
                        : `₹${Math.round(v / 1000)}K`
                    }
                  />
                  <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0)]} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="cumulativeActual"
                    name="Actual Cumulative Net Flow"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedXirr"
                    name="Projected at XIRR Rate"
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow Timeline Table */}
      {analysis.timelineRows.length > 0 && (
        <div className="glass-card p-6">
          <button
            onClick={() => setShowTimelineTable((prev) => !prev)}
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <h3 className="text-base font-bold text-text-primary">Cash Flow Timeline</h3>
              <p className="text-xs text-text-secondary">
                All {analysis.timelineRows.length} dated inflows and outflows used in the XIRR
                calculation.
              </p>
            </div>
            {showTimelineTable ? (
              <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
            )}
          </button>

          {showTimelineTable && (
            <div className="mt-4 overflow-x-auto max-h-[380px]">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-surface z-10">
                  <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3 text-right">Cash Flow</th>
                    <th className="py-2 px-3 text-center">Type</th>
                    <th className="py-2 pl-3 text-right">Cumulative Net</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.timelineRows.map((row) => (
                    <tr key={row.index} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 text-text-muted">{row.index}</td>
                      <td className="py-2 px-3 font-medium text-text-primary">{row.dateLabel}</td>
                      <td
                        className={`py-2 px-3 text-right font-semibold ${
                          row.isInvestment ? 'text-red-500' : 'text-emerald-500'
                        }`}
                      >
                        {row.isInvestment ? '-' : '+'}
                        {formatINR(Math.abs(row.amount))}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.isInvestment
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          {row.isInvestment ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {row.isInvestment ? 'INVESTMENT' : 'RETURN'}
                        </span>
                      </td>
                      <td className="py-2 pl-3 text-right font-medium text-text-secondary">
                        {formatINR(row.cumulative)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
