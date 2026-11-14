import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  TrendingUp,
  Shield,
  Bot,
  Users,
  Calendar,
  ArrowRight,
  CheckCircle2,
  PieChart as PieChartIcon,
  Calculator,
  Lock,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
  Building2,
  Coins,
  ScrollText,
  Landmark,
  Briefcase
} from 'lucide-react';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Pre-warm backend when visitor lands on homepage
  useEffect(() => {
    api.get('/auth/ping').catch(() => {});
  }, []);

  const assetPillars = [
    { name: 'Stocks & Equities', icon: TrendingUp, desc: 'Real-time Yahoo Finance ticker pricing for US & Indian exchanges.' },
    { name: 'Mutual Funds', icon: Briefcase, desc: 'Daily automated NAV updates from AMFI India across 10,000+ schemes.' },
    { name: 'Physical Gold', icon: Coins, desc: 'Live spot gold pricing in USD with real-time INR forex & purity multipliers.' },
    { name: 'Fixed Deposits', icon: Landmark, desc: 'Exact daily compound interest math with maturity countdown timers.' },
    { name: 'Bonds & PPF/NPS', icon: ScrollText, desc: 'Govt & Corporate bonds, PPF, NPS, and Sovereign Gold Bonds (SGB).' },
    { name: 'ESOPs & RSUs', icon: Sparkles, desc: 'Corporate equity grants with vesting schedules and strike price analysis.' },
    { name: 'Real Estate', icon: Building2, desc: 'Property appreciation tracking with custom location and valuation records.' },
    { name: 'Cryptocurrencies', icon: Coins, desc: 'Live price tracking for Bitcoin, Ethereum, and altcoins via CoinGecko.' },
  ];

  const coreFeatures = [
    {
      title: 'True Net Worth & Debt Amortization',
      desc: 'Pairs polymorphic assets with home, personal, and auto loans to compute True Net Worth (Assets - Liabilities) and exact reducing-balance EMI amortization schedules.',
      icon: PieChartIcon,
      badge: 'Core Engine'
    },
    {
      title: 'Family Office Collaboration & RBAC',
      desc: 'Collaborate with family members under a shared dashboard with role-based permissions (Owner, Editor, Viewer), per-member net worth rollups, and pooled milestone goals.',
      icon: Users,
      badge: 'Family Multi-Tenancy'
    },
    {
      title: 'Grounded AI Copilot (Hub Mate)',
      desc: 'An AI assistant powered by Google Gemini grounded strictly in your verified database numbers. Get conversational insights, 0-100 financial health scores, and smart receipt OCR.',
      icon: Bot,
      badge: 'AI Intelligence'
    },
    {
      title: 'Automated Reminders & Price Alerts',
      desc: 'Set custom stock and gold price thresholds, receive 7-day advance maturity alerts for fixed deposits and loan payoffs, and get scheduled email digests via Brevo.',
      icon: Calendar,
      badge: 'Background Automations'
    },
    {
      title: 'Interactive Retirement & SWP Planning',
      desc: 'Simulate Systematic Withdrawal Plans (SWP) with inflation step-ups and capital gains tax projections, paired with an inflation-adjusted 4% rule retirement corpus calculator.',
      icon: Calculator,
      badge: 'Financial Planning'
    },
    {
      title: 'Multi-Currency & Instant Statement Export',
      desc: 'Hold assets in USD, EUR, GBP, AED, or INR with live forex conversions. Export complete portfolio statements to Excel-compatible UTF-8 CSV or printable PDF statements.',
      icon: FileSpreadsheet,
      badge: 'Global & Exports'
    }
  ];

  const faqs = [
    {
      q: 'How does AssetHub calculate my True Net Worth?',
      a: 'AssetHub connects to real-time market data (Yahoo Finance, AMFI, CoinGecko) and evaluates each asset type using exact deterministic financial algorithms (e.g. daily compound interest accrual for FDs, purity math for Gold). It then subtracts all outstanding loan and credit card balances to yield your true net worth in real time.'
    },
    {
      q: 'Does AssetHub sell my financial data or use it to train AI models?',
      a: 'Never. AssetHub enforces a strict zero-commercialization privacy policy. Your financial records are isolated in encrypted database tables, and AI queries through Google Gemini are ephemeral and never used to train public machine learning models.'
    },
    {
      q: 'Can I track assets in foreign currencies like USD or EUR?',
      a: 'Yes. You can record any holding (US stocks, foreign real estate, foreign bank deposits) in its native currency (USD, EUR, GBP, AED, SGD, CAD, AUD, JPY, CHF). The shared forex engine converts everything to INR for unified portfolio analytics while preserving original currency values.'
    },
    {
      q: 'How does Family Portfolio collaboration work?',
      a: 'You can create a Family Group and send email invites to members. The group owner can assign roles (Owner, Editor, Viewer) to protect sensitive balances. The dashboard aggregates individual member assets into a consolidated family net worth rollup while preserving individual ownership records.'
    },
    {
      q: 'What is the Document Vault feature?',
      a: 'AssetHub connects directly to your Google Drive storage using the restricted drive.file OAuth scope. You can upload FD certificates, loan sanction letters, and gold invoices into a dedicated "Asset Hub Documents" folder and parse them with multimodal AI.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-slate-900 selection:bg-sky-500 selection:text-white relative">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-sky-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/AssetHub_Logo.png" alt="AssetHub Logo" className="w-8 h-8 object-contain group-hover:scale-105 transition-transform" />
            <img src="/AssetHub_Name.png" alt="Asset Hub" className="h-6 object-contain" />
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
            <a href="#features" className="hover:text-sky-600 transition-colors">Features</a>
            <a href="#assets" className="hover:text-sky-600 transition-colors">Asset Classes</a>
            <a href="#family" className="hover:text-sky-600 transition-colors">Family Office</a>
            <a href="#security" className="hover:text-sky-600 transition-colors">Security</a>
            <a href="#faq" className="hover:text-sky-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-800 hover:text-sky-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Open Account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-sky-200 text-sky-700 text-xs font-semibold mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>The Modern Wealth Operating System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-[1.15]">
          True Financial Clarity Across <span className="text-sky-600">All Your Investments.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed font-normal">
          Unify Equities, Mutual Funds, Physical Gold, Fixed Deposits, Bonds, ESOPs, Real Estate, Crypto, and Liabilities into one intelligent real-time dashboard powered by exact financial mathematics and AI.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white text-base font-bold rounded-2xl shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-sky-50 text-slate-800 border border-sky-200 text-base font-semibold rounded-2xl shadow-sm transition-all"
          >
            Sign In to Portfolio
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-sky-600" /> 100% Free Tier</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-sky-600" /> Bank-Grade Encryption</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-sky-600" /> Zero Data Selling</span>
        </div>

        {/* Live Mock Dashboard Preview Card */}
        <div className="mt-16 max-w-5xl mx-auto rounded-3xl p-3 bg-white border border-sky-200 shadow-xl">
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-sky-100 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Consolidated True Net Worth</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">₹1,42,85,400 <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">+14.2% YTD</span></div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Assets</div>
                  <div className="font-bold text-slate-900">₹1,78,50,000</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Liabilities</div>
                  <div className="font-bold text-slate-900">₹35,64,600</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Debt Ratio</div>
                  <div className="font-bold text-sky-600">19.9% (Healthy)</div>
                </div>
              </div>
            </div>

            {/* Quick interactive mini cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-[#F0F9FF] border border-sky-200">
                <span className="text-xs text-slate-600 font-medium">Equities & MFs</span>
                <p className="text-base font-bold text-slate-900 mt-1">₹68,40,000</p>
                <span className="text-[11px] text-sky-700 font-semibold">Live NAV / Tickers</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F0F9FF] border border-sky-200">
                <span className="text-xs text-slate-600 font-medium">Fixed Deposits</span>
                <p className="text-base font-bold text-slate-900 mt-1">₹32,15,400</p>
                <span className="text-[11px] text-sky-700 font-semibold">Compounding Daily</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F0F9FF] border border-sky-200">
                <span className="text-xs text-slate-600 font-medium">Physical Gold (24K/22K)</span>
                <p className="text-base font-bold text-slate-900 mt-1">₹25,80,000</p>
                <span className="text-[11px] text-sky-700 font-semibold">Live Spot USD/INR</span>
              </div>
              <div className="p-4 rounded-xl bg-[#F0F9FF] border border-sky-200">
                <span className="text-xs text-slate-600 font-medium">Financial Health</span>
                <p className="text-base font-bold text-sky-600 mt-1">92 / 100</p>
                <span className="text-[11px] text-sky-700 font-semibold">Tier: Excellent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Asset Classes Section */}
      <section id="assets" className="py-20 bg-white border-y border-sky-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">Heterogeneous Asset Engine</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3">Built for Every Asset You Own</h2>
            <p className="text-slate-600 mt-3 text-base">Stop forcing all your investments into generic ledger rows. AssetHub understands the exact financial mechanics of each specific asset class.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {assetPillars.map((asset, idx) => {
              const Icon = asset.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-[#F0F9FF] border border-sky-200 hover:border-sky-400 transition-all hover:shadow-md group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-sky-300 bg-white text-sky-600 mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{asset.name}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{asset.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-white px-3 py-1 rounded-full border border-sky-200">Enterprise Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3">Everything You Need for Wealth Mastery</h2>
          <p className="text-slate-600 mt-3 text-base">From multi-member family governance to automated schedule digests, AssetHub provides a complete financial command center.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-14">
          {coreFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="p-8 rounded-3xl bg-white border border-sky-200 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">{feat.badge}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{feat.title}</h3>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Family Office Section */}
      <section id="family" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Family Office Tier</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mt-4 leading-tight">Manage Your Entire Family's Wealth Together</h2>
              <p className="text-slate-300 mt-4 text-base leading-relaxed">
                Connect spouse, children, and parents under a consolidated family umbrella. Retain individual asset ownership while pooling progress toward shared milestones like education funds or family estate planning.
              </p>

              <div className="mt-8 space-y-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <span><strong>Role-Based Access Control (RBAC):</strong> Designate Owners, Editors, or Viewers to protect sensitive balances.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <span><strong>Consolidated Net Worth Rollup:</strong> Interactive member contribution breakdown charts and joint debt ledgers.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <span><strong>Audit Trail History:</strong> Comprehensive activity logging tracing who added, updated, or removed assets.</span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/register"
                  className="px-6 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <span>Start Family Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-sky-400" />
                  <h3 className="font-bold text-lg">Sharma Family Portfolio</h3>
                </div>
                <span className="text-xs font-semibold text-sky-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">3 Members Active</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-white">Alok (You)</div>
                    <div className="text-xs text-slate-400">Role: Owner • 8 Holdings</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sky-400">₹88,50,000</div>
                    <div className="text-[11px] text-slate-400">62.0% Share</div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-white">Priya (Spouse)</div>
                    <div className="text-xs text-slate-400">Role: Editor • 5 Holdings</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sky-400">₹42,20,000</div>
                    <div className="text-[11px] text-slate-400">29.5% Share</div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-white">Rohan (Son)</div>
                    <div className="text-xs text-slate-400">Role: Viewer • 2 Holdings</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sky-400">₹12,15,400</div>
                    <div className="text-[11px] text-slate-400">8.5% Share</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section id="security" className="py-20 bg-white border-b border-sky-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">Security & Trust</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3">Your Financial Privacy is Non-Negotiable</h2>
          <p className="text-slate-600 mt-3 text-base max-w-2xl mx-auto">AssetHub is architected with defense-in-depth security standards to ensure only you and your authorized family members can access your portfolio.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
            <div className="p-6 rounded-2xl bg-[#F0F9FF] border border-sky-200">
              <Lock className="w-8 h-8 text-sky-600 mb-3" />
              <h3 className="font-bold text-base text-slate-900">TOTP Two-Factor Authentication</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">Hardware and app-backed 2FA standard (Google/Microsoft Authenticator) with 8 single-use recovery codes.</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F0F9FF] border border-sky-200">
              <Shield className="w-8 h-8 text-sky-600 mb-3" />
              <h3 className="font-bold text-base text-slate-900">Multi-Tenant Isolation & RLS</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">Strict parameterized database query isolation preventing cross-user data leakage at the JPA and PostgreSQL level.</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#F0F9FF] border border-sky-200">
              <Landmark className="w-8 h-8 text-sky-600 mb-3" />
              <h3 className="font-bold text-base text-slate-900">Restricted Google Drive Vault</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">Document certificates are uploaded directly to your personal Google Drive storage using the restricted drive.file scope.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-white px-3 py-1 rounded-full border border-sky-200">Got Questions?</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-3">Frequently Asked Questions</h2>
        </div>

        <div className="mt-10 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="border border-sky-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-slate-900 flex items-center justify-between hover:bg-sky-50 transition-colors"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-sky-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-sky-100 pt-3 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-slate-900 text-white text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold">Ready to Master Your Net Worth?</h2>
          <p className="mt-4 text-slate-300 text-base max-w-2xl mx-auto">Join smart investors tracking their complete global wealth with institutional precision.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105"
            >
              Get Started Free Today
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl border border-slate-700 transition-all"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-slate-600 py-12 border-t border-sky-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/AssetHub_Logo.png" alt="AssetHub Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-slate-900 text-sm">AssetHub (WealthMap)</span>
          </div>

          <div className="flex items-center space-x-6 font-medium">
            <Link to="/login" className="hover:text-sky-600 transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-sky-600 transition-colors">Register</Link>
            <Link to="/privacy" className="hover:text-sky-600 transition-colors">Privacy Policy & Disclosures</Link>
            <a href="mailto:alokgdsc@gmail.com" className="hover:text-sky-600 transition-colors">Support (alokgdsc@gmail.com)</a>
          </div>

          <div>
            &copy; {new Date().getFullYear()} AssetHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
