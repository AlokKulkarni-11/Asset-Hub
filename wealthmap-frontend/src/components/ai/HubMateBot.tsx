import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';

interface HubMateBotProps {
  size?: 'mini' | 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  interactive?: boolean;
  showDialogue?: boolean;
  dialogueText?: string;
  onDialogueClick?: () => void;
  className?: string;
}

export const HubMateBot: React.FC<HubMateBotProps> = ({
  size = 'md',
  isThinking = false,
  interactive = true,
  showDialogue = false,
  dialogueText,
  onDialogueClick,
  className = '',
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [wiggling, setWiggling] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const triggerWiggle = () => {
    if (!interactive) return;
    setWiggling(true);
    if (onDialogueClick) onDialogueClick();
    setTimeout(() => setWiggling(false), 600);
  };

  // Dimensions based on size
  const dimMap = {
    mini: { width: 32, height: 32, viewBox: '0 0 120 115', showShadow: false },
    sm: { width: 48, height: 48, viewBox: '0 0 120 115', showShadow: false },
    md: { width: 96, height: 92, viewBox: '0 0 120 115', showShadow: true },
    lg: { width: 124, height: 118, viewBox: '0 0 120 115', showShadow: true },
  };

  const { width, height, viewBox, showShadow } = dimMap[size] || dimMap.md;

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      <style>{`
        @keyframes hubBotFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(-1.2deg);
          }
        }
        @keyframes hubShadowScale {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(0.72);
            opacity: 0.16;
          }
        }
        @keyframes hubThruster {
          0%, 100% {
            transform: scaleY(1);
            opacity: 0.9;
          }
          50% {
            transform: scaleY(0.65);
            opacity: 0.45;
          }
        }
        @keyframes hubEyeBlink {
          0%, 92%, 100% {
            transform: scaleY(1);
          }
          95% {
            transform: scaleY(0.1);
          }
        }
        @keyframes hubScanBeam {
          0% {
            transform: translateX(-40px);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateX(40px);
            opacity: 0;
          }
        }
        .hub-float-anim {
          animation: hubBotFloat 3.5s ease-in-out infinite;
        }
        .hub-shadow-anim {
          animation: hubShadowScale 3.5s ease-in-out infinite;
        }
        .hub-thruster-anim {
          animation: hubThruster 1.2s ease-in-out infinite;
        }
        .hub-eye-blink {
          animation: hubEyeBlink 4s infinite;
          transform-origin: center;
        }
        .hub-scanner-anim {
          animation: hubScanBeam 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Optional Speech Bubble above bot */}
      {showDialogue && dialogueText && (
        <div
          onClick={triggerWiggle}
          className="cursor-pointer group mb-2.5 max-w-xs transition-all duration-300 hover:scale-[1.02] z-20"
          title="Click to interact with Hub Mate"
        >
          <div className="bg-white/95 backdrop-blur-md border border-indigo-100 rounded-2xl px-3.5 py-2 shadow-md flex items-center gap-2 relative text-left">
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
            </span>
            <p className="text-[11px] sm:text-xs text-slate-700 font-medium leading-tight">
              {dialogueText}
            </p>
            <span className="flex-shrink-0 text-[9px] text-slate-400 font-mono flex items-center gap-0.5 group-hover:text-indigo-600 transition-colors ml-0.5">
              <RotateCcw className="w-2 h-2" />
            </span>
            {/* Pointer arrow down */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r border-b border-indigo-100 rotate-45" />
          </div>
        </div>
      )}

      {/* Main Bot SVG Container */}
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onClick={triggerWiggle}
        className={`${interactive ? 'cursor-pointer' : ''} transition-transform duration-200`}
        style={{
          transform: interactive
            ? `perspective(600px) rotateY(${tilt.x * 0.6}deg) rotateX(${-tilt.y * 0.6}deg) scale(${
                isHovered ? 1.05 : 1
              })`
            : undefined,
        }}
      >
        <div className={`${size !== 'mini' ? 'hub-float-anim' : ''} ${wiggling ? 'animate-bounce' : ''}`}>
          <svg
            width={width}
            height={height}
            viewBox={viewBox}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md overflow-visible"
          >
            <defs>
              {/* Chassis metallic gradient */}
              <linearGradient id={`hubChassis_${size}`} x1="60" y1="20" x2="60" y2="82" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1E1B4B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              {/* Visor deep glossy dark screen */}
              <linearGradient id={`hubVisor_${size}`} x1="32" y1="38" x2="88" y2="68" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#020617" />
                <stop offset="100%" stopColor="#0B132B" />
              </linearGradient>

              {/* Glowing thruster jet beam */}
              <linearGradient id={`hubThrusterBeam_${size}`} x1="60" y1="84" x2="60" y2="108" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#4F46E5" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
              </linearGradient>

              {/* Gold badge accent */}
              <linearGradient id={`hubGold_${size}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>

              {/* Eye radial glow */}
              <radialGradient id={`hubEyeGlow_${size}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#A5B4FC" />
                <stop offset="100%" stopColor="#6366F1" />
              </radialGradient>
            </defs>

            {/* Antenna Stalk & Glowing Beacon Bulb */}
            <line x1="60" y1="22" x2="60" y2="10" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
            <circle
              cx="60"
              cy="8"
              r="4.5"
              fill={isThinking ? '#F59E0B' : '#818CF8'}
              className="drop-shadow-[0_0_8px_#6366f1] animate-pulse"
            />

            {/* Thruster Jet Flame underneath */}
            {size !== 'mini' && (
              <path
                d="M52 84 Q60 110 68 84 Z"
                fill={`url(#hubThrusterBeam_${size})`}
                className="hub-thruster-anim"
                style={{ transformOrigin: '60px 84px' }}
              />
            )}

            {/* Left & Right Wing Pods / Float Stabilizers */}
            <rect x="18" y="44" width="7" height="22" rx="3.5" fill="#334155" />
            <rect x="95" y="44" width="7" height="22" rx="3.5" fill="#334155" />
            <circle cx="21.5" cy="48" r="1.5" fill="#F59E0B" />
            <circle cx="98.5" cy="48" r="1.5" fill="#F59E0B" />

            {/* Main Robot Body Shell */}
            <rect
              x="26"
              y="22"
              width="68"
              height="60"
              rx="26"
              fill={`url(#hubChassis_${size})`}
              stroke="#4338CA"
              strokeWidth="1.5"
            />

            {/* Subtle top sheen reflection */}
            <path
              d="M38 25 C45 23, 75 23, 82 25"
              stroke="#C7D2FE"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.35"
            />

            {/* Glossy Visor Screen */}
            <rect
              x="33"
              y="35"
              width="54"
              height="34"
              rx="14"
              fill={`url(#hubVisor_${size})`}
              stroke="#312E81"
              strokeWidth="1"
            />

            {/* When Thinking: Active Scanning Beam across visor */}
            {isThinking && (
              <g clipPath="url(#visorClip)">
                <rect
                  x="35"
                  y="36"
                  width="18"
                  height="32"
                  fill="#818CF8"
                  opacity="0.3"
                  className="hub-scanner-anim"
                />
              </g>
            )}

            {/* Expressive LED Eyes */}
            <g className={isThinking ? 'animate-pulse' : 'hub-eye-blink'}>
              {/* Left Eye */}
              <rect
                x={43 + (interactive ? tilt.x * 0.25 : 0)}
                y={46 + (interactive ? tilt.y * 0.2 : 0)}
                width="11"
                height="12"
                rx="4.5"
                fill={`url(#hubEyeGlow_${size})`}
                className="drop-shadow-[0_0_6px_#818cf8]"
              />
              <circle
                cx={45.5 + (interactive ? tilt.x * 0.25 : 0)}
                cy={48.5 + (interactive ? tilt.y * 0.2 : 0)}
                r="1.5"
                fill="#FFFFFF"
              />

              {/* Right Eye */}
              <rect
                x={66 + (interactive ? tilt.x * 0.25 : 0)}
                y={46 + (interactive ? tilt.y * 0.2 : 0)}
                width="11"
                height="12"
                rx="4.5"
                fill={`url(#hubEyeGlow_${size})`}
                className="drop-shadow-[0_0_6px_#818cf8]"
              />
              <circle
                cx={68.5 + (interactive ? tilt.x * 0.25 : 0)}
                cy={48.5 + (interactive ? tilt.y * 0.2 : 0)}
                r="1.5"
                fill="#FFFFFF"
              />
            </g>

            {/* Digital Mouth / Smile or Processing wave */}
            {isThinking ? (
              <path
                d="M 52 61 Q 56 58 60 61 T 68 61"
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <path
                d={`M 55 ${60 + (interactive ? tilt.y * 0.1 : 0)} Q 60 ${63 + (interactive ? tilt.y * 0.1 : 0)} 65 ${
                  60 + (interactive ? tilt.y * 0.1 : 0)
                }`}
                stroke="#A5B4FC"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.9"
              />
            )}

            {/* Asset Hub Emblem Chest Badge */}
            <circle cx="60" cy="74" r="3" fill={`url(#hubGold_${size})`} />
          </svg>
        </div>

        {/* Antigravity floating shadow */}
        {showShadow && (
          <div className="w-14 h-2 mx-auto bg-slate-400/30 rounded-full blur-[2px] hub-shadow-anim mt-1" />
        )}
      </div>
    </div>
  );
};

export default HubMateBot;
