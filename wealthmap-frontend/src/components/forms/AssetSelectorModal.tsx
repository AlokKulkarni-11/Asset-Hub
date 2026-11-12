import React, { useState } from 'react';
import { X, Coins, TrendingUp, Building2, Landmark, Briefcase, Sparkles, ScrollText } from 'lucide-react';
import AddGoldForm from './AddGoldForm';
import AddSilverForm from './AddSilverForm';
import AddFDForm from './AddFDForm';
import AddStockForm from './AddStockForm';
import AddMutualFundForm from './AddMutualFundForm';
import AddRealEstateForm from './AddRealEstateForm';
import AddCryptoForm from './AddCryptoForm';
import AddBondForm from './AddBondForm';
import AddEsopRsuForm from './AddEsopRsuForm';

interface Props {
  onClose: () => void;
}

type AssetType = 'GOLD' | 'SILVER' | 'STOCK' | 'MUTUAL_FUND' | 'FD' | 'REAL_ESTATE' | 'CRYPTOCURRENCY' | 'BOND' | 'ESOP_RSU' | null;

export default function AssetSelectorModal({ onClose }: Props) {
  const [selectedType, setSelectedType] = useState<AssetType>(null);

  const categories = [
    {
      title: 'Market Linked & Equity',
      items: [
        { id: 'STOCK', name: 'Stocks', icon: TrendingUp, comingSoon: false },
        { id: 'MUTUAL_FUND', name: 'Mutual Funds', icon: Briefcase, comingSoon: false },
        { id: 'ESOP_RSU', name: 'ESOPs / RSUs', icon: Sparkles, comingSoon: false },
        { id: 'CRYPTOCURRENCY', name: 'Cryptocurrency', icon: Coins, comingSoon: false },
      ]
    },
    {
      title: 'Fixed Income & Debt',
      items: [
        { id: 'FD', name: 'Fixed Deposit', icon: Landmark, comingSoon: false },
        { id: 'BOND', name: 'Bonds, PPF, NPS & SGB', icon: ScrollText, comingSoon: false },
      ]
    },
    {
      title: 'Physical Assets & Commodities',
      items: [
        { id: 'GOLD', name: 'Physical Gold', icon: Coins, comingSoon: false },
        { id: 'SILVER', name: 'Physical Silver', icon: Coins, comingSoon: false },
        { id: 'REAL_ESTATE', name: 'Real Estate', icon: Building2, comingSoon: false },
      ]
    }
  ];

  if (selectedType === 'GOLD') {
    return <AddGoldForm onClose={onClose} />;
  }

  if (selectedType === 'SILVER') {
    return <AddSilverForm onClose={onClose} />;
  }

  if (selectedType === 'FD') {
    return <AddFDForm onClose={onClose} />;
  }

  if (selectedType === 'BOND') {
    return <AddBondForm onClose={onClose} />;
  }

  if (selectedType === 'ESOP_RSU') {
    return <AddEsopRsuForm onClose={onClose} />;
  }

  if (selectedType === 'STOCK') {
    return <AddStockForm onClose={onClose} />;
  }

  if (selectedType === 'MUTUAL_FUND') {
    return <AddMutualFundForm onClose={onClose} />;
  }

  if (selectedType === 'REAL_ESTATE') {
    return <AddRealEstateForm onClose={onClose} />;
  }

  if (selectedType === 'CRYPTOCURRENCY') {
    return <AddCryptoForm onClose={onClose} />;
  }
  if (selectedType) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-slate-200 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Coming Soon</h2>
          <p className="text-gray-600 mb-6">The form for {selectedType} is being built next!</p>
          <button onClick={() => setSelectedType(null)} className="btn-primary w-full">Back to Selector</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 relative border border-slate-200 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-semibold mb-2 text-gray-900">Add New Asset</h2>
        <p className="text-gray-600 mb-8 font-medium">Select the type of asset you want to track</p>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-semibold text-accent-600 mb-4 tracking-wider uppercase">{category.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id as AssetType)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-sky-100 bg-sky-50/50 hover:bg-sky-100 hover:border-accent-500/40 transition-all text-left group shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-accent-500 shadow-sm group-hover:scale-105 transition-all">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-base">{item.name}</h4>
                      {item.comingSoon && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500 mt-1 inline-block">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
