import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

type ContributionFreq = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
type CompoundingFreq = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';

interface AssetItem {
  id: number;
  name: string;
  presentBalance: number;
  periodicContribution: number;
  contributionFreq: ContributionFreq;
  durationYears: number;
  growthRate: number;
  compoundingFreq: CompoundingFreq;
  annualStepPercent: number;
  inflationRate: number;
  stopContributionAfterYears: number;
}

const COMPOUNDING_MAP: Record<CompoundingFreq, number> = {
  MONTHLY: 12,
  QUARTERLY: 4,
  HALF_YEARLY: 2,
  YEARLY: 1,
};

const formatINR = (val: number, decimals = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

const formatIndianWords = (num: number) => {
  if (!num || num <= 0) return '';
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Crore`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(2).replace(/\.00$/, '')} Thousand`;
  return `₹ ${num}`;
};

function simulateAssetYearly(item: AssetItem): number[] {
  const nComp = COMPOUNDING_MAP[item.compoundingFreq] || 12;
  const nominalRate = Math.max(0, Number(item.growthRate) || 0) / 100;
  const infRate = Math.max(0, Number(item.inflationRate) || 0) / 100;
  // Real effective annual rate if inflation > 0
  const effectiveAnnualRate =
    infRate > 0 ? (1 + nominalRate) / (1 + infRate) - 1 : nominalRate;
  const monthlyEffRate = Math.pow(1 + Math.max(-0.99, effectiveAnnualRate), 1 / 12) - 1;
  const stepRate = (Number(item.annualStepPercent) || 0) / 100;

  const totalYears = Math.max(1, Math.min(50, Math.round(item.durationYears || 1)));
  const stopAfter = Math.max(0, Math.min(totalYears, Math.round(item.stopContributionAfterYears || totalYears)));

  const contribStepMonths =
    item.contributionFreq === 'MONTHLY' ? 1 : item.contributionFreq === 'QUARTERLY' ? 3 : 12;

  let balance = Math.max(0, Number(item.presentBalance) || 0);
  let currentContrib = Math.max(0, Number(item.periodicContribution) || 0);
  const yearlyBalances: number[] = [];

  for (let y = 1; y <= totalYears; y++) {
    const isContributing = y <= stopAfter;
    for (let m = 1; m <= 12; m++) {
      if (isContributing && (m - 1) % contribStepMonths === 0) {
        balance += currentContrib;
      }
      if (infRate > 0) {
        balance *= 1 + monthlyEffRate;
      } else {
        // Use specified compounding frequency converted to monthly equivalent
        const monthlyFromComp = Math.pow(1 + nominalRate / nComp, nComp / 12) - 1;
        balance *= 1 + monthlyFromComp;
      }
    }
    yearlyBalances.push(Math.round(balance));
    if (isContributing && stepRate !== 0) {
      currentContrib = Math.max(0, currentContrib * (1 + stepRate));
    }
  }

  return yearlyBalances;
}

const SAMPLE_PORTFOLIO: AssetItem[] = [
  {
    id: 1,
    name: 'Mutual Fund',
    presentBalance: 1500000,
    periodicContribution: 15000,
    contributionFreq: 'MONTHLY',
    durationYears: 15,
    growthRate: 12,
    compoundingFreq: 'QUARTERLY',
    annualStepPercent: 5,
    inflationRate: 0,
    stopContributionAfterYears: 15,
  },
  {
    id: 2,
    name: 'PPF Account',
    presentBalance: 500000,
    periodicContribution: 12500,
    contributionFreq: 'MONTHLY',
    durationYears: 15,
    growthRate: 7.1,
    compoundingFreq: 'YEARLY',
    annualStepPercent: 0,
    inflationRate: 0,
    stopContributionAfterYears: 15,
  },
  {
    id: 3,
    name: 'NPS Tier-1',
    presentBalance: 300000,
    periodicContribution: 5000,
    contributionFreq: 'MONTHLY',
    durationYears: 20,
    growthRate: 10,
    compoundingFreq: 'MONTHLY',
    annualStepPercent: 0,
    inflationRate: 0,
    stopContributionAfterYears: 20,
  },
];

const EMPTY_FORM: Omit<AssetItem, 'id'> = {
  name: 'Mutual Fund',
  presentBalance: 0,
  periodicContribution: 10000,
  contributionFreq: 'MONTHLY',
  durationYears: 15,
  growthRate: 12,
  compoundingFreq: 'MONTHLY',
  annualStepPercent: 0,
  inflationRate: 0,
  stopContributionAfterYears: 15,
};

export default function MultiAssetWealthCalculator() {
  const currentYear = new Date().getFullYear();

  const [items, setItems] = useState<AssetItem[]>(SAMPLE_PORTFOLIO);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<AssetItem, 'id'>>(EMPTY_FORM);

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (item: AssetItem) => {
    setEditingId(item.id);
    const { id: _id, ...rest } = item;
    setForm(rest);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId !== null) {
      setItems((prev) =>
        prev.map((it) => (it.id === editingId ? { id: editingId, ...form } : it))
      );
    } else {
      setItems((prev) => [...prev, { id: Date.now(), ...form }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const matrix = useMemo(() => {
    const filtered = items.filter((it) =>
      it.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    const maxYears = Math.max(0, ...items.map((it) => Math.max(1, Math.round(it.durationYears))));
    const years = Array.from({ length: maxYears }, (_, i) => currentYear + i + 1);

    const rows = filtered.map((item) => {
      const series = simulateAssetYearly(item);
      return {
        item,
        values: years.map((_, idx) => series[idx] ?? 0),
      };
    });

    const totalsPerYear = years.map((_, idx) =>
      items.reduce((sum, item) => {
        const series = simulateAssetYearly(item);
        return sum + (series[idx] ?? 0);
      }, 0)
    );

    const totalPresentBalance = items.reduce((s, it) => s + (it.presentBalance || 0), 0);
    const peakWealth = totalsPerYear.length > 0 ? Math.max(...totalsPerYear) : totalPresentBalance;
    const finalYearWealth =
      totalsPerYear.length > 0 ? totalsPerYear[totalsPerYear.length - 1] : totalPresentBalance;

    const chartData = years.map((yr, idx) => ({
      year: yr,
      totalWealth: totalsPerYear[idx],
    }));

    return {
      years,
      rows,
      totalsPerYear,
      totalPresentBalance,
      peakWealth,
      finalYearWealth,
      chartData,
    };
  }, [items, searchQuery, currentYear]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
              Multi-Asset Wealth Calculator
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Combine Mutual Funds, PPF, NPS, FDs, SGBs &amp; Stocks into a consolidated year-on-year
            projection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {items.length === 0 && (
            <button
              type="button"
              onClick={() => setItems(SAMPLE_PORTFOLIO)}
              className="px-3 py-2 rounded-xl bg-surface-hover border border-border text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-500" /> Load Sample
            </button>
          )}
          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary text-xs"
          >
            <Plus className="w-4 h-4" /> Add Investment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Present Portfolio Balance
            </p>
            <p className="text-xl font-extrabold text-text-primary mt-1">
              {formatINR(matrix.totalPresentBalance)}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Peak Projected Wealth
            </p>
            <p className="text-xl font-extrabold text-emerald-500 mt-1">
              {formatINR(matrix.peakWealth)}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Final Horizon Wealth ({matrix.years[matrix.years.length - 1] || currentYear})
            </p>
            <p className="text-xl font-extrabold text-accent-500 mt-1">
              {formatINR(matrix.finalYearWealth)}
            </p>
          </div>
        </div>
      )}

      {/* Year-on-Year Consolidated Matrix */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-text-primary">
            Year-on-Year Asset Projection Matrix
          </h4>
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search investment..."
              className="glass-input text-xs pl-8"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl space-y-3">
            <Layers className="w-8 h-8 text-text-muted mx-auto opacity-60" />
            <p className="text-sm text-text-secondary">
              Nothing to show! Click <strong>Add Investment</strong> to begin.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                  <th className="py-2.5 pr-3 sticky left-0 bg-surface z-10">Item</th>
                  <th className="py-2.5 px-3">Action</th>
                  {matrix.years.map((yr) => (
                    <th key={yr} className="py-2.5 px-3 text-right">
                      {yr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map(({ item, values }) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-surface-hover/50">
                    <td className="py-2.5 pr-3 font-semibold text-text-primary sticky left-0 bg-surface">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="text-text-secondary hover:text-accent-500"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    {values.map((val, idx) => (
                      <td key={idx} className="py-2.5 px-3 text-right text-text-secondary">
                        {formatINR(val)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-accent-500/10 border-t-2 border-accent-500/30 font-bold">
                  <td colSpan={2} className="py-2.5 pr-3 text-accent-500 uppercase text-[11px]">
                    Est. Wealth
                  </td>
                  {matrix.totalsPerYear.map((tot, idx) => (
                    <td key={idx} className="py-2.5 px-3 text-right text-accent-500">
                      {formatINR(tot)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Consolidated Wealth Chart */}
      {matrix.chartData.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-500" />
            <h3 className="text-base font-bold text-text-primary">
              Consolidated Multi-Asset Wealth Growth
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={matrix.chartData}>
                <defs>
                  <linearGradient id="multiAssetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    v >= 10000000
                      ? `₹${(v / 10000000).toFixed(1)}Cr`
                      : v >= 100000
                      ? `₹${(v / 100000).toFixed(1)}L`
                      : `₹${Math.round(v / 1000)}K`
                  }
                />
                <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0), 'Est. Wealth']} />
                <Area
                  type="monotone"
                  dataKey="totalWealth"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#multiAssetGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Add / Edit Investment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-text-primary mb-4">
              {editingId !== null ? 'Edit Investment Details' : 'Investment Details'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-text-secondary block mb-1">
                  Investment Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Mutual Fund, PPF, NPS, SGB"
                  className="glass-input text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">
                  Present A/C Balance (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={form.presentBalance}
                  onChange={(e) =>
                    setForm({ ...form, presentBalance: Math.max(0, Number(e.target.value)) })
                  }
                  className="glass-input text-xs font-semibold"
                />
                {form.presentBalance > 0 && (
                  <p className="text-[10px] text-accent-500 mt-0.5 font-medium">
                    {formatIndianWords(form.presentBalance)}
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">
                  Periodic Contribution (Rs.)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={form.periodicContribution}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        periodicContribution: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="col-span-2 glass-input text-xs font-semibold"
                  />
                  <select
                    value={form.contributionFreq}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contributionFreq: e.target.value as ContributionFreq,
                      })
                    }
                    className="glass-input text-xs font-medium"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={form.durationYears}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        durationYears: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                      })
                    }
                    className="glass-input text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">
                    Stop Contribution After (Yrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={form.stopContributionAfterYears}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stopContributionAfterYears: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="glass-input text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">
                  Expected Rate of Growth (%)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="0.5"
                    value={form.growthRate}
                    onChange={(e) =>
                      setForm({ ...form, growthRate: Math.max(0, Number(e.target.value)) })
                    }
                    className="col-span-2 glass-input text-xs font-semibold"
                  />
                  <select
                    value={form.compoundingFreq}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        compoundingFreq: e.target.value as CompoundingFreq,
                      })
                    }
                    className="glass-input text-xs font-medium"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="HALF_YEARLY">Half Yearly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">
                    Yearly Step-Up/Down (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={form.annualStepPercent}
                    onChange={(e) =>
                      setForm({ ...form, annualStepPercent: Number(e.target.value) })
                    }
                    className="glass-input text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">
                    Rate of Inflation (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={form.inflationRate}
                    onChange={(e) =>
                      setForm({ ...form, inflationRate: Math.max(0, Number(e.target.value)) })
                    }
                    className="glass-input text-xs font-semibold"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center text-xs mt-2">
                Save Investment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
