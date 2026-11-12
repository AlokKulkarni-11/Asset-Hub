import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllAssets } from '../../api/assets.api';
import { getAllLiabilities } from '../../api/liabilities.api';
import { exportToCsv, exportToPdf } from '../../utils/exportUtils';
import { useAuthStore } from '../../store/authStore';
import {
  Search,
  LayoutDashboard,
  Wallet,
  TrendingDown,
  Target,
  Users,
  Calendar,
  PlusCircle,
  Calculator,
  Shield,
  User,
  ArrowRight,
  Sparkles,
  Layers,
  X,
  FileSpreadsheet,
  Printer,
  Download,
  Bot
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddAsset?: (type?: string) => void;
  onOpenAddLiability?: () => void;
}

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  action: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenAddAsset,
  onOpenAddLiability,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch user assets and liabilities to enable direct search & export
  const { data: assets } = useQuery({
    queryKey: ['assets', 'all'],
    queryFn: getAllAssets,
    enabled: isOpen,
  });

  const { data: liabilities } = useQuery({
    queryKey: ['liabilities', 'all'],
    queryFn: getAllLiabilities,
    enabled: isOpen,
  });

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open & reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Build command items list
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      // Quick Actions
      {
        id: 'action-add-asset',
        category: 'Quick Actions',
        title: 'Add New Asset',
        subtitle: 'Stocks, Mutual Funds, Gold, Real Estate, Crypto, Bonds, ESOPs',
        icon: PlusCircle,
        badge: 'Action',
        action: () => {
          onClose();
          if (onOpenAddAsset) {
            onOpenAddAsset();
          } else {
            navigate('/assets');
          }
        },
      },
      {
        id: 'action-add-bond',
        category: 'Quick Actions',
        title: 'Add Bond / PPF / NPS / SGB',
        subtitle: 'Fixed income, sovereign gold bonds, and provident funds',
        icon: Layers,
        badge: 'Fixed Income',
        action: () => {
          onClose();
          if (onOpenAddAsset) {
            onOpenAddAsset('BOND');
          } else {
            navigate('/assets');
          }
        },
      },
      {
        id: 'action-add-esop',
        category: 'Quick Actions',
        title: 'Add ESOP / RSU Grant',
        subtitle: 'Corporate equity grants with vesting schedules',
        icon: Sparkles,
        badge: 'Equity',
        action: () => {
          onClose();
          if (onOpenAddAsset) {
            onOpenAddAsset('ESOP_RSU');
          } else {
            navigate('/assets');
          }
        },
      },
      {
        id: 'action-add-liability',
        category: 'Quick Actions',
        title: 'Add Liability / Loan',
        subtitle: 'Home loan, car loan, credit card, personal loans',
        icon: TrendingDown,
        badge: 'Liability',
        action: () => {
          onClose();
          if (onOpenAddLiability) {
            onOpenAddLiability();
          } else {
            navigate('/liabilities');
          }
        },
      },
      {
        id: 'action-export-csv',
        category: 'Export & Reports',
        title: 'Export Portfolio as CSV Spreadsheet',
        subtitle: 'Download complete dataset for Excel, Sheets, and tax filing',
        icon: FileSpreadsheet,
        badge: 'CSV',
        action: () => {
          onClose();
          exportToCsv({
            assets: assets || [],
            liabilities: liabilities || [],
            userName: user?.name || user?.email || 'Portfolio Owner',
          });
        },
      },
      {
        id: 'action-export-pdf',
        category: 'Export & Reports',
        title: 'Print / Save Wealth Statement (PDF)',
        subtitle: 'Formatted A4 executive portfolio statement ready to print or save as PDF',
        icon: Printer,
        badge: 'PDF',
        action: () => {
          onClose();
          exportToPdf({
            assets: assets || [],
            liabilities: liabilities || [],
            userName: user?.name || user?.email || 'Portfolio Owner',
          });
        },
      },

      // Navigation
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Go to Dashboard',
        subtitle: 'Net worth overview, allocation charts, and metrics',
        icon: LayoutDashboard,
        action: () => {
          onClose();
          navigate('/');
        },
      },
      {
        id: 'nav-assets',
        category: 'Navigation',
        title: 'Go to Assets Portfolio',
        subtitle: 'Browse, manage, and edit all asset categories',
        icon: Wallet,
        action: () => {
          onClose();
          navigate('/assets');
        },
      },
      {
        id: 'nav-liabilities',
        category: 'Navigation',
        title: 'Go to Liabilities & Debts',
        subtitle: 'View outstanding balances and amortization schedules',
        icon: TrendingDown,
        action: () => {
          onClose();
          navigate('/liabilities');
        },
      },
      {
        id: 'nav-assistant',
        category: 'Navigation',
        title: 'Go to Hub Mate (Copilot)',
        subtitle: 'Ask natural language questions about your net worth, health score, and portfolio',
        icon: Bot,
        badge: 'Copilot',
        action: () => {
          onClose();
          navigate('/assistant');
        },
      },
      {
        id: 'nav-goals',
        category: 'Navigation',
        title: 'Go to Financial Goals',
        subtitle: 'Track retirement, home purchase, and custom milestones',
        icon: Target,
        action: () => {
          onClose();
          navigate('/goals');
        },
      },
      {
        id: 'nav-maturities',
        category: 'Navigation',
        title: 'Go to Upcoming Maturities',
        subtitle: 'Fixed deposits, bonds, and PPF maturity schedules',
        icon: Calendar,
        action: () => {
          onClose();
          navigate('/goals?tab=maturities');
        },
      },
      {
        id: 'nav-calculators',
        category: 'Navigation',
        title: 'Go to Wealth Lab (Calculators)',
        subtitle: 'Income Tax (New Regime), SWP, Retirement, SIP & Loan EMI',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators');
        },
      },
      {
        id: 'nav-family',
        category: 'Navigation',
        title: 'Go to Family & Nominees',
        subtitle: 'Manage family member allocations and emergency contacts',
        icon: Users,
        action: () => {
          onClose();
          navigate('/family');
        },
      },
      {
        id: 'nav-profile',
        category: 'Navigation',
        title: 'Profile & Security',
        subtitle: 'Audit logs, security sessions, and account details',
        icon: User,
        action: () => {
          onClose();
          navigate('/profile');
        },
      },

      // Tools & Calculators
      {
        id: 'tool-emergency',
        category: 'Financial Planning',
        title: 'Emergency Fund Health Check',
        subtitle: 'Evaluate 6-month liquidity coverage ratio',
        icon: Shield,
        action: () => {
          onClose();
          navigate('/goals?tab=emergency');
        },
      },
      {
        id: 'tool-swp',
        category: 'Financial Planning',
        title: 'Systematic Withdrawal Plan (SWP)',
        subtitle: 'Simulate monthly post-retirement cashflow longevity',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=swp');
        },
      },
      {
        id: 'tool-tax',
        category: 'Financial Planning',
        title: 'Income Tax Calculator (New Regime)',
        subtitle: 'Estimate FY 2024-25 to FY 2026-27 tax with 87A & NPS',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=tax');
        },
      },
      {
        id: 'tool-ppf',
        category: 'Financial Planning',
        title: 'PPF Calculator',
        subtitle: 'Calculate Public Provident Fund returns, maturity year & interest',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=ppf');
        },
      },
      {
        id: 'tool-fd',
        category: 'Financial Planning',
        title: 'FD Calculator',
        subtitle: 'Calculate Fixed Deposit maturity & compounding interest',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=fd');
        },
      },
      {
        id: 'tool-rd',
        category: 'Financial Planning',
        title: 'RD Calculator',
        subtitle: 'Calculate Recurring Deposit maturity & interest',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=rd');
        },
      },
      {
        id: 'tool-prepayment',
        category: 'Financial Planning',
        title: 'Home Loan Prepayment Calculator',
        subtitle: 'Simulate EMI with recurring & lumpsum part payments',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=prepayment');
        },
      },
      {
        id: 'tool-fixed-principal',
        category: 'Financial Planning',
        title: 'Fixed Principal Loan Calculator',
        subtitle: 'Declining monthly payments with fixed principal & balloon option',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=fixed-principal');
        },
      },
      {
        id: 'tool-expense-ratio',
        category: 'Financial Planning',
        title: 'MF Expense Ratio Calculator',
        subtitle: 'Measure long-term opportunity cost of mutual fund expense ratio',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=expense-ratio');
        },
      },
      {
        id: 'tool-step-up-sip',
        category: 'Financial Planning',
        title: 'Step-Up SIP Calculator',
        subtitle: 'Measure mutual fund returns with annual incremental SIPs',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=step-up-sip');
        },
      },
      {
        id: 'tool-xirr',
        category: 'Financial Planning',
        title: 'XIRR Calculator',
        subtitle: 'Calculate exact annualized XIRR for SIPs & irregular cash flows',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=xirr');
        },
      },
      {
        id: 'tool-ssy',
        category: 'Financial Planning',
        title: 'SSY Calculator (Sukanya Samriddhi)',
        subtitle: 'Calculate 21-year Sukanya Samriddhi Yojana maturity & interest',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=ssy');
        },
      },
      {
        id: 'tool-nsc',
        category: 'Financial Planning',
        title: 'NSC Calculator (National Savings Certificate)',
        subtitle: 'Calculate 5-year NSC maturity, interest & growth table',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=nsc');
        },
      },
      {
        id: 'tool-epf',
        category: 'Financial Planning',
        title: 'EPF / PF Calculator',
        subtitle: 'Estimate Employee Provident Fund retirement corpus at 8.25%',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=epf');
        },
      },
      {
        id: 'tool-scss',
        category: 'Financial Planning',
        title: 'SCSS Calculator (Senior Citizen Savings)',
        subtitle: 'Calculate monthly, quarterly & yearly income under SCSS (8.2%)',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=scss');
        },
      },
      {
        id: 'tool-goal-planner',
        category: 'Financial Planning',
        title: 'Goal-Based Wealth Planner',
        subtitle: 'Plan multiple life goals with inflation, corpus & YoY schedule',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/goals?tab=planner');
        },
      },
      {
        id: 'tool-gold-price',
        category: 'Financial Planning',
        title: 'Live Gold Price Calculator',
        subtitle: 'Estimate gold price by purity (24K–8K), GST & making charges',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/assets?metals=gold-price');
        },
      },
      {
        id: 'tool-gold-profit',
        category: 'Financial Planning',
        title: 'Gold Profit Analyzer',
        subtitle: 'Analyze gold P&L across purchases with SGB & LTCG/STCG tax',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/assets?metals=gold-profit');
        },
      },
      {
        id: 'tool-silver-price',
        category: 'Financial Planning',
        title: 'Live Silver Price Calculator',
        subtitle: 'Estimate silver price with GST, making charges & service tax',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/assets?metals=silver-price');
        },
      },
      {
        id: 'tool-multi-asset',
        category: 'Financial Planning',
        title: 'Multi-Asset Wealth Calculator Pro',
        subtitle: 'Consolidated year-on-year projection across all asset classes',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=multi-asset');
        },
      },
      {
        id: 'tool-wealth-calculator',
        category: 'Financial Planning',
        title: 'Future Wealth Calculator',
        subtitle: 'Plan long-term wealth with step-up, inflation & goal withdrawals',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=wealth-calculator');
        },
      },
      {
        id: 'tool-inflation',
        category: 'Financial Planning',
        title: 'Inflation Calculator',
        subtitle: 'Measure future cost & purchasing power erosion over time',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=inflation');
        },
      },
      {
        id: 'tool-mortgage',
        category: 'Financial Planning',
        title: 'Mortgage Calculator (INR)',
        subtitle: 'Estimate monthly home-buying payment with tax, insurance & HOA',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=mortgage');
        },
      },
      {
        id: 'tool-nps',
        category: 'Financial Planning',
        title: 'NPS Pension Calculator',
        subtitle: 'Estimate NPS corpus, lumpsum, annuity & monthly pension',
        icon: Calculator,
        action: () => {
          onClose();
          navigate('/calculators?tab=nps');
        },
      },
    ];

    // User's Live Assets
    if (assets && assets.length > 0) {
      assets.forEach((asset) => {
        items.push({
          id: `asset-${asset.id}`,
          category: 'Your Assets',
          title: asset.name,
          subtitle: `${(asset.assetType || '').replace('_', ' ')} • Current: ${formatCurrency(asset.currentValue || 0)}`,
          icon: Wallet,
          badge: formatCurrency(asset.currentValue || 0),
          action: () => {
            onClose();
            navigate('/assets');
          },
        });
      });
    }

    return items;
  }, [assets, navigate, onClose, onOpenAddAsset, onOpenAddLiability]);

  // Filter items by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return allCommands;
    }
    const q = query.toLowerCase().trim();
    return allCommands.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;
    const activeItem = listElement.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Search className="w-5 h-5 text-accent-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, action, or search assets..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-base sm:text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 bg-white dark:bg-slate-900">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No commands or assets found matching &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for &quot;Add&quot;, &quot;Bond&quot;, &quot;Stocks&quot;, or &quot;Goals&quot;</p>
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-accent-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-slate-900 dark:text-white font-semibold' : ''}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-500/10 text-accent-500 border border-accent-500/20">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-accent-500 animate-in fade-in duration-150" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>Asset Hub Command Center</span>
          </div>
        </div>
      </div>
    </div>
  );
}