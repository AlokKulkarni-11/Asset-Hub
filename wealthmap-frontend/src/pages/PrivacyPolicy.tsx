import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff, Server, Cpu, Mail, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Privacy Policy &amp; Security Disclosure</h1>
              <p className="text-xs text-slate-500 mt-0.5">Last updated: September 2026 • Strict Financial Data Isolation</p>
            </div>
          </div>
          <Link
            to="/"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Executive Guarantee */}
        <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 space-y-1">
            <h3 className="font-bold text-sm text-emerald-900">Zero Commercialization of Financial Data</h3>
            <p className="leading-relaxed">
              Asset Hub is built on the fundamental principle that your financial net worth is strictly private. We do not sell, rent, broker, or monetize your portfolio balances, asset holdings, or transaction records to advertisers, credit bureaus, or third parties.
            </p>
          </div>
        </div>

        {/* Section 1: What Data We Collect & Store */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Lock className="w-4 h-4 text-indigo-600" />
            <h2>1. Information Stored in Your Account</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When you use Asset Hub, we securely store the following categories of data in encrypted databases:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <li className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <strong className="text-slate-800 font-semibold block">Authentication &amp; Profile</strong>
              <span className="text-slate-600">Full name, email address, password hash (salted BCrypt with work factor 12), and TOTP 2FA secret keys.</span>
            </li>
            <li className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <strong className="text-slate-800 font-semibold block">Asset &amp; Liability Holdings</strong>
              <span className="text-slate-600">Purchase amounts, quantities, interest rates, tenure dates, institutions, lenders, and nominee names.</span>
            </li>
            <li className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <strong className="text-slate-800 font-semibold block">Milestones &amp; Planning</strong>
              <span className="text-slate-600">Target goal amounts, target dates, retirement scenarios, and SWP withdrawal configurations.</span>
            </li>
            <li className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <strong className="text-slate-800 font-semibold block">Family Collaboration</strong>
              <span className="text-slate-600">Family group memberships, member roles (Owner, Editor, Viewer), and audit activity event logs.</span>
            </li>
          </ul>
        </section>

        {/* Section 2: Third-Party Integrations */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <EyeOff className="w-4 h-4 text-indigo-600" />
            <h2>2. Third-Party Integrations &amp; Minimal Data Disclosure</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Asset Hub connects to specialized market data providers and notification services. We enforce strict data minimization:
          </p>
          <div className="space-y-2.5 pt-1">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <strong className="text-slate-800 font-semibold">Yahoo Finance, AMFI India &amp; CoinGecko APIs</strong>
              <p className="text-slate-600 mt-1">
                Used solely for live market prices, NAVs, spot gold rates, and currency forex pairs. Our backend queries market tickers anonymously on scheduled intervals without transmitting user identities, account balances, or portfolio sizes.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <strong className="text-slate-800 font-semibold">Brevo (Sendinblue) Transactional Service</strong>
              <p className="text-slate-600 mt-1">
                Used for sending user-authorized transactional communications: OTP verifications, family group invitations, price alert triggers, and optional summary digests. Brevo receives only the recipient email and template parameters.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <strong className="text-slate-800 font-semibold">Google Drive &amp; Document Vault</strong>
              <p className="text-slate-600 mt-1">
                When you connect Google Drive, files (FD certificates, loan sanction letters, receipts) are uploaded directly to a dedicated <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">"Asset Hub Documents"</code> folder in your personal Google Drive storage using the restricted <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">drive.file</code> scope.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: AI Usage Disclosure */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <h2>3. Artificial Intelligence &amp; Multimodal Processing Disclosure</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Asset Hub features AI intelligence powered by Google Gemini API (Hub Mate conversational assistant, portfolio narrative generation, and Document OCR extraction).
          </p>
          <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl text-xs text-indigo-950 space-y-1.5">
            <p className="font-semibold text-indigo-900">Important Privacy Guarantees for AI Features:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Your financial figures and document contents are processed ephemerally and are <strong>not used to train public machine learning models</strong>.</li>
              <li>Calculations for net worth, debt ratios, XIRR, and CAGR are computed directly on our deterministic financial engine, preventing numerical hallucinations.</li>
              <li>You can use Asset Hub without invoking AI assistants at any time.</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Security Architecture */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Server className="w-4 h-4 text-indigo-600" />
            <h2>4. Security Architecture &amp; Data Isolation</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Security is implemented across every layer of the Asset Hub stack:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-1">
            <li><strong>Row Level Security (RLS):</strong> Database-level PostgreSQL policies ensure users can only ever access their own records.</li>
            <li><strong>Transport Encryption:</strong> All client-to-server traffic is encrypted in transit via TLS 1.3.</li>
            <li><strong>Two-Factor Authentication:</strong> Time-based One-Time Password (TOTP) standard RFC 6238 provides hardware/app-backed login protection.</li>
            <li><strong>Stateless JWT Tokens:</strong> Short-lived, cryptographically signed JWT tokens prevent session hijacking.</li>
          </ul>
        </section>

        {/* Contact & Support */}
        <section className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>Questions or data deletion requests? Contact our team at:</span>
            <a href="mailto:alokgdsc@gmail.com" className="text-indigo-600 hover:underline font-semibold">alokgdsc@gmail.com</a>
          </div>
          <div>
            <Link to="/" className="text-indigo-600 hover:underline font-semibold">Back to Asset Hub</Link>
          </div>
        </section>

      </div>
    </div>
  );
}
