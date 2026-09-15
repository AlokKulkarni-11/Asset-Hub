import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, RefreshCw, AlertCircle, TrendingUp, CheckCircle2, Lightbulb } from 'lucide-react';
import { healthScoreApi, HealthScoreResponse } from '../../api/healthScore.api';

export const FinancialHealthCard: React.FC = () => {
  const [data, setData] = useState<HealthScoreResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await healthScoreApi.getHealthScore();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load Financial Health Score');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const res = await healthScoreApi.refreshHealthScore();
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-slate-100 rounded-xl mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm text-slate-600 mb-3">{error || 'No health score available'}</p>
        <button
          onClick={fetchScore}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'EXCELLENT':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">Excellent</span>;
      case 'GOOD':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">Good</span>;
      case 'FAIR':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">Fair</span>;
      case 'NEEDS_ATTENTION':
        return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-semibold">Needs Attention</span>;
      default:
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold">Critical</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Composite Financial Health</h2>
            <p className="text-xs text-slate-500">AI-reasoned portfolio robustness index</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getGradeBadge(data.grade)}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors border border-slate-200"
            title="Recalculate & Refresh AI analysis"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Score & Submetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-6">
        {/* Score Ring / Large Value */}
        <div className="lg:col-span-4 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
          <div>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {data.overallScore}
              <span className="text-base font-medium text-slate-400">/100</span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Health Score</p>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.overallScore >= 80 ? 'bg-emerald-500' :
                  data.overallScore >= 65 ? 'bg-blue-500' :
                  data.overallScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${data.overallScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Debt Leverage</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{data.debtScore}<span className="text-xs font-normal text-slate-400">/100</span></div>
            <span className="text-[11px] text-slate-500">{Number(data.debtToAssetRatioPct || 0).toFixed(1)}% Debt/Asset</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Liquidity</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{data.liquidityScore}<span className="text-xs font-normal text-slate-400">/100</span></div>
            <span className="text-[11px] text-slate-500">{Number(data.liquidPercentage || 0).toFixed(1)}% Liquid</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Diversification</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{data.diversificationScore}<span className="text-xs font-normal text-slate-400">/100</span></div>
            <span className="text-[11px] text-slate-500">{Number(data.maxAssetClassConcentrationPct || 0).toFixed(1)}% Max Conc</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Emergency Fund</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{data.emergencyFundScore}<span className="text-xs font-normal text-slate-400">/100</span></div>
            <span className="text-[11px] text-slate-500">{Number(data.emergencyFundMonthsCovered || 0).toFixed(1)} Mo Buffer</span>
          </div>
        </div>
      </div>

      {/* AI Reasoning & Actionable Tips */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <p className="text-xs leading-relaxed text-slate-700 bg-indigo-50/60 border border-indigo-100/80 p-3 rounded-xl">
          <span className="font-semibold text-indigo-900">AI Advisor Analysis: </span>
          {data.aiSummary}
        </p>

        {data.aiImprovementTips && data.aiImprovementTips.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-bold text-slate-700 flex items-center mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              Actionable Recommendations
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.aiImprovementTips.map((tip, idx) => (
                <div key={idx} className="flex items-start space-x-2 bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
