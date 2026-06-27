import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyFamily, createFamily, joinFamily, addMember, getFamilyAssets } from '../api/family.api';
import { Plus, Users, UserPlus, Loader2, Link, DollarSign } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { useAuthStore } from '../store/authStore';

const COLORS = ['#D4A843', '#34D399', '#3B82F6', '#F87171', '#A78BFA'];

export default function Family() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  const { data: family, isLoading: familyLoading } = useQuery({
    queryKey: ['family', 'me'],
    queryFn: getMyFamily,
  });

  const { data: familyAssets, isLoading: assetsLoading } = useQuery({
    queryKey: ['family', 'assets'],
    queryFn: getFamilyAssets,
    enabled: !!family,
  });

  const createMutation = useMutation({
    mutationFn: createFamily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'me'] });
      setCreateName('');
    }
  });

  const joinMutation = useMutation({
    mutationFn: joinFamily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'me'] });
      setJoinCode('');
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: addMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['family', 'assets'] });
      setInviteEmail('');
      alert('Member successfully added to your family!');
    },
    onError: (err: any) => {
      alert(err.response?.data || 'Failed to add member');
    }
  });

  if (familyLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    );
  }

  // --- 1. NOT IN A FAMILY (CREATE / JOIN) ---
  if (!family) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-heading text-2xl font-dmsans">Family Portfolio</h1>
          <p className="text-text-secondary mt-2">Join a family group to pool your portfolios together.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {/* Create Family */}
          <div className="glass-card p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gold-400/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gold-400" />
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

          {/* Join Family */}
          <div className="glass-card p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-navy-900 border border-white/10 flex items-center justify-center mb-4">
              <Link className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-medium mb-2">Join existing Family</h2>
            <p className="text-text-secondary text-sm mb-6">Enter the 6-digit invite code provided by your family creator.</p>
            
            <input 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="glass-input w-full mb-4 text-center tracking-[0.5em] font-mono text-lg uppercase"
              placeholder="XXXXXX"
              maxLength={6}
            />
            <button 
              onClick={() => joinMutation.mutate(joinCode)}
              disabled={joinMutation.isPending || joinCode.length < 6}
              className="btn-primary w-full justify-center"
            >
              {joinMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Family'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. FAMILY DASHBOARD ---
  const isCreator = family.creatorId === user?.id;
  const totalInvested = familyAssets?.reduce((sum, asset) => sum + (asset.investedAmount || 0), 0) || 0;
  const totalCurrentValue = familyAssets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const allocationData = familyAssets?.reduce((acc: any, asset) => {
    const type = asset.assetType;
    const existing = acc.find((item: any) => item.name === type);
    if (existing) {
      existing.value += asset.currentValue;
    } else {
      acc.push({ name: type, value: asset.currentValue });
    }
    return acc;
  }, []) || [];

  const sectorAssets = selectedSector ? familyAssets?.filter(a => a.assetType === selectedSector) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading text-2xl font-dmsans">{family.name}</h1>
          <p className="text-text-secondary text-sm mt-1">
            Pooled Dashboard • Invite Code: <span className="text-gold-400 font-mono tracking-wider ml-1">{family.inviteCode}</span>
          </p>
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
          <h2 className="text-display text-3xl text-white">{formatCurrency(totalInvested)}</h2>
        </div>
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
                    ? 'border-gold-400 bg-gold-400/5' 
                    : 'border-white/5 bg-navy-900/50 hover:border-white/20'
                }`}
              >
                <p className="text-sm text-text-secondary mb-1">{sector.name}</p>
                <p className="text-xl font-medium">{formatCurrency(sector.value)}</p>
              </div>
            ))}
          </div>

          {/* Drill Down Sector List */}
          {selectedSector && (
            <div className="mt-6 border-t border-white/5 pt-6 animate-in slide-in-from-top-4 fade-in duration-300">
              <h4 className="text-md font-medium text-gold-300 mb-4">{selectedSector} Assets</h4>
              <div className="space-y-3">
                {sectorAssets?.map((asset: any) => (
                  <div key={asset.id} className="bg-navy-900 border border-white/5 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-navy-800 text-text-muted px-2 py-0.5 rounded">Owner: {asset.familyMemberName}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gold-400">{formatCurrency(asset.currentValue)}</p>
                      <p className="text-xs text-text-secondary">Inv: {formatCurrency(asset.investedAmount)}</p>
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
              <div key={member.id} className="flex items-center justify-between p-3 bg-navy-900 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-text-muted">{member.email}</p>
                </div>
                {member.id === family.creatorId && (
                  <span className="text-[10px] uppercase tracking-wider bg-gold-400/20 text-gold-400 px-2 py-1 rounded">Admin</span>
                )}
              </div>
            ))}
          </div>

          {isCreator && (
            <div className="pt-4 border-t border-white/10 mt-auto">
              <p className="text-xs text-text-secondary mb-2">Directly add registered user</p>
              <div className="flex gap-2">
                <input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="glass-input flex-1 text-sm py-2 px-3"
                  placeholder="user@email.com"
                />
                <button 
                  onClick={() => addMemberMutation.mutate(inviteEmail)}
                  disabled={addMemberMutation.isPending || !inviteEmail}
                  className="btn-primary py-2 px-3"
                >
                  {addMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
