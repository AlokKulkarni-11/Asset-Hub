import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  ScrollText,
  TrendingDown,
  Calculator,
  Search,
  X,
  ChevronLeft,
  ChevronDown,
  TrendingUp,
  Briefcase,
  Landmark,
  Coins,
  Building2,
  Layers,
  Bot
} from 'lucide-react';
import CommandPalette from './CommandPalette';
import AssetSelectorModal from '../forms/AssetSelectorModal';
import AddGoldForm from '../forms/AddGoldForm';
import AddFDForm from '../forms/AddFDForm';
import AddStockForm from '../forms/AddStockForm';
import AddMutualFundForm from '../forms/AddMutualFundForm';
import AddRealEstateForm from '../forms/AddRealEstateForm';
import AddCryptoForm from '../forms/AddCryptoForm';
import AddBondForm from '../forms/AddBondForm';
import AddEsopRsuForm from '../forms/AddEsopRsuForm';
import LiabilitySelectorModal from '../forms/LiabilitySelectorModal';

export default function FloatingActionHub() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Modals state
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [showLiabilitySelector, setShowLiabilitySelector] = useState(false);
  const [activeAssetForm, setActiveAssetForm] = useState<string | null>(null);
  
  const hubRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (hubRef.current && !hubRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAssetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const assetSubTypes = [
    { id: 'STOCK', label: 'Stocks', icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'MUTUAL_FUND', label: 'Mutual Funds', icon: Briefcase, color: 'text-sky-400' },
    { id: 'ESOP_RSU', label: 'ESOPs / RSUs', icon: Sparkles, color: 'text-amber-400' },
    { id: 'BOND', label: 'Bonds, PPF & NPS', icon: ScrollText, color: 'text-indigo-400' },
    { id: 'FD', label: 'Fixed Deposits', icon: Landmark, color: 'text-blue-400' },
    { id: 'GOLD', label: 'Physical Gold', icon: Coins, color: 'text-yellow-400' },
    { id: 'REAL_ESTATE', label: 'Real Estate', icon: Building2, color: 'text-purple-400' },
    { id: 'CRYPTOCURRENCY', label: 'Cryptocurrency', icon: Coins, color: 'text-orange-400' },
  ];

  const handleOpenAssetForm = (typeId: string) => {
    setIsOpen(false);
    setIsAssetDropdownOpen(false);
    setActiveAssetForm(typeId);
  };

  const handleOpenAllAssets = () => {
    setIsOpen(false);
    setIsAssetDropdownOpen(false);
    setShowAssetSelector(true);
  };

  return (
    <>
      <div ref={hubRef} className="fixed bottom-20 md:bottom-8 right-6 z-40 flex flex-col items-end">
        {/* Speed-dial floating action items */}
        {isOpen && (
          <div className="flex flex-col items-end space-y-3 mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
            {/* Search & Commands */}
            <div
              onClick={() => {
                setIsOpen(false);
                setIsAssetDropdownOpen(false);
                setIsCommandPaletteOpen(true);
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Search & Commands (⌘K)
              </span>
              <button
                className="w-11 h-11 rounded-full bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-black/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
                title="Search & Commands (⌘K)"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Asset with Dropdown Menu */}
            <div className="relative flex items-center gap-3">
              {/* Asset Dropdown Flyout Card */}
              {isAssetDropdownOpen && (
                <div className="absolute right-14 bottom-0 mr-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Select Asset Type</span>
                    <button 
                      onClick={handleOpenAllAssets}
                      className="text-accent-400 hover:underline capitalize"
                    >
                      All Types →
                    </button>
                  </div>
                  <div className="mt-1.5 space-y-1 max-h-60 overflow-y-auto pr-1">
                    {assetSubTypes.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleOpenAssetForm(item.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800 transition-colors text-left group"
                        >
                          <Icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                          <span className="font-medium flex-1">{item.label}</span>
                          <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Add +</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main "Asset" Trigger in Speed Dial */}
              <div
                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1.5">
                  <span>Add Asset</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-accent-400 transition-transform ${isAssetDropdownOpen ? 'rotate-180' : ''}`} />
                </span>
                <button
                  className={`w-11 h-11 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-black/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 ${
                    isAssetDropdownOpen ? 'ring-2 ring-emerald-400 scale-105' : ''
                  }`}
                  title="Add Asset (Click for dropdown)"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add Liability */}
            <div
              onClick={() => {
                setIsOpen(false);
                setIsAssetDropdownOpen(false);
                setShowLiabilitySelector(true);
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Add Liability / Loan
              </span>
              <button
                className="w-11 h-11 rounded-full bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-black/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
                title="Add Liability / Loan"
              >
                <TrendingDown className="w-5 h-5" />
              </button>
            </div>

            {/* Hub Mate */}
            <div
              onClick={() => {
                setIsOpen(false);
                setIsAssetDropdownOpen(false);
                navigate('/assistant');
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Hub Mate (Copilot)
              </span>
              <button
                className="w-11 h-11 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-black/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
                title="Hub Mate (Copilot)"
              >
                <Bot className="w-5 h-5" />
              </button>
            </div>

            {/* Calculators */}
            <div
              onClick={() => {
                setIsOpen(false);
                setIsAssetDropdownOpen(false);
                navigate('/goals');
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Financial Calculators (SWP)
              </span>
              <button
                className="w-11 h-11 rounded-full bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-black/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
                title="Financial Calculators (SWP)"
              >
                <Calculator className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (isOpen) setIsAssetDropdownOpen(false);
          }}
          className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 group ${
            isOpen ? 'rotate-45 ring-4 ring-slate-400/30' : ''
          }`}
          aria-label="Quick Actions & Search"
          title="Quick Actions & Search (⌘K)"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
          )}
        </button>
      </div>

      {/* Direct Modals triggered from Floating Action Hub */}
      {showAssetSelector && (
        <AssetSelectorModal onClose={() => setShowAssetSelector(false)} />
      )}
      
      {showLiabilitySelector && (
        <LiabilitySelectorModal onClose={() => setShowLiabilitySelector(false)} />
      )}

      {activeAssetForm === 'GOLD' && (
        <AddGoldForm onClose={() => setActiveAssetForm(null)} />
      )}
      {activeAssetForm === 'FD' && (
        <AddFDForm onClose={() => setActiveAssetForm(null)} />
      )}
      {activeAssetForm === 'BOND' && (
        <AddBondForm onClose={() => setActiveAssetForm(null)} />
      )}
      {activeAssetForm === 'ESOP_RSU' && (
        <AddEsopRsuForm onClose={() => setActiveAssetForm(null)} />
      )}
      {activeAssetForm === 'STOCK' && (
        <AddStockForm onClose={() => setActiveAssetForm(null)} />
      )}
      {activeAssetForm === 'MUTUAL_FUND' && (
        <AddMutualFundForm onClose={() => setActiveAssetForm(null)} />
      )}
      {activeAssetForm === 'REAL_ESTATE' && (
        <AddRealEstateForm onClose={() => setActiveAssetForm(null)} />
      )}
      {activeAssetForm === 'CRYPTOCURRENCY' && (
        <AddCryptoForm onClose={() => setActiveAssetForm(null)} />
      )}

      {/* Full Keyboard/Global Command Center Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}
