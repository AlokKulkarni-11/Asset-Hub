import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getMyFamily, createFamily, inviteMember, acceptInvite, getPendingInvites, getFamilyAssets, getFamilyRollup, leaveFamily, updateFamilyRole, getAuditLogs } from '../api/family.api';
import type { AuditLog } from '../api/family.api';
import { Plus, Users, UserPlus, Loader2, Link, IndianRupee, Mail, LogOut, ChevronDown, CheckCircle2, Circle, Target } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getAllGoals } from '../api/goals.api';

export default function Family() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [createName, setCreateName] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Auto-accept invite if token is in URL
  const tokenFromUrl = searchParams.get('invite_token');

  const { data: family, isLoading: familyLoading } = useQuery({
    queryKey: ['family', 'me'],
    queryFn: getMyFamily,
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: getAllGoals,
    enabled: !!family,
  });

  const { data: familyAssets, isLoading: assetsLoading } = useQuery({
    queryKey: ['family', 'assets'],
    queryFn: getFamilyAssets,
    enabled: !!family,
  });

  const { data: familyRollup } = useQuery({
    queryKey: ['family', 'rollup'],
    queryFn: getFamilyRollup,
    enabled: !!family,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: getAuditLogs,
    enabled: !!family,
  });

  const { data: pendingInvites, isLoading: invitesLoading } = useQuery({
    queryKey: ['family', 'invites'],
    queryFn: getPendingInvites,
    enabled: !family && !familyLoading, // Only fetch invites if not in a family
  });

  const createMutation = useMutation({
    mutationFn: createFamily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'me'] });
      setCreateName('');
    }
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { name: string, email: string }) => inviteMember(data.name, data.email),
    onSuccess: (message) => {
      setInviteName('');
      setInviteEmail('');
      setInviteMessage({ type: 'success', text: message });
    },
    onError: (err: any) => {
      setInviteMessage({ type: 'error', text: err.response?.data || 'Failed to send invitation' });
    }
  });

  const acceptMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['family', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'invites'] });
      
      // Clean up URL if they came from an email link
      if (tokenFromUrl) {
        searchParams.delete('invite_token');
        setSearchParams(searchParams);
      }
      alert(message || 'Successfully joined the family!');
    },
    onError: (err: any) => {
      alert(err.response?.data || 'Failed to accept invitation');
    }
  });

  const leaveMutation = useMutation({
    mutationFn: leaveFamily,
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['family', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'assets'] });
      alert(message);
    },
    onError: (err: any) => {
      alert(err.response?.data || 'Failed to leave family');
    }
  });

  // Handle URL token auto-accept trigger
  useEffect(() => {
    if (tokenFromUrl && !familyLoading && !family) {
      if (window.confirm('You have been invited to join a family. Accept invitation?')) {
        acceptMutation.mutate(tokenFromUrl);
      }
    }
  }, [tokenFromUrl, familyLoading, family]);

  if (familyLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
      </div>
    );
  }

  // --- 1. NOT IN A FAMILY (CREATE / PENDING INVITES) ---
  if (!family) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-heading text-2xl font-dmsans">Family Portfolio</h1>
          <p className="text-text-secondary mt-2">Create a family group or accept an invitation to pool portfolios together.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {/* Create Family */}
          <div className="glass-card p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-accent-500" />
            </div>
            <h2 className="text-xl font-medium mb-2">Create a Family Group</h2>
            <p className="text-text-secondary text-sm mb-6">Start a new family group and invite your spouse or children to track net worth together.</p>
            
            <input 
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="glass-input w-full mb-4 text-center"
              placeholder="E.g. Sharma Family"
            />
            <button 
              onClick={() => createMutation.mutate(createName)}
              disabled={createMutation.isPending || !createName}
              className="btn-primary w-full justify-center"
            >
              {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Family'}
            </button>
          </div>

          {/* Pending Invites */}
          <div className="glass-card p-8 flex flex-col">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-medium mb-2">Pending Invitations</h2>
              <p className="text-text-secondary text-sm">Invitations sent to your email will appear here.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {invitesLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>
              ) : pendingInvites?.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border rounded-lg">
                  No pending invitations.
                </div>
              ) : (
                pendingInvites?.map(invite => (
                  <div key={invite.id} className="bg-surface p-4 rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gold-300">{invite.familyName}</p>
                      <p className="text-xs text-text-secondary">Sent: {new Date(invite.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => acceptMutation.mutate(invite.token)}
                      disabled={acceptMutation.isPending}
                      className="bg-gold-400 text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gold-500 transition-colors"
                    >
                      {acceptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. FAMILY DASHBOARD ---
  const isCreator = family.creatorId === user?.id;
  const isOwner = isCreator || family.currentUserRole === 'OWNER';
  
  const filteredAssets = selectedMemberIds.length === 0 
    ? familyAssets 
    : familyAssets?.filter(a => selectedMemberIds.includes(a.familyMemberId));

  const totalInvested = filteredAssets?.reduce((sum, asset) => sum + (asset.investedAmount || 0), 0) || 0;
  const totalCurrentValue = filteredAssets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const allocationData = filteredAssets?.reduce((acc: any, asset) => {
    const type = asset.assetType;
    const existing = acc.find((item: any) => item.name === type);
    if (existing) {
      existing.value += asset.currentValue;
    } else {
      acc.push({ name: type, value: asset.currentValue });
    }
    return acc;
  }, []) || [];

  const rollupChartData = familyRollup?.memberBreakdown || [];
  const rollupPieData = rollupChartData.map((member: any) => ({
    ...member,
    pieValue: Math.abs(member.netWorth || 0),
  }));

  const sectorAssets = selectedSector ? filteredAssets?.filter(a => a.assetType === selectedSector) : [];
  const sharedGoals = goals?.filter(g => g.shared) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-heading text-2xl font-dmsans">{family.name}</h1>
          
          <div className="relative mt-4 flex items-center">
            <span className="text-text-secondary text-sm mr-3">Filter by Member:</span>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-surface border border-border text-primary rounded-lg py-1.5 px-4 text-sm flex items-center justify-between min-w-[200px] focus:outline-none hover:border-accent-500/50 transition-colors"
            >
              <span>
                {selectedMemberIds.length === 0 
                  ? 'All Members' 
                  : `${selectedMemberIds.length} Selected`}
              </span>
              <ChevronDown className={`w-4 h-4 ml-2 opacity-70 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-[120px] mt-2 w-64 bg-surface-hover border border-border rounded-lg shadow-2xl z-50 py-2">
                <div 
                  className="px-4 py-2 hover:bg-surface-hover cursor-pointer flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setSelectedMemberIds([]);
                    setDropdownOpen(false);
                  }}
                >
                  {selectedMemberIds.length === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-accent-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-muted" />
                  )}
                  <span className="text-sm font-medium">All Members</span>
                </div>
                <div className="h-px bg-border my-1"></div>
                <div className="max-h-60 overflow-y-auto">
                  {family.members.map((m: any) => (
                    <div 
                      key={m.id}
                      className="px-4 py-2 hover:bg-surface-hover cursor-pointer flex items-center gap-3 transition-colors"
                      onClick={() => {
                        if (selectedMemberIds.includes(m.id)) {
                          setSelectedMemberIds(selectedMemberIds.filter(id => id !== m.id));
                        } else {
                          setSelectedMemberIds([...selectedMemberIds, m.id]);
                        }
                      }}
                    >
                      {selectedMemberIds.includes(m.id) ? (
                        <CheckCircle2 className="w-5 h-5 text-accent-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-text-muted" />
                      )}
                      <span className="text-sm">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <p className="text-text-secondary text-sm mb-1">Family Total Net Worth</p>
          <h2 className="networth-amount text-4xl">{formatCurrency(totalCurrentValue)}</h2>
        </div>
        <div className="glass-card p-6">
          <p className="text-text-secondary text-sm mb-1">Family Total Invested</p>
          <h2 className="text-display text-3xl">{formatCurrency(totalInvested)}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-text-primary">Family Rollup</h3>
              <p className="text-xs text-text-secondary mt-1">Per-member asset, liability, and net worth contributions.</p>
            </div>
            <Users className="w-5 h-5 text-accent-500" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-surface-hover border border-border p-3">
              <p className="text-xs text-text-secondary">Assets</p>
              <p className="text-lg font-semibold">{formatCurrency(familyRollup?.totalFamilyAssets || 0)}</p>
            </div>
            <div className="rounded-xl bg-surface-hover border border-border p-3">
              <p className="text-xs text-text-secondary">Liabilities</p>
              <p className="text-lg font-semibold">{formatCurrency(familyRollup?.totalFamilyLiabilities || 0)}</p>
            </div>
            <div className="rounded-xl bg-surface-hover border border-border p-3">
              <p className="text-xs text-text-secondary">Net Worth</p>
              <p className="text-lg font-semibold text-accent-500">{formatCurrency(familyRollup?.totalFamilyNetWorth || 0)}</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rollupPieData}
                  dataKey="pieValue"
                  nameKey="userName"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {rollupChartData.map((entry: any, index: number) => (
                    <Cell key={`rollup-cell-${entry.userId}`} fill={['#0EA5E9', '#10B981', '#F59E0B', '#6366F1', '#EC4899'][index % 5]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-text-primary">Member Comparison</h3>
              <p className="text-xs text-text-secondary mt-1">Net worth bars across family members.</p>
            </div>
            <IndianRupee className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rollupChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" vertical={false} />
                <XAxis dataKey="userName" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
                <Bar dataKey="netWorth" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Shared Family Goals */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-accent-500" />
            <h3 className="text-lg font-medium text-text-primary">Shared Family Goals</h3>
          </div>
          <button
            onClick={() => navigate('/goals')}
            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create / Manage Goals
          </button>
        </div>
        
        {sharedGoals.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border rounded-lg">
            No shared family goals. You can create shared goals from the Goals page.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sharedGoals.map(g => (
              <div key={g.id} className="bg-surface-hover border border-border p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-md font-bold text-text-primary">{g.name}</h4>
                    {g.targetDate && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        Target Date: {new Date(g.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-accent-500 bg-accent-500/10 px-2.5 py-1 rounded-full">
                    {g.progressPercentage.toFixed(1)}% Completed
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-text-secondary">Saved: {formatCurrency(g.currentSavedAmount)}</span>
                    <span className="text-accent-500">Target: {formatCurrency(g.targetAmount)}</span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full bg-accent-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, g.progressPercentage)}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sector Breakdown */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-medium mb-6">Sector-wise Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {allocationData.map((sector: any) => (
              <div 
                key={sector.name} 
                onClick={() => setSelectedSector(selectedSector === sector.name ? null : sector.name)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedSector === sector.name 
                    ? 'border-accent-500 bg-accent-500/10' 
                    : 'border-border bg-surface-hover hover:border-accent-500/50'
                }`}
              >
                <p className="text-sm text-text-secondary mb-1">{sector.name}</p>
                <p className="text-xl font-medium">{formatCurrency(sector.value)}</p>
              </div>
            ))}
          </div>

          {/* Drill Down Sector List */}
          {selectedSector && (
            <div className="mt-6 border-t border-border pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
              <h4 className="text-md font-medium text-accent-600 mb-4">{selectedSector} Assets</h4>
              <div className="space-y-3">
                {sectorAssets?.map((asset: any) => (
                  <div key={asset.id} className="bg-surface-hover border border-border rounded-lg p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-lg">{asset.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-surface-hover text-text-muted px-2 py-0.5 rounded">Owner: {asset.familyMemberName}</span>
                          <span className="text-xs bg-accent-500/10 text-accent-500 px-2 py-0.5 rounded">{asset.assetType.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-accent-500 text-lg">{formatCurrency(asset.currentValue)}</p>
                        <p className="text-xs text-text-secondary">Inv: {formatCurrency(asset.investedAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 pt-3 border-t border-border text-sm">
                      {asset.assetType === 'GOLD' && (
                        <>
                          <div><span className="text-text-muted text-xs block">Weight</span><span>{asset.weightInGrams}g</span></div>
                          <div><span className="text-text-muted text-xs block">Purity</span><span>{asset.purity?.replace('_', ' ')}</span></div>
                        </>
                      )}
                      {asset.assetType === 'FIXED_DEPOSIT' && (
                        <>
                          <div><span className="text-text-muted text-xs block">Bank</span><span>{asset.bankName}</span></div>
                          <div><span className="text-text-muted text-xs block">Interest Rate</span><span>{asset.interestRate}%</span></div>
                          <div><span className="text-text-muted text-xs block">Maturity Date</span><span>{asset.maturityDate ? new Date(asset.maturityDate).toLocaleDateString() : '-'}</span></div>
                        </>
                      )}
                      {asset.assetType === 'STOCK' && (
                        <>
                          <div><span className="text-text-muted text-xs block">Ticker</span><span>{asset.ticker}</span></div>
                          <div><span className="text-text-muted text-xs block">Quantity</span><span>{asset.quantity}</span></div>
                          <div><span className="text-text-muted text-xs block">Avg Price</span><span>{formatCurrency(asset.averagePrice)}</span></div>
                        </>
                      )}
                      {asset.assetType === 'MUTUAL_FUND' && (
                        <>
                          <div><span className="text-text-muted text-xs block">Scheme Code</span><span>{asset.schemeCode}</span></div>
                          <div><span className="text-text-muted text-xs block">Units</span><span>{asset.units}</span></div>
                          <div><span className="text-text-muted text-xs block">Avg Buy NAV</span><span>₹{asset.averageNav}</span></div>
                        </>
                      )}
                      {asset.assetType === 'REAL_ESTATE' && (
                        <>
                          <div><span className="text-text-muted text-xs block">Type</span><span>{asset.propertyType}</span></div>
                        </>
                      )}
                      <div>
                        <span className="text-text-muted text-xs block">Returns</span>
                        <span className={asset.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {asset.gainLoss >= 0 ? '+' : ''}{formatCurrency(asset.gainLoss)} ({asset.gainPercent?.toFixed(2)}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted text-xs block">Purchase Date</span>
                        <span>{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Member Management */}
        <div className="glass-card p-6 flex flex-col h-full">
          <h3 className="text-lg font-medium mb-4 flex items-center justify-between">
            <span>Members ({family.members.length})</span>
          </h3>

          <div className="space-y-3 flex-1 mb-6">
            {family.members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-surface-hover border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-text-muted">{member.email}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">Role: <span className="font-semibold uppercase text-accent-500">{member.familyRole || 'EDITOR'}</span></p>
                </div>
                {member.id === user?.id ? (
                  <span className="text-[10px] uppercase tracking-wider bg-accent-500/10 text-accent-500 px-2 py-1 rounded font-semibold">
                    {member.familyRole || (isCreator ? 'OWNER' : 'EDITOR')} (You)
                  </span>
                ) : isOwner ? (
                  <select
                    value={member.familyRole || 'EDITOR'}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      try {
                        await updateFamilyRole(member.id, newRole);
                        queryClient.invalidateQueries({ queryKey: ['family', 'me'] });
                        alert('Role updated successfully.');
                      } catch (err) {
                        alert('Failed to update role.');
                      }
                    }}
                    className="bg-surface border border-border text-text-primary rounded px-2 py-1 text-xs focus:outline-none hover:border-accent-500/50"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider bg-surface-hover border border-border text-text-secondary px-2 py-1 rounded">
                    {member.familyRole || 'EDITOR'}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto">
            {isCreator && (
              <div className="pt-4 border-t border-border mb-4">
                <h4 className="text-sm font-medium mb-1">Invite Member via Email</h4>
                <p className="text-xs text-text-secondary mb-3">An email invitation will be sent to them with a link to join.</p>
                <div className="space-y-2">
                  <input 
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="glass-input w-full text-sm py-2 px-3"
                    placeholder="Their Name"
                  />
                  <input 
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="glass-input w-full text-sm py-2 px-3"
                    placeholder="Their Email Address"
                  />
                  <button 
                    onClick={() => inviteMutation.mutate({ name: inviteName, email: inviteEmail })}
                    disabled={inviteMutation.isPending || !inviteEmail || !inviteName}
                    className="btn-primary w-full py-2 px-3 justify-center mt-2"
                  >
                    {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                      <><Mail className="w-4 h-4" /> Send Email Invitation</>}
                  </button>
                  {inviteMessage && (
                    <div className={`mt-3 p-3 rounded-lg text-sm border ${inviteMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {inviteMessage.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to leave this family group? You will lose access to the pooled dashboard.')) {
                    leaveMutation.mutate();
                  }
                }}
                disabled={leaveMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors border border-red-400/20"
              >
                {leaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Leave Family Group
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Family Audit Trail */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-text-primary">
          <Users className="w-5 h-5 text-accent-500" />
          Family Audit Trail
        </h3>
        
        {!auditLogs || auditLogs.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-sm border border-dashed border-border rounded-lg">
            No activities logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg max-h-[300px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-hover border-b border-border text-text-secondary font-medium">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface-main">
                {auditLogs.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-surface-hover/50 text-text-secondary">
                    <td className="p-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="p-3">
                      <p className="font-semibold text-text-primary">{log.userName}</p>
                      <p className="text-[10px] opacity-75">{log.userEmail}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.startsWith('ADD') ? 'bg-emerald-500/10 text-emerald-400' :
                        log.action.startsWith('UPDATE') ? 'bg-blue-500/10 text-blue-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold">{log.targetType}</td>
                    <td className="p-3 max-w-xs truncate" title={log.details}>{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
