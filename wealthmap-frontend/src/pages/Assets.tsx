import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Coins, Landmark, TrendingUp, MoreVertical, Edit2, Trash2, ChevronDown, ChevronUp, Briefcase, Building2 } from 'lucide-react';
import { getAllAssets, deleteAsset } from '../api/assets.api';
import type { AssetResponse } from '../api/assets.api';
import AssetSelectorModal from '../components/forms/AssetSelectorModal';
import AddGoldForm from '../components/forms/AddGoldForm';
import AddFDForm from '../components/forms/AddFDForm';
import AddStockForm from '../components/forms/AddStockForm';
import AddMutualFundForm from '../components/forms/AddMutualFundForm';
import AddRealEstateForm from '../components/forms/AddRealEstateForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function Assets() {
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [editingAsset, setEditingAsset] = useState<AssetResponse | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);
  
  // 3-Level Accordion State
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubGroup, setExpandedSubGroup] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data: allAssets, isLoading } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets,
  });

  const confirmDelete = async () => {
    if (assetToDelete) {
      try {
        await deleteAsset(assetToDelete);
        queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      } catch (err) {
        alert('Failed to delete asset');
      }
      setAssetToDelete(null);
    }
  };

  const getSubGroupName = (asset: any) => {
    if (asset.assetType === 'GOLD') return asset.purity ? asset.purity.replace(/_/g, ' ') : 'Other Gold';
    if (asset.assetType === 'STOCK') return asset.ticker || 'Other Stocks';
    if (asset.assetType === 'FIXED_DEPOSIT') return asset.bankName || 'Other Banks';
    if (asset.assetType === 'MUTUAL_FUND') return asset.schemeName || 'Other Mutual Funds';
    if (asset.assetType === 'REAL_ESTATE') return asset.propertyType || 'Other Real Estate';
    return 'Other';
  };

  const groupedAssets = allAssets?.reduce((acc: any, asset) => {
    if (!acc[asset.assetType]) {
      acc[asset.assetType] = {
        totalInvested: 0,
        totalCurrentValue: 0,
        subGroups: {}
      };
    }
    
    // Category Totals
    acc[asset.assetType].totalInvested += asset.investedAmount || 0;
    acc[asset.assetType].totalCurrentValue += asset.currentValue || 0;
    
    const subName = getSubGroupName(asset);
    if (!acc[asset.assetType].subGroups[subName]) {
      acc[asset.assetType].subGroups[subName] = {
        totalInvested: 0,
        totalCurrentValue: 0,
        assets: []
      };
    }
    
    // SubGroup Totals
    acc[asset.assetType].subGroups[subName].totalInvested += asset.investedAmount || 0;
    acc[asset.assetType].subGroups[subName].totalCurrentValue += asset.currentValue || 0;
    acc[asset.assetType].subGroups[subName].assets.push(asset);
    
    return acc;
  }, {}) || {};

  const getCategoryIcon = (type: string) => {
    if (type === 'FIXED_DEPOSIT') return <Landmark className="w-8 h-8 text-accent-500" />;
    if (type === 'STOCK') return <TrendingUp className="w-8 h-8 text-accent-500" />;
    if (type === 'MUTUAL_FUND') return <Briefcase className="w-8 h-8 text-accent-500" />;
    if (type === 'REAL_ESTATE') return <Building2 className="w-8 h-8 text-accent-500" />;
    return <Coins className="w-8 h-8 text-accent-500" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const handleCategoryClick = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
      setExpandedSubGroup(null);
    } else {
      setExpandedCategory(category);
      setExpandedSubGroup(null); // Reset subgroup when opening new category
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading">Your Assets</h1>
        <button 
          onClick={() => setShowGoldModal(true)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
      </div>

      {showGoldModal && (
        <AssetSelectorModal onClose={() => setShowGoldModal(false)} />
      )}

      {editingAsset?.assetType === 'GOLD' && (
        <AddGoldForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'FIXED_DEPOSIT' && (
        <AddFDForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'STOCK' && (
        <AddStockForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'MUTUAL_FUND' && (
        <AddMutualFundForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'REAL_ESTATE' && (
        <AddRealEstateForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
      )}

      {/* Grouped Assets List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-text-muted">Loading assets...</div>
        ) : Object.keys(groupedAssets).length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
            <Coins className="w-12 h-12 text-accent-500 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Assets Found</h3>
            <p className="text-text-secondary">Start tracking your wealth by adding your first asset.</p>
          </div>
        ) : (
          Object.entries(groupedAssets).map(([category, data]: [string, any]) => {
            const gainLoss = data.totalCurrentValue - data.totalInvested;
            const gainPercent = data.totalInvested > 0 ? (gainLoss / data.totalInvested) * 100 : 0;
            const isCategoryExpanded = expandedCategory === category;
            const displayName = category.toLowerCase().replace('_', ' ');

            // Calculate total assets in category
            const totalAssetsInCat = Object.values(data.subGroups).reduce((sum: number, sg: any) => sum + sg.assets.length, 0);

            return (
              <div key={category} className="glass-card overflow-hidden">
                {/* Level 1: Category Header Bar */}
                <div 
                  className={`p-6 flex flex-col sm:flex-row items-center justify-between cursor-pointer transition-colors ${isCategoryExpanded ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                    <div className="w-14 h-14 rounded-full bg-accent-500/10 flex items-center justify-center shrink-0">
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-medium capitalize tracking-wide">{displayName}</h2>
                      <p className="text-text-secondary text-sm">{totalAssetsInCat} Assets</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-text-secondary text-sm">Total Current Value</p>
                      <p className="text-xl font-medium text-accent-500">{formatCurrency(data.totalCurrentValue)}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-text-secondary text-sm">Total Invested</p>
                      <p className="text-lg">{formatCurrency(data.totalInvested)}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-text-secondary text-sm">Overall Returns</p>
                      <p className={`font-medium ${gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainPercent.toFixed(2)}%)
                      </p>
                    </div>
                    {isCategoryExpanded ? <ChevronUp className="w-6 h-6 text-text-secondary shrink-0" /> : <ChevronDown className="w-6 h-6 text-text-secondary shrink-0" />}
                  </div>
                </div>

                {/* Level 2: SubGroups */}
                {isCategoryExpanded && (
                  <div className="border-t border-border bg-surface-hover">
                    {Object.entries(data.subGroups).map(([subName, subData]: [string, any]) => {
                      const subGainLoss = subData.totalCurrentValue - subData.totalInvested;
                      const subGainPercent = subData.totalInvested > 0 ? (subGainLoss / subData.totalInvested) * 100 : 0;
                      const isSubExpanded = expandedSubGroup === `${category}-${subName}`;
                      
                      return (
                        <div key={subName} className="border-b border-white/5 last:border-0">
                          {/* SubGroup Header */}
                          <div 
                            className={`px-8 py-4 flex items-center justify-between cursor-pointer transition-colors ${isSubExpanded ? 'bg-accent-500/10 border-l-2 border-accent-500' : 'hover:bg-surface border-l-2 border-transparent'}`}
                            onClick={() => setExpandedSubGroup(isSubExpanded ? null : `${category}-${subName}`)}
                          >
                            <div>
                              <h3 className="text-lg font-medium text-gold-300">{subName}</h3>
                              <p className="text-text-secondary text-xs">{subData.assets.length} Items</p>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-accent-500 font-medium">{formatCurrency(subData.totalCurrentValue)}</p>
                                <p className="text-text-secondary text-xs">Inv: {formatCurrency(subData.totalInvested)}</p>
                              </div>
                              {isSubExpanded ? <ChevronUp className="w-5 h-5 text-text-secondary" /> : <ChevronDown className="w-5 h-5 text-text-secondary" />}
                            </div>
                          </div>
                          
                          {/* Level 3: Individual Assets (Drop-down / Scroll-down) */}
                          {isSubExpanded && (
                            <div className="px-8 py-6 bg-surface-hover">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
                                {subData.assets.map((asset: AssetResponse) => (
                                  <div key={asset.id} className="bg-surface p-5 rounded-xl border border-border hover:border-accent-500/50 transition-colors shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <h3 className="font-medium text-lg leading-tight">{asset.name}</h3>
                                        <p className="text-text-secondary text-sm">Owner: {asset.familyMemberName || `ID ${asset.familyMemberId}`}</p>
                                      </div>
                                      
                                      <div className="relative">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === asset.id ? null : asset.id);
                                          }}
                                          className="p-1 hover:bg-surface-hover rounded text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                          <MoreVertical className="w-5 h-5" />
                                        </button>
                                        
                                        {menuOpenId === asset.id && (
                                          <div className="absolute right-0 mt-1 w-36 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-10">
                                            <button 
                                              onClick={() => {
                                                setMenuOpenId(null);
                                                setEditingAsset(asset);
                                              }}
                                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-surface-hover"
                                            >
                                              <Edit2 className="w-4 h-4" />
                                              Edit
                                            </button>
                                            <button 
                                              onClick={() => {
                                                setMenuOpenId(null);
                                                setAssetToDelete(asset.id);
                                              }}
                                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-red-400 hover:bg-red-400/10"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                              Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-2 mt-4">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Invested:</span>
                                        <span className="font-medium">{formatCurrency(asset.investedAmount)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">Current Value:</span>
                                        <span className="font-medium text-gold-300">{formatCurrency(asset.currentValue)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm pt-2 border-t border-border">
                                        <span className="text-text-secondary">Gain/Loss:</span>
                                        <span className={`font-medium ${asset.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                          {asset.gainLoss >= 0 ? '+' : ''}{formatCurrency(asset.gainLoss)} ({asset.gainPercent?.toFixed(2)}%)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog 
        isOpen={!!assetToDelete}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone and will affect your portfolio calculations."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setAssetToDelete(null)}
      />
    </div>
  );
}
