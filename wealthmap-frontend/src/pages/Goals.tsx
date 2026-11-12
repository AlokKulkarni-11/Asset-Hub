// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllGoals, createGoal, updateGoal, deleteGoal } from '../api/goals.api';
import type { GoalResponse } from '../api/goals.api';
import { getEmergencyFund, saveEmergencyFund } from '../api/planning.api';
import { getAllAssets } from '../api/assets.api';
import { getAllLiabilities } from '../api/liabilities.api';
import { Target, Plus, ShieldCheck, Calendar, TrendingUp, Trash2, Edit2, CheckCircle2, ChevronRight, AlertCircle, X, Loader2 } from 'lucide-react';
import Maturities from './Maturities';
import GoalWealthPlanner from '../components/calculators/GoalWealthPlanner';
import { getMyFamily, getFamilyAssets } from '../api/family.api';

type GoalsTab = 'goals' | 'planner' | 'emergency' | 'maturities';
const VALID_GOALS_TABS: GoalsTab[] = ['goals', 'planner', 'emergency', 'maturities'];

export default function Goals() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as GoalsTab | null;

  const [activeTab, setActiveTab] = useState<GoalsTab>(
    tabParam && VALID_GOALS_TABS.includes(tabParam) ? tabParam : 'goals'
  );

  useEffect(() => {
    if (tabParam && VALID_GOALS_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tab: GoalsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Modal States
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalResponse | null>(null);

  // Form States for Goal
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalNotes, setGoalNotes] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([]);
  const [goalShared, setGoalShared] = useState(false);

  // Emergency Fund Form State
  const [monthlyExpenseInput, setMonthlyExpenseInput] = useState('');
  const [targetMonthsInput, setTargetMonthsInput] = useState('6');

  // Queries
  const { data: family } = useQuery({
    queryKey: ['family', 'me'],
    queryFn: getMyFamily,
  });

  const { data: familyAssets } = useQuery({
    queryKey: ['family', 'assets'],
    queryFn: getFamilyAssets,
    enabled: !!family,
  });

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
      setGoalShared(goal.shared || false);
    } else {
      setEditingGoal(null);
      setGoalName('');
      setGoalTargetAmount('');
      setGoalTargetDate('');
      setGoalNotes('');
      setSelectedAssetIds([]);
      setGoalShared(false);
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
      taggedAssetIds: selectedAssetIds,
      shared: goalShared
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


  return (
    <div className="space-y-6">
      
      {/* Page Title & Hero Net Worth Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-heading text-2xl font-dmsans">Goals & Financial Planning</h1>
          <p className="text-text-secondary text-sm">Target corpus tracking, emergency preparedness, and upcoming maturities.</p>
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
            onClick={() => handleTabChange('goals')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'goals' ? 'bg-surface shadow-sm border border-border text-accent-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Target className="w-4 h-4" />
            Goals
          </button>
          <button 
            onClick={() => handleTabChange('planner')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'planner' ? 'bg-surface shadow-sm border border-border text-accent-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <TrendingUp className="w-4 h-4" />
            Wealth Planner
          </button>
          <button 
            onClick={() => handleTabChange('emergency')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'emergency' ? 'bg-surface shadow-sm border border-border text-accent-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <ShieldCheck className="w-4 h-4" />
            Emergency Fund
          </button>

          <button 
            onClick={() => handleTabChange('maturities')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'maturities' ? 'bg-surface shadow-sm border border-border text-accent-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Calendar className="w-4 h-4" />
            Upcoming Maturities
          </button>
        </div>
      </div>

      {/* TAB 1: GOAL-LINKED PORTFOLIOS */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-text-primary">Financial Target Goals</h2>
            {family?.currentUserRole !== 'VIEWER' && (
              <button 
                onClick={() => openGoalModal()}
                className="btn-primary text-xs"
              >
                <Plus className="w-4 h-4" /> Add Goal
              </button>
            )}
          </div>

          {goalsLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-accent-500" /></div>
          ) : goals?.length === 0 ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <Target className="w-12 h-12 text-accent-500 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Financial Goals Defined</h3>
              <p className="text-text-secondary text-sm mb-4">Set milestone goals like "House Purchase" or "Education" and tag assets to track progress.</p>
              {family?.currentUserRole !== 'VIEWER' && (
                <button onClick={() => openGoalModal()} className="btn-primary text-xs"><Plus className="w-4 h-4" /> Create First Goal</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals?.map(g => (
                <div key={g.id} className="glass-card p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold text-text-primary">{g.name}</h3>
                          {g.shared && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              Shared
                            </span>
                          )}
                        </div>
                        {g.targetDate && (
                          <p className="text-xs text-text-secondary mt-1">Target Date: {new Date(g.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                        )}
                      </div>
                      {family?.currentUserRole !== 'VIEWER' && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => openGoalModal(g)} className="p-1 text-text-secondary hover:text-text-primary"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteGoal(g.id)} className="p-1 text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
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
                        const asset = (familyAssets || assets)?.find(a => a.id === aid);
                        return asset ? (
                          <span key={aid} className="text-xs px-2 py-1 bg-accent-500/10 border border-accent-500/20 text-accent-500 rounded-md font-medium">
                            {asset.name} {asset.familyMemberName ? `(${asset.familyMemberName})` : ''} ({formatCurrency(asset.currentValue)})
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

            <div className="mt-6 p-3.5 rounded-lg bg-zinc-50 border border-border text-xs text-text-secondary">
              Liquid assets include instant-access investments (Gold, Mutual Funds, Stocks, and Liquid FDs) accessible within 24–48 hours.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UPCOMING MATURITIES */}
      {activeTab === 'maturities' && (
        <Maturities embedded />
      )}

      {/* TAB 4: GOAL-BASED WEALTH PLANNER */}
      {activeTab === 'planner' && (
        <GoalWealthPlanner
          initialCorpus={
            goals && goals.length > 0
              ? goals.reduce((sum, g) => sum + (g.currentSavedAmount || 0), 0)
              : Math.max(0, netWorth)
          }
          initialGoals={
            goals && goals.length > 0
              ? goals.map((g) => {
                  const yrs = g.targetDate
                    ? Math.max(
                        1,
                        Math.round(
                          (new Date(g.targetDate).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24 * 365.25)
                        )
                      )
                    : 10;
                  return {
                    name: g.name,
                    currentCost: g.targetAmount || 1000000,
                    years: yrs,
                  };
                })
              : undefined
          }
        />
      )}

      {/* CREATE/EDIT GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 relative">
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
                  {(familyAssets || assets)?.map(a => (
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
                      <span className="truncate flex-1">{a.name} {a.familyMemberName ? `(${a.familyMemberName})` : ''} ({formatCurrency(a.currentValue)})</span>
                    </label>
                  ))}
                </div>
              </div>

              {family && (
                <div className="flex items-center gap-2 py-1.5 border-t border-border">
                  <input 
                    type="checkbox" 
                    id="goalShared"
                    checked={goalShared}
                    onChange={e => setGoalShared(e.target.checked)}
                    className="rounded border-border text-accent-500 focus:ring-accent-500 cursor-pointer"
                  />
                  <label htmlFor="goalShared" className="text-xs font-semibold text-text-secondary cursor-pointer select-none">
                    Shared Family Goal
                  </label>
                </div>
              )}

              <button type="submit" className="btn-primary w-full text-xs">Save Goal</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
