import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Coins, Landmark, TrendingUp, MoreVertical, Edit2, Trash2, ChevronDown, ChevronUp, Briefcase, Building2, Download, HardDrive, Sparkles, ScrollText, X } from 'lucide-react';
import { getAllAssets, deleteAsset } from '../api/assets.api';
import type { AssetResponse } from '../api/assets.api';
import { getAnalyticsSummary } from '../api/analytics.api';
import { getMyFamily } from '../api/family.api';
import AssetSelectorModal from '../components/forms/AssetSelectorModal';
import AddGoldForm from '../components/forms/AddGoldForm';
import AddSilverForm from '../components/forms/AddSilverForm';
import AddFDForm from '../components/forms/AddFDForm';
import AddStockForm from '../components/forms/AddStockForm';
import AddMutualFundForm from '../components/forms/AddMutualFundForm';
import AddRealEstateForm from '../components/forms/AddRealEstateForm';
import AddCryptoForm from '../components/forms/AddCryptoForm';
import AddBondForm from '../components/forms/AddBondForm';
import AddEsopRsuForm from '../components/forms/AddEsopRsuForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExportModal from '../components/forms/ExportModal';
import { DocumentVaultModal } from '../components/documents/DocumentVaultModal';
import GoldPriceCalculator from '../components/calculators/GoldPriceCalculator';
import SilverPriceCalculator from '../components/calculators/SilverPriceCalculator';
import GoldProfitCalculator from '../components/calculators/GoldProfitCalculator';

type MetalsToolTab = 'gold-price' | 'silver-price' | 'gold-profit';

