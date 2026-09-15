import { AssetResponse } from '../api/assets.api';
import { LiabilityResponse } from '../api/liabilities.api';

export interface ExportDataParams {
  assets?: AssetResponse[];
  liabilities?: LiabilityResponse[];
  analytics?: any;
  userName?: string;
  familyName?: string;
}

export const formatCurrencyINR = (num?: number): string => {
  if (num === undefined || num === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const exportToCsv = ({
  assets = [],
  liabilities = [],
  analytics,
  userName = 'User',
  familyName,
}: ExportDataParams) => {
  const totalAssets = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalInvested = assets.reduce((sum, a) => sum + (a.investedAmount || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;
  const totalGain = totalAssets - totalInvested;
  const overallReturn = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const debtToAsset = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  const todayStr = new Date().toISOString().split('T')[0];

  const escapeCsv = (str?: string | number | null) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[] = [];

  // UTF-8 Byte Order Mark for proper Excel rendering
  const BOM = '\uFEFF';

  // 1. EXECUTIVE SUMMARY
  rows.push('ASSET HUB — WEALTH PORTFOLIO REPORT');
  rows.push(`Generated On,${escapeCsv(new Date().toLocaleString('en-IN'))}`);
  rows.push(`Account Holder,${escapeCsv(userName)}`);
  if (familyName) {
    rows.push(`Family Group,${escapeCsv(familyName)}`);
  }
  rows.push('');
  rows.push('EXECUTIVE SUMMARY');
  rows.push('Metric,Amount (INR)');
  rows.push(`Total Net Worth,${netWorth.toFixed(2)}`);
  rows.push(`Total Assets Value,${totalAssets.toFixed(2)}`);
  rows.push(`Total Invested Capital,${totalInvested.toFixed(2)}`);
  rows.push(`Total Unrealized Gain / Loss,${totalGain.toFixed(2)}`);
  rows.push(`Overall Portfolio Return (%),${overallReturn.toFixed(2)}%`);
  rows.push(`Total Outstanding Liabilities,${totalLiabilities.toFixed(2)}`);
  rows.push(`Debt-to-Asset Ratio (%),${debtToAsset.toFixed(2)}%`);
  rows.push('');

  // 2. ASSET HOLDINGS
  rows.push('DETAILED ASSET HOLDINGS');
  rows.push([
    'Asset Name',
    'Asset Type',
    'Owner',
    'Native Currency',
    'Native Invested',
    'Native Current Value',
    'FX Exchange Rate (to INR)',
    'Invested Amount (INR)',
    'Current Value (INR)',
    'Net Gain/Loss (INR)',
    'Gain/Loss (%)',
    'Nominee Name',
    'Nominee Relationship',
    'Purchase / Issue Date',
    'Notes'
  ].map(escapeCsv).join(','));

  assets.forEach((a) => {
    const isForeign = a.currency && a.currency !== 'INR';
    const gainLoss = (a.currentValue || 0) - (a.investedAmount || 0);
    const gainPct = a.investedAmount && a.investedAmount > 0 
      ? (gainLoss / a.investedAmount) * 100 
      : 0;

    let dateStr = '';
    if (a.purchaseDate) {
      if (Array.isArray(a.purchaseDate)) {
        dateStr = a.purchaseDate.join('-');
      } else {
        dateStr = String(a.purchaseDate).split('T')[0];
      }
    }

    rows.push([
      escapeCsv(a.name || 'Unnamed Asset'),
      escapeCsv(a.assetType || 'OTHER'),
      escapeCsv(a.familyMemberName || userName),
      escapeCsv(a.currency || 'INR'),
      escapeCsv(isForeign ? a.originalInvestedAmount : a.investedAmount),
      escapeCsv(isForeign ? a.originalCurrentValue : a.currentValue),
      escapeCsv(isForeign ? a.exchangeRate : 1.0),
      escapeCsv(a.investedAmount?.toFixed(2) || '0.00'),
      escapeCsv(a.currentValue?.toFixed(2) || '0.00'),
      escapeCsv(gainLoss.toFixed(2)),
      escapeCsv(`${gainPct.toFixed(2)}%`),
      escapeCsv(a.nomineeName || 'N/A'),
      escapeCsv(a.nomineeRelationship || 'N/A'),
      escapeCsv(dateStr),
      escapeCsv(a.notes || '')
    ].join(','));
  });

  rows.push('');

  // 3. LIABILITIES SCHEDULE
  if (liabilities.length > 0) {
    rows.push('OUTSTANDING LIABILITIES & DEBT SCHEDULE');
    rows.push([
      'Liability Name',
      'Liability Type',
      'Lender / Bank',
      'Principal Amount (INR)',
      'Remaining Balance (INR)',
      'Interest Rate (% p.a.)',
      'Monthly EMI (INR)',
      'Start Date',
      'Projected Payoff Date',
      'Notes'
    ].map(escapeCsv).join(','));

    liabilities.forEach((l) => {
      rows.push([
        escapeCsv(l.name || 'Unnamed Liability'),
        escapeCsv(l.liabilityType || 'OTHER'),
        escapeCsv(l.lenderName || 'N/A'),
        escapeCsv(l.principalAmount?.toFixed(2) || '0.00'),
        escapeCsv(l.outstandingBalance?.toFixed(2) || '0.00'),
        escapeCsv(l.interestRate ? `${l.interestRate}%` : 'N/A'),
        escapeCsv(l.emi?.toFixed(2) || '0.00'),
        escapeCsv(l.startDate ? String(l.startDate).split('T')[0] : ''),
        escapeCsv(l.tenureMonths ? `${l.tenureMonths} Months` : ''),
        escapeCsv(l.notes || '')
      ].join(','));
    });

    rows.push('');
  }

  // 4. ASSET CLASS ALLOCATION
  const allocationMap: Record<string, number> = {};
  assets.forEach((a) => {
    const t = a.assetType || 'OTHER';
    allocationMap[t] = (allocationMap[t] || 0) + (a.currentValue || 0);
  });

  rows.push('ASSET ALLOCATION BREAKDOWN');
  rows.push('Asset Category,Current Value (INR),Allocation (%)');
  Object.entries(allocationMap).forEach(([cat, val]) => {
    const pct = totalAssets > 0 ? (val / totalAssets) * 100 : 0;
    rows.push(`${escapeCsv(cat)},${val.toFixed(2)},${pct.toFixed(2)}%`);
  });

  const csvContent = BOM + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `AssetHub_Portfolio_Report_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPdf = ({
  assets = [],
  liabilities = [],
  analytics,
  userName = 'User',
  familyName,
}: ExportDataParams) => {
  const totalAssets = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalInvested = assets.reduce((sum, a) => sum + (a.investedAmount || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;
  const totalGain = totalAssets - totalInvested;
  const overallReturn = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
  const debtToAsset = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the printable PDF statement.');
    return;
  }

  const assetRowsHtml = assets
    .map((a, idx) => {
      const isForeign = a.currency && a.currency !== 'INR';
      const gainLoss = (a.currentValue || 0) - (a.investedAmount || 0);
      const isPositive = gainLoss >= 0;
      return `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">
            ${a.name || 'Unnamed Asset'}
            ${isForeign ? `<span style="font-size: 10px; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 700;">${a.currency}</span>` : ''}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 12px;">${a.assetType || 'OTHER'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 12px;">${a.familyMemberName || userName}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155; font-size: 12px;">${formatCurrencyINR(a.investedAmount)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a; font-size: 12px;">${formatCurrencyINR(a.currentValue)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: ${isPositive ? '#16a34a' : '#dc2626'}; font-size: 12px;">
            ${isPositive ? '+' : ''}${formatCurrencyINR(gainLoss)} (${a.gainPercent ? a.gainPercent.toFixed(1) : '0'}%)
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">
            ${a.nomineeName ? `${a.nomineeName} ${a.nomineeRelationship ? `(${a.nomineeRelationship})` : ''}` : '—'}
          </td>
        </tr>
      `;
    })
    .join('');

  const liabilityRowsHtml = liabilities.length > 0 ? liabilities
    .map((l, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${l.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 12px;">${l.liabilityType}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 12px;">${l.lenderName || '—'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155; font-size: 12px;">${formatCurrencyINR(l.principalAmount)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #dc2626; font-size: 12px;">${formatCurrencyINR(l.outstandingBalance)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 12px;">${l.interestRate ? `${l.interestRate}%` : '—'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: 600; font-size: 12px;">${formatCurrencyINR(l.emi)}</td>
      </tr>
    `)
    .join('') : '';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Asset Hub — Portfolio Statement (${todayStr})</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 20px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .logo-title {
          font-size: 24px;
          font-weight: 800;
          color: #0284c7;
          letter-spacing: -0.5px;
        }
        .meta-text {
          font-size: 12px;
          color: #64748b;
          text-align: right;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .summary-card {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 12px;
        }
        .card-label {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 600;
          color: #0284c7;
          margin-bottom: 4px;
        }
        .card-value {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }
        .section-heading {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 20px 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-left: 4px solid #0284c7;
          padding-left: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        th {
          background: #0284c7;
          color: #ffffff;
          text-align: left;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #94a3b8;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 10px 20px; font-weight: 600; border-radius: 6px; cursor: pointer;">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="header">
        <div>
          <div class="logo-title">Asset Hub</div>
          <div style="font-size: 13px; color: #475569; font-weight: 500;">Executive Wealth & Portfolio Statement</div>
        </div>
        <div class="meta-text">
          <div><strong>Holder:</strong> ${userName}</div>
          ${familyName ? `<div><strong>Family:</strong> ${familyName}</div>` : ''}
          <div><strong>Date:</strong> ${todayStr}</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-label">True Net Worth</div>
          <div class="card-value" style="color: #0284c7;">${formatCurrencyINR(netWorth)}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Total Assets</div>
          <div class="card-value">${formatCurrencyINR(totalAssets)}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Total Liabilities</div>
          <div class="card-value" style="color: #dc2626;">${formatCurrencyINR(totalLiabilities)}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Unrealized Gain / Return</div>
          <div class="card-value" style="color: ${totalGain >= 0 ? '#16a34a' : '#dc2626'}; font-size: 15px;">
            ${totalGain >= 0 ? '+' : ''}${formatCurrencyINR(totalGain)} (${overallReturn.toFixed(1)}%)
          </div>
        </div>
      </div>

      <div class="section-heading">Detailed Asset Holdings (${assets.length})</div>
      <table>
        <thead>
          <tr>
            <th>Asset Name</th>
            <th>Type</th>
            <th>Owner</th>
            <th style="text-align: right;">Invested (₹)</th>
            <th style="text-align: right;">Current (₹)</th>
            <th style="text-align: right;">Net Gain</th>
            <th>Nominee</th>
          </tr>
        </thead>
        <tbody>
          ${assetRowsHtml || '<tr><td colspan="7" style="padding: 12px; text-align: center; color: #64748b;">No assets found.</td></tr>'}
        </tbody>
      </table>

      ${liabilities.length > 0 ? `
        <div class="section-heading">Outstanding Liabilities (${liabilities.length})</div>
        <table>
          <thead>
            <tr>
              <th>Liability Name</th>
              <th>Type</th>
              <th>Lender</th>
              <th style="text-align: right;">Principal (₹)</th>
              <th style="text-align: right;">Outstanding (₹)</th>
              <th style="text-align: right;">Rate</th>
              <th style="text-align: right;">Monthly EMI</th>
            </tr>
          </thead>
          <tbody>
            ${liabilityRowsHtml}
          </tbody>
        </table>
      ` : ''}

      <div class="footer">
        <div>Generated by Asset Hub — Personal & Family Wealth Operating System</div>
        <div>Confidential Financial Statement</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
