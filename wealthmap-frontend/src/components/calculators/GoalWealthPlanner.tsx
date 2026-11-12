import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Trash2,
  RotateCcw,
  Trophy,
  TrendingUp,
  Flag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

interface GoalMilestone {
  id: number;
  name: string;
  currentCost: number;
  years: number;
  inflation: number;
  cagr: number;
}

const GOAL_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

const GOAL_NAME_PRESETS = [
  'Retirement Fund',
  'Child Higher Education',
  'Dream Home Down Payment',
  'Financial Independence',
  'World Tour / Sabbatical',
  'Custom Goal',
];

const formatINR = (val: number, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);

const formatIndianShort = (val: number) => {
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)} K`;
  return `${Math.round(val)}`;
};

function solveMonthlyForGoal(
  allocatedCorpus: number,
  targetFV: number,
  goalYears: number,
  investYears: number,
  cagrPercent: number,
  stepUpPercent: number
): number {
  const rMonthly = Math.max(0, cagrPercent) / 100 / 12;
  const step = Math.max(0, stepUpPercent) / 100;
  const totalMonths = goalYears * 12;
  const contribMonths = Math.min(totalMonths, Math.max(1, investYears) * 12);

  const simulate = (startMonthly: number) => {
    let bal = allocatedCorpus;
    let mAmt = startMonthly;
    for (let m = 1; m <= totalMonths; m++) {
      if (m <= contribMonths) {
        bal += mAmt;
      }
      bal *= 1 + rMonthly;
      if (m % 12 === 0 && step > 0) {
        mAmt *= 1 + step;
      }
    }
    return bal;
  };

  if (simulate(0) >= targetFV) return 0;

  let low = 0;
  let high = Math.max(1000, targetFV / Math.max(1, contribMonths) * 2);
  while (simulate(high) < targetFV && high < 1e9) {
    high *= 2;
  }

  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (simulate(mid) >= targetFV) high = mid;
    else low = mid;
  }
  return high;
}

export interface SeedGoalInput {
  name: string;
  currentCost: number;
  years: number;
}

interface GoalWealthPlannerProps {
  initialCorpus?: number;
  initialGoals?: SeedGoalInput[];
}

export default function GoalWealthPlanner({
  initialCorpus,
  initialGoals,
}: GoalWealthPlannerProps) {
  const currentYear = new Date().getFullYear();

  const [presentCorpus, setPresentCorpus] = useState<number>(
    initialCorpus !== undefined ? initialCorpus : 2000000
  );
  const [stepUpPercent, setStepUpPercent] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [customContribYears, setCustomContribYears] = useState<string>('');

  const [goals, setGoals] = useState<GoalMilestone[]>(() => {
    if (initialGoals && initialGoals.length > 0) {
      return initialGoals.map((g, idx) => ({
        id: idx + 1,
        name: g.name,
        currentCost: g.currentCost,
        years: Math.max(1, g.years),
        inflation: 6,
        cagr: 12,
      }));
    }
    return [
      {
        id: 1,
        name: 'Retirement Fund',
        currentCost: 10000000,
        years: 15,
        inflation: 6,
        cagr: 12,
      },
    ];
  });

  const addGoal = () => {
    setGoals((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: 'Child Higher Education',
        currentCost: 2500000,
        years: 10,
        inflation: 8,
        cagr: 12,
      },
    ]);
  };

  const updateGoal = (id: number, field: keyof GoalMilestone, value: string | number) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const removeGoal = (id: number) => {
    if (goals.length <= 1) return;
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const resetAll = () => {
    setPresentCorpus(2000000);
    setStepUpPercent(0);
    setShowAdvanced(false);
    setCustomContribYears('');
    setGoals([
      {
        id: 1,
        name: 'Retirement Fund',
        currentCost: 10000000,
        years: 15,
        inflation: 6,
        cagr: 12,
      },
    ]);
  };

  const plan = useMemo(() => {
    const corpus = Math.max(0, Number(presentCorpus) || 0);
    const maxGoalYears = Math.max(1, ...goals.map((g) => Math.max(1, Number(g.years) || 1)));
    const stopInvestingYears =
      showAdvanced && Number(customContribYears) > 0
        ? Math.min(maxGoalYears, Math.round(Number(customContribYears)))
        : maxGoalYears;

    // Proportionately allocate present corpus based on target future value
    const goalTargets = goals.map((g) => {
      const yrs = Math.max(1, Number(g.years) || 1);
      const inf = Math.max(0, Number(g.inflation) || 0) / 100;
      const fv = Math.max(0, Number(g.currentCost) || 0) * Math.pow(1 + inf, yrs);
      return { ...g, yrs, fv };
    });

    const sumFV = goalTargets.reduce((s, g) => s + g.fv, 0);

    const goalBreakdowns = goalTargets.map((g, idx) => {
      const share = sumFV > 0 ? g.fv / sumFV : 1 / goalTargets.length;
      const allocatedCorpus = corpus * share;
      const investYrsForGoal = Math.min(g.yrs, stopInvestingYears);
      const monthlyRequired = solveMonthlyForGoal(
        allocatedCorpus,
        g.fv,
        g.yrs,
        investYrsForGoal,
        Number(g.cagr) || 12,
        stepUpPercent
      );

      return {
        ...g,
        color: GOAL_COLORS[idx % GOAL_COLORS.length],
        allocatedCorpus,
        investYrsForGoal,
        monthlyRequired,
      };
    });

    const totalMonthlyStarting = goalBreakdowns.reduce((s, g) => s + g.monthlyRequired, 0);

    // Combined Year-by-Year Simulation
    const perGoalStates = goalBreakdowns.map((g) => ({
      goal: g,
      balance: g.allocatedCorpus,
      monthly: g.monthlyRequired,
      fulfilled: false,
    }));

    const yearlySchedule: {
      yearIndex: number;
      calendarYear: number;
      monthlyInvestment: number;
      stepUpLabel: string;
      annualTotal: number;
      yearlyGrowth: number;
      endingBalance: number;
      milestonesReached: { name: string; fv: number }[];
    }[] = [];

    const chartData: { label: string; remainingWealth: number }[] = [
      { label: 'Year 0', remainingWealth: Math.round(corpus) },
    ];

    for (let y = 1; y <= maxGoalYears; y++) {
      let yrMonthlyTotal = 0;
      let yrAnnualContrib = 0;
      let yrGrowthTotal = 0;
      const milestonesReached: { name: string; fv: number }[] = [];

      for (const st of perGoalStates) {
        if (st.fulfilled) continue;

        const rMonthly = Math.max(0, Number(st.goal.cagr) || 0) / 100 / 12;
        const isContributing = y <= st.goal.investYrsForGoal;
        const startBal = st.balance;
        let goalAnnualContrib = 0;

        if (isContributing) {
          yrMonthlyTotal += st.monthly;
        }

        for (let m = 1; m <= 12; m++) {
          if (isContributing) {
            st.balance += st.monthly;
            goalAnnualContrib += st.monthly;
          }
          st.balance *= 1 + rMonthly;
        }

        yrAnnualContrib += goalAnnualContrib;
        yrGrowthTotal += st.balance - startBal - goalAnnualContrib;

        if (y === st.goal.yrs) {
          milestonesReached.push({ name: st.goal.name, fv: Math.round(st.goal.fv) });
          st.balance = 0;
          st.fulfilled = true;
        } else if (stepUpPercent > 0 && isContributing) {
          st.monthly *= 1 + stepUpPercent / 100;
        }
      }

      const endingTotal = perGoalStates.reduce((s, st) => s + st.balance, 0);
      yearlySchedule.push({
        yearIndex: y,
        calendarYear: currentYear + y - 1,
        monthlyInvestment: Math.round(yrMonthlyTotal),
        stepUpLabel: stepUpPercent > 0 && y > 1 ? `+${stepUpPercent}%` : '-',
        annualTotal: Math.round(yrAnnualContrib),
        yearlyGrowth: Math.round(yrGrowthTotal),
        endingBalance: Math.round(endingTotal),
        milestonesReached,
      });

      chartData.push({
        label: `Year ${y}`,
        remainingWealth: Math.round(endingTotal),
      });
    }

    return {
      totalMonthlyStarting: Math.round(totalMonthlyStarting),
      stopInvestingYears,
      corpus,
      goalBreakdowns,
      yearlySchedule,
      chartData,
    };
  }, [presentCorpus, stepUpPercent, showAdvanced, customContribYears, goals, currentYear]);

  const pieData = useMemo(
    () =>
      plan.goalBreakdowns.map((g) => ({
        name: g.name,
        value: Math.max(1, Math.round(g.monthlyRequired)),
        color: g.color,
      })),
    [plan]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-6 glass-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent-500" />
              <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
                Goal-Based Wealth Planner
              </h3>
            </div>
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary px-2.5 py-1 rounded-lg bg-surface-hover border border-border"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Present Corpus Formed (₹)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                value={presentCorpus}
                onChange={(e) => setPresentCorpus(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Annual Investment Step-up (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={stepUpPercent}
                onChange={(e) => setStepUpPercent(Math.max(0, Number(e.target.value)))}
                className="glass-input text-xs font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-text-primary">
              <input
                type="checkbox"
                checked={showAdvanced}
                onChange={(e) => setShowAdvanced(e.target.checked)}
                className="rounded border-border text-accent-500 focus:ring-accent-500"
              />
              Advanced Options (Shorten Contribution Period)
            </label>
            {showAdvanced && (
              <div className="p-3 rounded-xl bg-surface-hover border border-border">
                <label className="font-semibold text-text-secondary block mb-1">
                  Stop Investing After (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="Leave blank to invest until each goal"
                  value={customContribYears}
                  onChange={(e) => setCustomContribYears(e.target.value)}
                  className="glass-input text-xs font-semibold"
                />
              </div>
            )}
          </div>

          {/* Target Milestones */}
          <div className="space-y-4">
            <div className="px-3 py-2 rounded-xl bg-surface-hover border border-border text-xs font-bold text-text-primary">
              Target Milestones
            </div>

            {goals.map((g, idx) => (
              <div
                key={g.id}
                className="p-4 rounded-xl bg-surface-hover/60 border border-border space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="font-bold text-accent-500 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" /> Goal #{idx + 1}
                  </span>
                  {goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGoal(g.id)}
                      className="text-red-400 hover:text-red-500"
                      title="Remove Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-text-secondary block mb-1">Goal Name</label>
                  <select
                    value={GOAL_NAME_PRESETS.includes(g.name) ? g.name : 'Custom Goal'}
                    onChange={(e) => {
                      if (e.target.value !== 'Custom Goal') {
                        updateGoal(g.id, 'name', e.target.value);
                      }
                    }}
                    className="glass-input text-xs font-medium mb-1.5"
                  >
                    {GOAL_NAME_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={g.name}
                    onChange={(e) => updateGoal(g.id, 'name', e.target.value)}
                    placeholder="Goal name"
                    className="glass-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Current Cost (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={g.currentCost}
                      onChange={(e) =>
                        updateGoal(g.id, 'currentCost', Math.max(0, Number(e.target.value)))
                      }
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Time to Goal (Yrs)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={g.years}
                      onChange={(e) =>
                        updateGoal(
                          g.id,
                          'years',
                          Math.max(1, Math.min(50, Number(e.target.value) || 1))
                        )
                      }
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Expected Inflation (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={g.inflation}
                      onChange={(e) =>
                        updateGoal(g.id, 'inflation', Math.max(0, Number(e.target.value)))
                      }
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-text-secondary block mb-1">
                      Expected Returns (CAGR %)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="0.5"
                      value={g.cagr}
                      onChange={(e) =>
                        updateGoal(g.id, 'cagr', Math.max(1, Number(e.target.value)))
                      }
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addGoal}
              className="w-full p-3.5 rounded-xl border border-dashed border-accent-500/40 bg-accent-500/5 hover:bg-accent-500/10 flex items-center gap-3 text-left transition-colors"
            >
              <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-accent-500">Achieve All Your Dreams!</p>
                <p className="text-[11px] text-text-secondary">
                  Add multiple life goals to see how we can plan them together.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Summary & Goal-wise Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-card p-6 text-center space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
              Required Starting Monthly Investment
            </p>
            <p className="text-3xl sm:text-4xl font-extrabold text-accent-500">
              {formatINR(plan.totalMonthlyStarting)}
            </p>
            <p className="text-xs text-text-secondary leading-relaxed max-w-md mx-auto">
              Assuming a <strong>{stepUpPercent}%</strong> annual step-up. Your investments will
              run for <strong>{plan.stopInvestingYears} years</strong>. Your present corpus of{' '}
              <strong>{formatINR(plan.corpus)}</strong> was proportionately allocated.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0), 'Monthly']} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-text-primary">Goal-wise Breakdown</h3>
            <div className="space-y-3">
              {plan.goalBreakdowns.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-surface-hover border-l-4 border border-border text-xs space-y-1.5"
                  style={{ borderLeftColor: g.color }}
                >
                  <p className="text-sm font-bold text-text-primary">{g.name}</p>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Monthly Investment Required:</span>
                    <span className="font-bold text-accent-500">
                      {formatINR(Math.round(g.monthlyRequired))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Invest for:</span>
                    <span className="font-semibold text-emerald-500">
                      {g.investYrsForGoal} Years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Target Future Value:</span>
                    <span className="font-bold text-text-primary">
                      {formatINR(Math.round(g.fv))} ({formatIndianShort(g.fv)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Investment Schedule */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-base font-bold text-text-primary">Yearly Investment Schedule</h3>
        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-surface z-10">
              <tr className="border-b border-border text-text-muted uppercase text-[11px]">
                <th className="py-2.5 pr-3">Year</th>
                <th className="py-2.5 px-3 text-right">Monthly Investment</th>
                <th className="py-2.5 px-3 text-center">Step-Up</th>
                <th className="py-2.5 px-3 text-right">Annual Total</th>
                <th className="py-2.5 px-3 text-right">Yearly Growth</th>
                <th className="py-2.5 pl-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {plan.yearlySchedule.map((row) => (
                <React.Fragment key={row.yearIndex}>
                  <tr className="border-b border-border/50">
                    <td className="py-2.5 pr-3 font-semibold text-accent-500">
                      {row.yearIndex} ({row.calendarYear})
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-primary font-medium">
                      {formatINR(row.monthlyInvestment)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-text-muted">{row.stepUpLabel}</td>
                    <td className="py-2.5 px-3 text-right text-text-secondary">
                      {formatINR(row.annualTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-500 font-medium">
                      {formatINR(row.yearlyGrowth)}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-bold text-text-primary">
                      {formatINR(row.endingBalance)}
                    </td>
                  </tr>
                  {row.milestonesReached.map((m, i) => (
                    <tr key={i} className="bg-amber-500/10 border-b border-amber-500/20">
                      <td colSpan={6} className="py-2 px-3 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5" /> Milestone Reached:{' '}
                          <span className="uppercase">{m.name}</span> — Target of{' '}
                          {formatINR(m.fv)} withdrawn for fulfillment.
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wealth Growth Projection (YoY) */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-500" />
          <h3 className="text-base font-bold text-text-primary">
            Wealth Growth Projection (YoY)
          </h3>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={plan.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 10000000
                    ? `₹${(v / 10000000).toFixed(1)} Cr`
                    : v >= 100000
                    ? `₹${(v / 100000).toFixed(1)} L`
                    : `₹${Math.round(v / 1000)}K`
                }
              />
              <RechartsTooltip formatter={(v) => [formatINR(Number(v) || 0, 0), 'Remaining Wealth']} />
              <Bar dataKey="remainingWealth" name="Remaining Wealth" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-text-muted text-center">
          This chart shows your total remaining wealth. Whenever a goal is reached, those funds are
          withdrawn and the total balance decreases accordingly.
        </p>
      </div>
    </div>
  );
}
