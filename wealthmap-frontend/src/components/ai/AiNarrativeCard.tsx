import React, { useState, useEffect } from 'react';
import { Bot, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '../../api/ai.api';

export const AiNarrativeCard: React.FC = () => {
  const navigate = useNavigate();
  const [narrative, setNarrative] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchNarrative = async () => {
    try {
      setLoading(true);
      const res = await aiApi.getNarrative();
      setNarrative(res.narrative);
    } catch (err) {
      console.error('Failed to load AI narrative', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await aiApi.refreshNarrative();
      setNarrative(res.narrative);
    } catch (err) {
      console.error('Failed to refresh AI narrative', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNarrative();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
        <div className="h-10 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (!narrative) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Bot className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Executive Portfolio Briefing</h3>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => navigate('/assistant')}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Hub Mate</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors border border-slate-200"
            title="Regenerate Executive Briefing"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed mt-1">
        {narrative}
      </p>
    </div>
  );
};
