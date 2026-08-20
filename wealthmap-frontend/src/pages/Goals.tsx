// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllGoals, createGoal, updateGoal, deleteGoal } from '../api/goals.api';
import type { GoalResponse } from '../api/goals.api';
import { getEmergencyFund, saveEmergencyFund, calculateRetirement } from '../api/planning.api';
import type { RetirementResponse } from '../api/planning.api';
import { getAllAssets } from '../api/assets.api';
import { getAllLiabilities } from '../api/liabilities.api';
import { Target, Plus, ShieldCheck, Calculator, Trash2, Edit2, CheckCircle2, ChevronRight, AlertCircle, X, Loader2 } from 'lucide-react';
import SwpCalculator from './SwpCalculator';

export default function Goals() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'goals' | 'emergency' | 'swp' | 'retirement'>('goals');

  // Modal States
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalResponse | null>(null);

  // Form States for Goal
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalNotes, setGoalNotes] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);

  // Emergency Fund Form State
  const [monthlyExpenseInput, setMonthlyExpenseInput] = useState('');
  const [targetMonthsInput, setTargetMonthsInput] = useState('6');


  // Retirement Calculator State
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [monthlyExpenseToday, setMonthlyExpenseToday] = useState(50000);
  const [expectedReturnRate, setExpectedReturnRate] = useState(10);
  const [inflationRate, setInflationRate] = useState(6);
  const [useCustomNetWorth, setUseCustomNetWorth] = useState(false);
  const [customNetWorthInput, setCustomNetWorthInput] = useState('');

  // Queries
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: getAllGoals
  });

  const { data: emergencyFund, isLoading: efLoading } = useQuery({
    queryKey: ['emergencyFund'],
    queryFn: getEmergencyFund
  });


  const { data: assets } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets
  });

  const { data: liabilities } = useQuery({
    queryKey: ['liabilities', 'all'],
    queryFn: getAllLiabilities
  });

  const totalAssets = assets?.reduce((sum, item) => sum + (item.currentValue || 0), 0) || 0;
  const totalLiabilities = liabilities?.reduce((sum, item) => sum + (item.outstandingBalance || 0), 0) || 0;
  const netWorth = totalAssets - totalLiabilities;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Open Create/Edit Goal Modal
  const openGoalModal = (goal?: GoalResponse) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalName(goal.name);
      setGoalTargetAmount(goal.targetAmount?.toString() || '');
      setGoalTargetDate(goal.targetDate || '');
      setGoalNotes(goal.notes || '');
      setSelectedAssetIds(goal.taggedAssetIds || []);
    } else {
      setEditingGoal(null);
      setGoalName('');
      setGoalTargetAmount('');
      setGoalTargetDate('');
      setGoalNotes('');
      setSelectedAssetIds([]);
    }
    setShowGoalModal(true);
  };

  // Save Goal
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTargetAmount) return;

    const payload = {
      name: goalName,
      targetAmount: Number(goalTargetAmount),
      targetDate: goalTargetDate || undefined,
      notes: goalNotes,
      taggedAssetIds: selectedAssetIds
    };

    if (editingGoal) {
      await updateGoal(editingGoal.id, payload);
    } else {
      await createGoal(payload);
    }

    queryClient.invalidateQueries({ queryKey: ['goals'] });
    setShowGoalModal(false);
  };

  const handleDeleteGoal = async (id: number) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(id);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  };

  // Save Emergency Fund Config
  const handleSaveEmergencyFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyExpenseInput) return;
    await saveEmergencyFund({
      monthlyExpense: Number(monthlyExpenseInput),
      targetMonths: Number(targetMonthsInput) || 6
    });
    queryClient.invalidateQueries({ queryKey: ['emergencyFund'] });
  };


  const activeNetWorth = useCustomNetWorth ? (Number(customNetWorthInput) || 0) : netWorth;

  // Reactively calculate retirement on param changes
  const retirementResult = useMemo(() => {
    const yearsToRetirement = Math.max(1, retirementAge - currentAge);
    const monthlyExpenseTodayVal = Number(monthlyExpenseToday) || 0;
    const inflationRateVal = (Number(inflationRate) || 0) / 100.0;
    const expectedReturnRateVal = (Number(expectedReturnRate) || 0) / 100.0;

    const inflationFactor = Math.pow(1.0 + inflationRateVal, yearsToRetirement);
    const adjustedMonthlyExpense = monthlyExpenseTodayVal * inflationFactor;
    const annualExpenseAtRetirement = adjustedMonthlyExpense * 12.0;

    // Required Retirement Corpus using Rule of 25 (or 4% safe withdrawal rule, corresponding to 25 years of retirement)
    const requiredRetirementCorpus = annualExpenseAtRetirement * 25.0;

    // Projected Net Worth at Retirement Age
    const projectedNetWorthAtRetirement = activeNetWorth * Math.pow(1.0 + expectedReturnRateVal, yearsToRetirement);
    const shortfallOrSurplus = projectedNetWorthAtRetirement - requiredRetirementCorpus;
    const readiness = requiredRetirementCorpus > 0 ? (projectedNetWorthAtRetirement / requiredRetirementCorpus) * 100.0 : 100.0;
    const readinessPercentage = Math.min(100.0, Math.max(0.0, readiness));

    return {
      yearsToRetirement,
      inflationAdjustedMonthlyExpense: adjustedMonthlyExpense,
      requiredRetirementCorpus,
      projectedNetWorthAtRetirement,
      shortfallOrSurplus,
      readinessPercentage
    };
  }, [currentAge, retirementAge, monthlyExpenseToday, expectedReturnRate, inflationRate, activeNetWorth]);

  return (
    <div className="space-y-6">
      
      {/* Page Title & Hero Net Worth Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-heading text-2xl font-dmsans">Goals & Financial Planning</h1>
          <p className="text-text-secondary text-sm">Target corpus tracking, emergency preparedness, and retirement readiness.</p>
        </div>

        {/* Display Current Net Worth */}
        <div className="glass-card px-4 py-2.5 flex items-center gap-3 border border-accent-100 bg-accent-500/5 min-w-[200px]">
          <div className="p-2 bg-accent-500/10 rounded-xl text-accent-500 border border-accent-100">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Current Net Worth</p>
            <p className="text-xl font-extrabold text-accent-500">{formatCurrency(netWorth)}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tab Controls */}
      <div className="flex justify-start">
        <div className="flex flex-wrap gap-1 p-1 bg-surface-hover rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'goals' ? 'bg-surface shadow-sm border border-border text-accent-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Target className="w-4 h-4" />
            Goals
          </button>
          <button 
            onClick={() => setActiveTab('emergency')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'emergency' ? 'bg-surface shadow-sm border border-border text-accent-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            Emergency Fund
          </button>

          <button 
            onClick={() => setActiveTab('swp')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'swp' ? 'bg-surface shadow-sm border border-border text-accent-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Calculator className="w-4 h-4" />
            SWP Calculator
          </button>
          <button 
            onClick={() => setActiveTab('retirement')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'retirement' ? 'bg-surface shadow-sm border border-border text-accent-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Calculator className="w-4 h-4" />
            Retirement
          </button>
        </div>
      </div>

      {/* TAB 1: GOAL-LINKED PORTFOLIOS */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-text-primary">Financial Target Goals</h2>
            <button 
              onClick={() => openGoalModal()}
              className="btn-primary text-xs"
            >
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          </div>

          {goalsLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent-500" /></div>
          ) : goals?.length === 0 ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <Target className="w-12 h-12 text-accent-500 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Financial Goals Defined</h3>
              <p className="text-text-secondary text-sm mb-4">Set milestone goals like "House Purchase" or "Education" and tag assets to track progress.</p>
              <button onClick={() => openGoalModal()} className="btn-primary text-xs"><Plus className="w-4 h-4" /> Create First Goal</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals?.map(g => (
                <div key={g.id} className="glass-card p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-text-primary">{g.name}</h3>
                        {g.targetDate && (
                          <p className="text-xs text-text-secondary">Target Date: {new Date(g.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openGoalModal(g)} className="p-1 text-text-secondary hover:text-text-primary"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteGoal(g.id)} className="p-1 text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-text-secondary">Saved: {formatCurrency(g.currentSavedAmount)}</span>
                        <span className="text-accent-500">Target: {formatCurrency(g.targetAmount)}</span>
                      </div>
                      <div className="w-full h-3 bg-surface-hover rounded-full overflow-hidden border border-border">
                        <div 
                          className="h-full bg-accent-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, g.progressPercentage)}%` }} 
                        />
                      </div>
                      <div className="text-right text-xs font-bold text-accent-500">{g.progressPercentage.toFixed(1)}% Completed</div>
                    </div>
                  </div>

                  {/* Tagged Assets List */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-text-secondary mb-2">Tagged Portfolio Assets ({g.taggedAssetIds?.length || 0}):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.taggedAssetIds?.map(aid => {
                        const asset = assets?.find(a => a.id === aid);
                        return asset ? (
                          <span key={aid} className="text-xs px-2 py-1 bg-accent-500/10 border border-accent-500/20 text-accent-500 rounded-md font-medium">
                            {asset.name} ({formatCurrency(asset.currentValue)})
                          </span>
                        ) : null;
                      })}
                      {(!g.taggedAssetIds || g.taggedAssetIds.length === 0) && (
                        <span className="text-xs text-text-muted italic">No assets tagged yet. Edit to tag assets.</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMERGENCY FUND TRACKER */}
      {activeTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-medium text-text-primary">Emergency Target Config</h3>
            <p className="text-xs text-text-secondary">Define your baseline monthly living expenses to calculate 6-month runway progress against liquid assets.</p>

            <form onSubmit={handleSaveEmergencyFund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Monthly Living Expenses (₹)</label>
                <input 
                  type="number" 
                  value={monthlyExpenseInput} 
                  onChange={e => setMonthlyExpenseInput(e.target.value)} 
                  placeholder="e.g. 50000"
                  className="glass-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Target Runway (Months)</label>
                <select 
                  value={targetMonthsInput} 
                  onChange={e => setTargetMonthsInput(e.target.value)} 
                  className="glass-input"
                >
                  <option value="3">3 Months (Basic)</option>
                  <option value="6">6 Months (Recommended)</option>
                  <option value="12">12 Months (Conservative)</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full text-xs">Save Target</button>
            </form>
          </div>

          <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-6 h-6 text-accent-500" />
                <h3 className="text-xl font-bold text-text-primary">Emergency Fund Preparedness</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-surface-hover border border-border">
                  <p className="text-xs text-text-secondary font-medium mb-1">Monthly Baseline</p>
                  <p className="text-xl font-bold text-text-primary">{formatCurrency(emergencyFund?.monthlyExpense || 0)}</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-hover border border-border">
                  <p className="text-xs text-text-secondary font-medium mb-1">Target Corpus ({emergencyFund?.targetMonths || 6}M)</p>
                  <p className="text-xl font-bold text-accent-500">{formatCurrency(emergencyFund?.targetCorpus || 0)}</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-hover border border-border">
                  <p className="text-xs text-text-secondary font-medium mb-1">Liquid Capital Total</p>
                  <p className="text-xl font-bold text-emerald-500">{formatCurrency(emergencyFund?.currentLiquidAssets || 0)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-8 space-y-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-text-secondary">Runway Coverage</span>
                  <span className="text-accent-500">{(emergencyFund?.progressPercentage || 0).toFixed(1)}% Prepared</span>
                </div>
                <div className="w-full h-4 bg-surface-hover rounded-full overflow-hidden border border-border">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, emergencyFund?.progressPercentage || 0)}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              💡 Liquid assets include instant-access investments (Gold, Mutual Funds, Stocks, and Liquid FDs) accessible within 24-48 hours.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SWP CALCULATOR */}
      {activeTab === 'swp' && (
        <SwpCalculator />
      )}

      {/* TAB 4: RETIREMENT CALCULATOR */}
      {activeTab === 'retirement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-medium text-text-primary">Calculator Parameters</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-text-secondary block mb-1">Current Age: {currentAge}</label>
                <input type="range" min="18" max="70" value={currentAge} onChange={e => setCurrentAge(Number(e.target.value))} className="w-full accent-accent-500 h-2 bg-surface-hover rounded" />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">Retirement Age: {retirementAge}</label>
                <input type="range" min="40" max="75" value={retirementAge} onChange={e => setRetirementAge(Number(e.target.value))} className="w-full accent-accent-500 h-2 bg-surface-hover rounded" />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">Desired Monthly Expense Today (₹)</label>
                <input type="number" value={monthlyExpenseToday} onChange={e => setMonthlyExpenseToday(Number(e.target.value))} className="glass-input text-xs" />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">Expected Investment Return Rate (%): {expectedReturnRate}%</label>
                <input type="range" min="4" max="18" step="0.5" value={expectedReturnRate} onChange={e => setExpectedReturnRate(Number(e.target.value))} className="w-full accent-accent-500 h-2 bg-surface-hover rounded" />
              </div>

              <div>
                <label className="font-semibold text-text-secondary block mb-1">Assumed Inflation Rate (%): {inflationRate}%</label>
                <input type="range" min="3" max="10" step="0.5" value={inflationRate} onChange={e => setInflationRate(Number(e.target.value))} className="w-full accent-accent-500 h-2 bg-surface-hover rounded" />
              </div>

              {/* Custom Net Worth Selection */}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="useCustomNetWorth"
                    checked={useCustomNetWorth}
                    onChange={e => setUseCustomNetWorth(e.target.checked)}
                    className="rounded border-border text-accent-500 focus:ring-accent-500 cursor-pointer"
                  />
                  <label htmlFor="useCustomNetWorth" className="font-semibold text-text-secondary cursor-pointer select-none">
                    Use Custom Net Worth
                  </label>
                </div>
                {useCustomNetWorth ? (
                  <div className="animate-fadeIn">
                    <label className="block text-[10px] font-semibold text-text-secondary mb-1">Custom Net Worth Amount (₹)</label>
                    <input 
                      type="number"
                      value={customNetWorthInput}
                      onChange={e => setCustomNetWorthInput(e.target.value)}
                      placeholder={`e.g. ${Math.round(netWorth)}`}
                      className="glass-input text-xs font-semibold"
                    />
                  </div>
                ) : (
                  <div className="text-[10px] text-text-muted leading-relaxed">
                    Linked to calculated Net Worth: <strong className="text-accent-500">{formatCurrency(netWorth)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-6 h-6 text-accent-500" />
                <h3 className="text-xl font-bold text-text-primary">Retirement Readiness Analysis</h3>
              </div>
              <p className="text-xs text-text-secondary mb-6">Inflation-adjusted corpus projection using the 4% annual withdrawal rule (assumes 25 years of post-retirement coverage).</p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-surface-hover border border-border">
                    <p className="text-xs text-text-secondary font-medium mb-1">Years to Retirement</p>
                    <p className="text-2xl font-bold text-text-primary">{retirementResult.yearsToRetirement} Years</p>
                    <p className="text-[10px] text-text-muted mt-1">Age {currentAge} to Age {retirementAge}.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-hover border border-border">
                    <p className="text-xs text-text-secondary font-medium mb-1">Inflation-Adjusted Monthly Expense</p>
                    <p className="text-2xl font-bold text-accent-500">{formatCurrency(retirementResult.inflationAdjustedMonthlyExpense)}</p>
                    <p className="text-[10px] text-text-muted mt-1">Expense value inflated by {inflationRate}% yearly.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-hover border border-border">
                    <p className="text-xs text-text-secondary font-medium mb-1">Required Corpus (25 Yrs. Retirement)</p>
                    <p className="text-2xl font-bold text-emerald-500">{formatCurrency(retirementResult.requiredRetirementCorpus)}</p>
                    <p className="text-[10px] text-text-muted mt-1">Based on the 4% safe annual withdrawal rule.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-hover border border-border">
                    <p className="text-xs text-text-secondary font-medium mb-1">Projected Net Worth at Age {retirementAge}</p>
                    <p className="text-2xl font-bold text-indigo-500">{formatCurrency(retirementResult.projectedNetWorthAtRetirement)}</p>
                    <p className="text-[10px] text-text-muted mt-1">Compounded return at {expectedReturnRate}% yearly.</p>
                  </div>
                </div>

                {/* Readiness Progress Bar */}
                <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-text-primary">Retirement Readiness Score</span>
                    <span className="text-accent-500">{retirementResult.readinessPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-4 bg-surface-hover rounded-full overflow-hidden border border-border">
                    <div className="h-full bg-accent-500 rounded-full transition-all duration-500" style={{ width: `${retirementResult.readinessPercentage}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border-2 border-accent-500 w-full max-w-md p-6 relative">
            <button onClick={() => setShowGoalModal(false)} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-4">{editingGoal ? 'Edit Goal' : 'Create Financial Goal'}</h2>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Goal Name</label>
                <input type="text" required value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. Retirement, House Purchase" className="glass-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Target Amount (₹)</label>
                <input type="number" required value={goalTargetAmount} onChange={e => setGoalTargetAmount(e.target.value)} placeholder="e.g. 5000000" className="glass-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Target Date (Optional)</label>
                <input type="date" value={goalTargetDate} onChange={e => setGoalTargetDate(e.target.value)} className="glass-input" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Tag Portfolio Assets toward Goal:</label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-surface-hover rounded-lg border border-border">
                  {assets?.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-xs text-text-primary cursor-pointer hover:bg-surface p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={selectedAssetIds.includes(a.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssetIds([...selectedAssetIds, a.id]);
                          } else {
                            setSelectedAssetIds(selectedAssetIds.filter(id => id !== a.id));
                          }
                        }}
                        className="rounded border-border text-accent-500"
                      />
                      <span className="truncate flex-1">{a.name} ({formatCurrency(a.currentValue)})</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full text-xs">Save Goal</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
