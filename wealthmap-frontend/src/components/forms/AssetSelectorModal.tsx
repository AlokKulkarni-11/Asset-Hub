import React, { useState } from 'react';
import { X, Coins, TrendingUp, Building2, Landmark, Briefcase, Car } from 'lucide-react';
import AddGoldForm from './AddGoldForm';
import AddFDForm from './AddFDForm';
import AddStockForm from './AddStockForm';

interface Props {
  onClose: () => void;
}

type AssetCategory = 'MARKET' | 'FIXED' | 'PHYSICAL' | null;
type AssetType = 'GOLD' | 'STOCK' | 'MUTUAL_FUND' | 'FD' | 'REAL_ESTATE' | null;

export default function AssetSelectorModal({ onClose }: Props) {
  const [selectedType, setSelectedType] = useState<AssetType>(null);

  const categories = [
    {
      title: 'Market Linked',
      items: [
        { id: 'STOCK', name: 'Stocks', icon: TrendingUp, comingSoon: false },
        { id: 'MUTUAL_FUND', name: 'Mutual Funds', icon: Briefcase, comingSoon: true },
      ]
    },
    {
      title: 'Fixed Income',
      items: [
        { id: 'FD', name: 'Fixed Deposit', icon: Landmark, comingSoon: false },
      ]
    },
    {
      title: 'Physical Assets',
      items: [
        { id: 'GOLD', name: 'Physical Gold', icon: Coins, comingSoon: false },
        { id: 'REAL_ESTATE', name: 'Real Estate', icon: Building2, comingSoon: true },
      ]
    }
  ];

  if (selectedType === 'GOLD') {
    return <AddGoldForm onClose={onClose} />;
  }

  if (selectedType === 'FD') {
    return <AddFDForm onClose={onClose} />;
  }

  if (selectedType === 'STOCK') {
    return <AddStockForm onClose={onClose} />;
  }

  // Placeholder for other forms
  if (selectedType) {
    return (
      <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="glass-card w-full max-w-md p-6 relative text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
          <p className="text-text-secondary mb-6">The form for {selectedType} is being built next!</p>
          <button onClick={() => setSelectedType(null)} className="btn-primary w-full">Back to Selector</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-semibold mb-2">Add New Asset</h2>
        <p className="text-text-secondary mb-8">Select the type of asset you want to track</p>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-medium text-gold-400 mb-4 tracking-wider uppercase">{category.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id as AssetType)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-navy-900/50 hover:bg-white/5 hover:border-gold-400/30 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-gold-400/10 group-hover:text-gold-400 transition-colors">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{item.name}</h4>
                      {item.comingSoon && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-950 border border-white/10 text-text-muted mt-1 inline-block">
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
