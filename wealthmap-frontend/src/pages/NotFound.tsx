import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  ShieldCheck,
  Wallet,
  Calculator,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const BOT_DIALOGUES = [
  "Beep boop! Route 404: this asset page doesn't exist in my ledger. 🛰️",
  "Scanning coordinates... 0 financial records detected at this URL! 🧭",
  "Don't worry, your real portfolio is safe and sound at Dashboard. 🛡️",
  "Lost in financial cyberspace? Let me guide you back to safety! 🚀",
  "Pro tip: Check the URL spelling or pick a destination below. ✨",
];

export default function NotFound() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Bot interactive state
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isWiggling, setIsWiggling] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const cycleDialogue = () => {
    setIsWiggling(true);
    setDialogueIndex((prev) => (prev + 1) % BOT_DIALOGUES.length);
    setTimeout(() => setIsWiggling(false), 600);
  };

  // Subtle mouse tracking for the bot visor / tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const quickLinks = isAuthenticated
    ? [
        { label: 'Overview', to: '/dashboard', icon: ShieldCheck, desc: 'Your net worth & allocation' },
        { label: 'Holdings', to: '/assets', icon: Wallet, desc: 'Stocks, mutual funds, gold & FDs' },
        { label: 'Wealth Lab', to: '/calculators', icon: Calculator, desc: 'Tax, NPS, SIP & growth calculators' },
      ]
    : [
        { label: 'Home', to: '/landing', icon: Compass, desc: 'Explore Asset Hub platform' },
        { label: 'Sign in', to: '/login', icon: ShieldCheck, desc: 'Access your wealth account' },
        { label: 'Wealth Lab', to: '/calculators', icon: Calculator, desc: 'Free financial calculators' },
      ];

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none"
    >
      <style>{`
        @keyframes botFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(-1.5deg);
          }
        }
        @keyframes botShadowScale {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(0.72);
            opacity: 0.16;
          }
        }
        @keyframes thrusterPulse {
          0%, 100% {
            transform: scaleY(1);
            opacity: 0.9;
          }
          50% {
            transform: scaleY(0.65);
            opacity: 0.45;
          }
        }
        @keyframes eyeBlink {
          0%, 92%, 100% {
            transform: scaleY(1);
          }
          95% {
            transform: scaleY(0.12);
          }
        }
        @keyframes antennaGlow {
          0%, 100% {
            filter: drop-shadow(0 0 6px #38bdf8);
            opacity: 1;
          }
          50% {
            filter: drop-shadow(0 0 1px #0284c7);
            opacity: 0.55;
          }
        }
        .bot-hover-anim {
          animation: botFloat 3.8s ease-in-out infinite;
        }
        .bot-shadow-anim {
          animation: botShadowScale 3.8s ease-in-out infinite;
        }
        .thruster-anim {
          animation: thrusterPulse 1.4s ease-in-out infinite;
        }
        .eye-blink-anim {
          animation: eyeBlink 4.2s infinite;
          transform-origin: center;
        }
        .antenna-glow-anim {
          animation: antennaGlow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[380px] bg-sky-200/40 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-10 right-1/4 w-[360px] h-[260px] bg-amber-200/30 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/3 left-1/4 w-[280px] h-[280px] bg-indigo-100/40 rounded-full blur-2xl opacity-40" />
      </div>

      {/* Top Brand Bar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 z-10">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img src="/AssetHub_Logo.png" alt="Asset Hub" className="w-8 h-8 object-contain" />
          <span className="text-sm font-bold tracking-tight text-slate-900">Asset Hub</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-white/80 backdrop-blur-sm border border-slate-200/80 px-2.5 py-1 rounded-full shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            LOST_ROUTE_404
          </span>
        </div>
      </header>

      {/* Centerpiece: Interactive Bot & 404 Guide Card */}
      <main className="max-w-xl mx-auto w-full my-auto py-8 z-10">
        {/* Floating Bot Section */}
        <div className="flex flex-col items-center justify-center relative mb-4">
          {/* Interactive Speech Bubble */}
          <div
            onClick={cycleDialogue}
            className="cursor-pointer group mb-3 max-w-sm transition-all duration-300 hover:scale-[1.02]"
            title="Click to talk to AssetBot"
          >
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-md flex items-center gap-2.5 relative">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <Sparkles className="w-3 h-3 text-sky-500" />
              </span>
              <p className="text-xs text-slate-700 font-medium leading-snug">
                {BOT_DIALOGUES[dialogueIndex]}
              </p>
              <span className="flex-shrink-0 text-[10px] text-slate-400 font-mono flex items-center gap-0.5 group-hover:text-sky-600 transition-colors ml-1">
                <RotateCcw className="w-2.5 h-2.5" />
                tap
              </span>

              {/* Triangle pointer downward */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200/90 rotate-45" />
            </div>
          </div>

          {/* Hovering Bot Drone */}
          <div
            className="relative cursor-pointer transition-transform duration-200"
            onClick={cycleDialogue}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(600px) rotateY(${tilt.x * 0.7}deg) rotateX(${-tilt.y * 0.7}deg) scale(${
                isHovered ? 1.05 : 1
              })`,
            }}
          >
            <div className={`bot-hover-anim ${isWiggling ? 'animate-bounce' : ''}`}>
              <svg
                width="120"
                height="115"
                viewBox="0 0 120 115"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
              >
                <defs>
                  {/* Body Gradients */}
                  <linearGradient id="botChassis" x1="60" y1="20" x2="60" y2="82" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <linearGradient id="botVisor" x1="32" y1="38" x2="88" y2="68" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#020617" />
                    <stop offset="100%" stopColor="#0B132B" />
                  </linearGradient>
                  <linearGradient id="thrusterBeam" x1="60" y1="84" x2="60" y2="108" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#0284C7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="goldAcc" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </radialGradient>
                </defs>

                {/* Antenna */}
                <line x1="60" y1="22" x2="60" y2="11" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="60" cy="9" r="4.5" fill="#38BDF8" className="antenna-glow-anim" />

                {/* Thruster Jet Light (bottom) */}
                <path
                  d="M52 84 Q60 110 68 84 Z"
                  fill="url(#thrusterBeam)"
                  className="thruster-anim"
                  style={{ transformOrigin: '60px 84px' }}
                />

                {/* Left & Right Wing Thrusters / Float Pods */}
                <rect x="18" y="44" width="7" height="22" rx="3.5" fill="#334155" />
                <rect x="95" y="44" width="7" height="22" rx="3.5" fill="#334155" />
                <circle cx="21.5" cy="48" r="1.5" fill="#F59E0B" />
                <circle cx="98.5" cy="48" r="1.5" fill="#F59E0B" />

                {/* Main Bot Body (smooth pebble/capsule) */}
                <rect
                  x="26"
                  y="22"
                  width="68"
                  height="60"
                  rx="26"
                  fill="url(#botChassis)"
                  stroke="#475569"
                  strokeWidth="1.5"
                />

                {/* Subtle highlight sheen on chassis */}
                <path
                  d="M38 25 C45 23, 75 23, 82 25"
                  stroke="#94A3B8"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity="0.4"
                />

                {/* Glossy Visor Screen */}
                <rect
                  x="33"
                  y="35"
                  width="54"
                  height="34"
                  rx="14"
                  fill="url(#botVisor)"
                  stroke="#1E293B"
                  strokeWidth="1"
                />

                {/* Expressive LED Eyes with blink animation */}
                <g className="eye-blink-anim">
                  {/* Left Eye */}
                  <rect
                    x={43 + tilt.x * 0.25}
                    y={46 + tilt.y * 0.2}
                    width="11"
                    height="12"
                    rx="4.5"
                    fill="url(#eyeGlow)"
                    className="drop-shadow-[0_0_6px_#38bdf8]"
                  />
                  {/* Left Eye Pupil highlight */}
                  <circle cx={45.5 + tilt.x * 0.25} cy={48.5 + tilt.y * 0.2} r="1.5" fill="#FFFFFF" />

                  {/* Right Eye */}
                  <rect
                    x={66 + tilt.x * 0.25}
                    y={46 + tilt.y * 0.2}
                    width="11"
                    height="12"
                    rx="4.5"
                    fill="url(#eyeGlow)"
                    className="drop-shadow-[0_0_6px_#38bdf8]"
                  />
                  {/* Right Eye Pupil highlight */}
                  <circle cx={68.5 + tilt.x * 0.25} cy={48.5 + tilt.y * 0.2} r="1.5" fill="#FFFFFF" />
                </g>

                {/* Subtle digital smile */}
                <path
                  d={`M 55 ${60 + tilt.y * 0.1} Q 60 ${63 + tilt.y * 0.1} 65 ${60 + tilt.y * 0.1}`}
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.85"
                />

                {/* Asset Hub Gold Badge Accent on chest */}
                <circle cx="60" cy="74" r="3" fill="url(#goldAcc)" />
              </svg>
            </div>

            {/* Antigravity floating shadow */}
            <div className="w-16 h-2.5 mx-auto bg-slate-400/40 rounded-full blur-[2px] bot-shadow-anim mt-1" />
          </div>
        </div>

        {/* Card Content */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-sm relative">
          {/* Subtle Watermark Code */}
          <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-100">
            <span className="font-mono text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
              HTTP 404
            </span>
            <span className="text-[11px] font-mono text-slate-400">STATUS_UNRESOLVED</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Page not found
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            The requested financial resource or page could not be located. It may have been moved, renamed, or is temporarily unavailable.
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2.5 mb-7">
            <Link
              to={isAuthenticated ? '/dashboard' : '/'}
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Go to Homepage'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go back</span>
            </button>
          </div>

          {/* Useful Quick Destinations */}
          <div className="pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Popular destinations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">
                      {item.label}
                    </span>
                    <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 py-3 gap-2 z-10 border-t border-slate-200/60">
        <p>© {new Date().getFullYear()} Asset Hub. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/calculators" className="hover:text-slate-600 transition-colors">
            Wealth Lab
          </Link>
          <span className="text-slate-300">·</span>
          <Link to="/privacy" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </Link>
          <span className="text-slate-300">·</span>
          <Link to="/contact" className="hover:text-slate-600 transition-colors">
            Help & Support
          </Link>
        </div>
      </footer>
    </div>
  );
}
