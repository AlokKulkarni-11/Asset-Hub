import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Coins, Landmark, TrendingUp, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { getAllAssets, deleteAsset } from '../api/assets.api';
import type { AssetResponse } from '../api/assets.api';
import AssetSelectorModal from '../components/forms/AssetSelectorModal';
import AddGoldForm from '../components/forms/AddGoldForm';
import AddFDForm from '../components/forms/AddFDForm';
import AddStockForm from '../components/forms/AddStockForm';

export default function Assets() {
  const [showGoldModal, setShowGoldModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [editingAsset, setEditingAsset] = useState<AssetResponse | null>(null);
  const queryClient = useQueryClient();

  const { data: allAssets, isLoading } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets,
  });

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(id);
        queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
      } catch (err) {
        alert('Failed to delete asset');
      }
    }
    setMenuOpenId(null);
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
        <AddGoldForm editAssetId={editingAsset.id} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'FIXED_DEPOSIT' && (
        <AddFDForm editAssetId={editingAsset.id} onClose={() => setEditingAsset(null)} />
      )}
      {editingAsset?.assetType === 'STOCK' && (
        <AddStockForm editAssetId={editingAsset.id} onClose={() => setEditingAsset(null)} />
      )}

      {/* Basic Assets List for Phase 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="text-text-muted">Loading assets...</div>
        ) : allAssets?.length === 0 ? (
          <div className="col-span-full glass-card p-12 flex flex-col items-center justify-center text-center">
            <Coins className="w-12 h-12 text-gold-400 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Assets Found</h3>
            <p className="text-text-secondary">Start tracking your wealth by adding your first asset.</p>
          </div>
        ) : (
          allAssets?.map((asset) => (
            <div key={asset.id} className="glass-card p-5 hover:border-gold-400/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold-400/10 flex items-center justify-center">
                    {asset.assetType === 'FIXED_DEPOSIT' ? (
                      <Landmark className="w-5 h-5 text-gold-400" />
                    ) : asset.assetType === 'STOCK' ? (
                      <TrendingUp className="w-5 h-5 text-gold-400" />
                    ) : (
                      <Coins className="w-5 h-5 text-gold-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg leading-tight">{asset.name}</h3>
                    <p className="text-text-secondary text-sm">Owner: {asset.familyMemberName || `ID ${asset.familyMemberId}`}</p>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpenId(menuOpenId === asset.id ? null : asset.id)}
                    className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-white transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {menuOpenId === asset.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-navy-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-10">
                      <button 
                        onClick={() => {
                          setMenuOpenId(null);
                          setEditingAsset(asset);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-white/5"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(asset.id)}
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
                  <span className="font-medium">₹{asset.investedAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Current Value:</span>
                  <span className="font-medium text-gold-300">₹{asset.currentValue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-text-secondary">Gain/Loss:</span>
                  <span className={`font-medium ${asset.gainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {asset.gainLoss >= 0 ? '+' : ''}₹{asset.gainLoss?.toLocaleString()} ({asset.gainPercent?.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
