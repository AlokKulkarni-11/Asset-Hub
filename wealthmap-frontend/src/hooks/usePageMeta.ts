import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_META_MAP: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Dashboard — Asset Hub',
    description: 'Track your overall wealth, asset allocation, net worth trends, and portfolio metrics in real time.',
  },
  '/assets': {
    title: 'Assets Portfolio — Asset Hub',
    description: 'Manage your physical gold, fixed deposits, stocks, mutual funds, real estate, crypto, and bonds.',
  },
  '/liabilities': {
    title: 'Liabilities & Loans — Asset Hub',
    description: 'Track loans, mortgages, credit card debt, and projected amortization schedules with exact financial math.',
  },
  '/goals': {
    title: 'Goals & Financial Planning — Asset Hub',
    description: 'Plan milestone goals, retirement readiness, and systematic withdrawal plans (SWP).',
  },
  '/assistant': {
    title: 'Hub Mate AI Assistant — Asset Hub',
    description: 'Chat with Hub Mate, your AI financial assistant grounded in real portfolio calculations.',
  },
  '/family': {
    title: 'Family Office & Rollups — Asset Hub',
    description: 'Collaborate with family members, share milestone goals, and view consolidated family net worth.',
  },
  '/maturities': {
    title: 'Upcoming Maturities — Asset Hub',
    description: 'Monitor upcoming fixed deposit maturities, bond payouts, and loan payoff dates.',
  },
  '/profile': {
    title: 'Account & Security — Asset Hub',
    description: 'Manage profile settings, two-factor authentication (2FA), and security preferences.',
  },
  '/privacy': {
    title: 'Privacy Policy & Data Security — Asset Hub',
    description: 'Learn how Asset Hub protects your financial data, encryption standards, and third-party integrations.',
  },
  '/login': {
    title: 'Sign In — Asset Hub',
    description: 'Securely sign in to your Asset Hub wealth portfolio.',
  },
  '/register': {
    title: 'Create Account — Asset Hub',
    description: 'Start tracking your comprehensive net worth and investments with Asset Hub.',
  },
};

export function usePageMeta() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    const meta = PAGE_META_MAP[pathname] || {
      title: 'Asset Hub — Premium Wealth & Portfolio Tracker',
      description: 'Comprehensive personal wealth tracking with live valuations, liabilities amortization, and AI intelligence.',
    };

    document.title = meta.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', meta.description);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', meta.description);
      document.head.appendChild(metaDesc);
    }

    // Update OpenGraph Title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);

    // Update OpenGraph Description
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);
  }, [location.pathname]);
}