export default function Assets() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showGoldModal, setShowGoldModal] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [editingAsset, setEditingAsset] = useState<AssetResponse | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<number | null>(null);
  const [selectedAssetForDocs, setSelectedAssetForDocs] = useState<{ id?: number; name?: string; type?: string } | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [metalsToolTab, setMetalsToolTab] = useState<MetalsToolTab | null>(() => {
    const param = searchParams.get('metals') as MetalsToolTab | null;
    return param && ['gold-price', 'silver-price', 'gold-profit'].includes(param) ? param : null;
  });

  useEffect(() => {
    const param = searchParams.get('metals') as MetalsToolTab | null;
    if (param && ['gold-price', 'silver-price', 'gold-profit'].includes(param)) {
      setMetalsToolTab(param);
    }
  }, [searchParams]);

  const closeMetalsModal = () => {
    setMetalsToolTab(null);
    if (searchParams.has('metals')) {
      searchParams.delete('metals');
      setSearchParams(searchParams, { replace: true });
    }
  };
  
  // 3-Level Accordion State
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubGroup, setExpandedSubGroup] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (location.state?.parsedAsset) {
      const parsed = location.state.parsedAsset;
      const type = (parsed.assetType || '').toUpperCase();
      const fields = parsed.fields || {};
      setEditingAsset({
        ...parsed,
        ...fields,
        assetType: type,
        investedAmount: fields.purchasePrice || fields.principalAmount || fields.investedAmount || parsed.purchasePrice || 0,
        currentValue: fields.estimatedCurrentValue || fields.currentValue || fields.purchasePrice || parsed.currentValue || parsed.purchasePrice || 0,
      } as unknown as AssetResponse);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const { data: family } = useQuery({
    queryKey: ['family', 'me'],
    queryFn: getMyFamily,
  });

  const { data: allAssets, isLoading } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: getAnalyticsSummary,
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
    if (asset.assetType === 'SILVER') return asset.purity ? asset.purity.replace(/_/g, ' ') : 'Other Silver';
    if (asset.assetType === 'STOCK') return asset.ticker || 'Other Stocks';
    if (asset.assetType === 'FIXED_DEPOSIT') return asset.bankName || 'Other Banks';
    if (asset.assetType === 'MUTUAL_FUND') return asset.schemeName || 'Other Mutual Funds';
    if (asset.assetType === 'REAL_ESTATE') return asset.propertyType || 'Other Real Estate';
    if (asset.assetType === 'CRYPTOCURRENCY') return asset.symbol ? asset.symbol.toUpperCase() : 'Other Cryptos';
    if (asset.assetType === 'BOND') return asset.bondType ? asset.bondType.replace(/_/g, ' ') : (asset.issuer || 'Other Bonds');
    if (asset.assetType === 'ESOP_RSU') return asset.companyName || (asset.planType || 'Other Equity Grants');
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
    if (type === 'BOND') return <ScrollText className="w-8 h-8 text-accent-500" />;
    if (type === 'ESOP_RSU') return <Sparkles className="w-8 h-8 text-indigo-400" />;
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

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'AED': return 'AED ';
      case 'SGD': return 'S$';
      case 'CAD': return 'CA$';
      case 'AUD': return 'A$';
      case 'JPY': return '¥';
      case 'CHF': return 'CHF ';
      default: return '₹';
    }
  };

  const formatOriginalCurrency = (value?: number, currency?: string) => {
    if (value === undefined || value === null) return '';
    const sym = getCurrencySymbol(currency);
    return `${sym}${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading">Your Assets</h1>
          <p className="text-text-secondary text-xs mt-0.5">Track and manage your diverse portfolio of holdings</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setMetalsToolTab('gold-price')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium transition-all shadow-sm"
          >
            <Coins className="w-4 h-4" />
            Gold &amp; Silver Tools
          </button>
          <button 
            onClick={() => setIsVaultOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border hover:bg-surface-hover text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-all shadow-sm"
          >
            <HardDrive className="w-4 h-4" />
            Document Vault
          </button>
          <button 
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary text-sm font-medium transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-sky-500" />
            Export
          </button>
          {family?.currentUserRole !== 'VIEWER' && (
            <button 
              onClick={() => setShowGoldModal(true)}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Add Asset
            </button>
          )}
        </div>
      </div>

      {showGoldModal && (
        <AssetSelectorModal onClose={() => setShowGoldModal(false)} />
      )}

      {/* Gold & Silver Price Tracker / Profit Analyzer Modal */}
      {metalsToolTab && (
        <div className="fixed inset-0 bg-zinc-950/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-surface-hover/50">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-text-primary">
                  Gold &amp; Silver Tracker &amp; Profit Analyzer
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1 p-1 bg-surface-hover rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setMetalsToolTab('gold-price')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      metalsToolTab === 'gold-price'
                        ? 'bg-surface shadow-sm border border-border text-amber-500'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Live Gold Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetalsToolTab('silver-price')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      metalsToolTab === 'silver-price'
                        ? 'bg-surface shadow-sm border border-border text-accent-500'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Live Silver Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetalsToolTab('gold-profit')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      metalsToolTab === 'gold-profit'
                        ? 'bg-surface shadow-sm border border-border text-emerald-500'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Gold Profit Analyzer
                  </button>
                </div>
                <button
                  type="button"
                  onClick={closeMetalsModal}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {metalsToolTab === 'gold-price' && <GoldPriceCalculator />}
              {metalsToolTab === 'silver-price' && <SilverPriceCalculator />}
              {metalsToolTab === 'gold-profit' && <GoldProfitCalculator />}
            </div>
          </div>
        </div>
      )}

      {editingAsset?.assetType === 'GOLD' && (
        <AddGoldForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'SILVER' && (
        <AddSilverForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'FIXED_DEPOSIT' && (
        <AddFDForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'BOND' && (
        <AddBondForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'ESOP_RSU' && (
        <AddEsopRsuForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
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
      {editingAsset?.assetType === 'CRYPTOCURRENCY' && (
        <AddCryptoForm initialData={editingAsset} onClose={() => setEditingAsset(null)} />
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
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-medium text-lg leading-tight">{asset.name}</h3>
                                          {asset.currency && asset.currency !== 'INR' && (
                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                              {asset.currency}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-text-secondary text-sm">Owner: {asset.familyMemberName || `ID ${asset.familyMemberId}`}</p>
                                      </div>
                                      
                                      {family?.currentUserRole !== 'VIEWER' && (
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
                                                  setSelectedAssetForDocs({ id: asset.id, name: asset.name, type: asset.assetType });
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-surface-hover text-indigo-600"
                                              >
                                                <HardDrive className="w-4 h-4" />
                                                Documents
                                              </button>
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
                                      )}
                                    </div>
                                    
                                    <div className="space-y-2 mt-4">
                                      {asset.currency && asset.currency !== 'INR' && (
                                        <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-2.5 text-xs space-y-1 mb-2">
                                          <div className="flex justify-between text-sky-200">
                                            <span>Original Value ({asset.currency}):</span>
                                            <span className="font-semibold">{formatOriginalCurrency(asset.originalCurrentValue, asset.currency)}</span>
                                          </div>
                                          <div className="flex justify-between text-sky-200/80">
                                            <span>Original Invested:</span>
                                            <span>{formatOriginalCurrency(asset.originalInvestedAmount, asset.currency)}</span>
                                          </div>
                                          {asset.exchangeRate && (
                                            <div className="flex justify-between text-[11px] text-sky-300/70 pt-1 border-t border-sky-500/10">
                                              <span>Live FX Rate:</span>
                                              <span>1 {asset.currency} = ₹{asset.exchangeRate.toFixed(2)}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">{asset.currency && asset.currency !== 'INR' ? 'Converted Invested (₹):' : 'Invested:'}</span>
                                        <span className="font-medium">{formatCurrency(asset.investedAmount)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-text-secondary">{asset.currency && asset.currency !== 'INR' ? 'Converted Value (₹):' : 'Current Value:'}</span>
                                        <span className="font-medium text-gold-300">{formatCurrency(asset.currentValue)}</span>
                                      </div>
                                      {/* Specific details for ESOPs / RSUs */}
                                      {asset.assetType === 'ESOP_RSU' && (
                                        <div className="pt-2 border-t border-border/50 space-y-1.5 text-xs">
                                          <div className="flex justify-between text-text-secondary">
                                            <span>Vested / Total Units:</span>
                                            <span className="font-medium text-text-primary">
                                              {asset.vestedUnits || 0} / {asset.totalUnitsGranted || 0} units
                                            </span>
                                          </div>
                                          {asset.strikePrice !== undefined && asset.strikePrice > 0 && (
                                            <div className="flex justify-between text-text-secondary">
                                              <span>Strike Price:</span>
                                              <span className="font-medium text-text-primary">
                                                {asset.currency === 'USD' ? '$' : '₹'}{asset.strikePrice}
                                              </span>
                                            </div>
                                          )}
                                          {asset.exercisableGain !== undefined && asset.exercisableGain > 0 && (
                                            <div className="flex justify-between text-text-secondary">
                                              <span>Exercisable Net Gain:</span>
                                              <span className="font-medium text-emerald-400">
                                                {asset.currency === 'USD' ? '$' : '₹'}{asset.exercisableGain.toLocaleString('en-IN')}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Specific details for Bonds / Fixed Income */}
                                      {asset.assetType === 'BOND' && (
                                        <div className="pt-2 border-t border-border/50 space-y-1.5 text-xs">
                                          {asset.couponRate && (
                                            <div className="flex justify-between text-text-secondary">
                                              <span>Coupon Rate:</span>
                                              <span className="font-medium text-accent-400">{asset.couponRate}% p.a.</span>
                                            </div>
                                          )}
                                          {asset.maturityDate && (
                                            <div className="flex justify-between text-text-secondary">
                                              <span>Maturity:</span>
                                              <span className="font-medium text-text-primary">
                                                {new Date(asset.maturityDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex justify-between text-sm pt-2 border-t border-border">
                                        <span className="text-text-secondary">Gain/Loss:</span>
                                        <span className={`font-medium ${asset.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                          {asset.gainLoss >= 0 ? '+' : ''}{formatCurrency(asset.gainLoss)} ({asset.gainPercent?.toFixed(2)}%)
                                        </span>
                                      </div>
                                      {analytics?.assetAnalytics[asset.id] && (
                                        <div className="flex justify-between text-xs pt-2 text-text-secondary border-t border-border/50">
                                          <span>XIRR / CAGR:</span>
                                          <span className="font-semibold text-text-primary">
                                            {analytics.assetAnalytics[asset.id].xirr.toFixed(1)}% / {analytics.assetAnalytics[asset.id].cagr.toFixed(1)}%
                                          </span>
                                        </div>
                                      )}
                                      {asset.nomineeName && (
                                        <div className="flex justify-between text-xs pt-2 text-text-secondary border-t border-border/50">
                                          <span>Nominee:</span>
                                          <span className="font-semibold text-text-primary">
                                            {asset.nomineeName} {asset.nomineeRelationship ? `(${asset.nomineeRelationship})` : ''}
                                          </span>
                                        </div>
                                      )}
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

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        assets={allAssets || []}
        analytics={analytics}
      />

      <DocumentVaultModal
        isOpen={isVaultOpen || !!selectedAssetForDocs}
        onClose={() => {
          setIsVaultOpen(false);
          setSelectedAssetForDocs(null);
        }}
        assetId={selectedAssetForDocs?.id}
        assetName={selectedAssetForDocs?.name}
        assetType={selectedAssetForDocs?.type}
      />
    </div>
  );
}
