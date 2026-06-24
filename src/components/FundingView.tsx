import type { ProjectRow, FundingMechanic } from '../types';

interface Props {
  rows: ProjectRow[];
}

const MECHANIC_LABELS: Record<FundingMechanic, string> = {
  CustomerFundRelease: 'Customer Fund Release',
  SignedInvoiceToLender: 'Signed Invoice to Lender',
  ChequeSignedOver: 'Cheque Signed Over',
  PortalDisbursement: 'Portal Disbursement',
};

const MECHANIC_DESC: Record<FundingMechanic, string> = {
  CustomerFundRelease: 'Lender (Financeit, LendingClub, Watercress) releases funds directly to customer. Jetson invoices customer.',
  SignedInvoiceToLender: 'Jetson sends a signed invoice to Renu (CO). Renu pays Jetson directly.',
  ChequeSignedOver: 'MassSave (MA) issues a cheque to the customer who signs it over to Jetson at install.',
  PortalDisbursement: 'Funds are requested and released via the lender portal (GoGreen CA, NYSERDA NY).',
};

const MECHANIC_COLOR: Record<FundingMechanic, string> = {
  CustomerFundRelease: 'border-blue-200 bg-blue-50',
  SignedInvoiceToLender: 'border-green-200 bg-green-50',
  ChequeSignedOver: 'border-purple-200 bg-purple-50',
  PortalDisbursement: 'border-orange-200 bg-orange-50',
};

const MECHANIC_HEADER: Record<FundingMechanic, string> = {
  CustomerFundRelease: 'bg-blue-100 text-blue-800',
  SignedInvoiceToLender: 'bg-green-100 text-green-800',
  ChequeSignedOver: 'bg-purple-100 text-purple-800',
  PortalDisbursement: 'bg-orange-100 text-orange-800',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const FUNDING_STATUS_ORDER: Record<string, number> = {
  RequestFunds: 0,
  Funded: 1,
  Reconciled: 2,
  NotFunded: 3,
};

export function FundingView({ rows }: Props) {
  const pending = rows.filter(
    (r) => r.financing.fundingStatus === 'RequestFunds' || r.financing.fundingStatus === 'Funded',
  );

  const byMechanic: Partial<Record<FundingMechanic, typeof pending>> = {};
  for (const row of pending) {
    const m = row.financing.fundingMechanic;
    if (!byMechanic[m]) byMechanic[m] = [];
    byMechanic[m]!.push(row);
  }

  const mechanics = Object.keys(byMechanic) as FundingMechanic[];

  if (pending.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-3">💰</div>
        <p className="text-lg font-semibold text-gray-700">No records awaiting funding or reconciliation.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-800">Funding & Reconciliation</h2>
        <p className="text-sm text-gray-500 mt-1">
          Records in <strong>RequestFunds</strong> or <strong>Funded-not-reconciled</strong> state,
          grouped by funding mechanic. Finance team reconciles cash manually against funding reports.
        </p>
      </div>

      <div className="space-y-6">
        {mechanics.map((mechanic) => {
          const group = byMechanic[mechanic]!;
          const sorted = [...group].sort(
            (a, b) => FUNDING_STATUS_ORDER[a.financing.fundingStatus] - FUNDING_STATUS_ORDER[b.financing.fundingStatus],
          );
          const totalAmount = group.reduce((s, r) => s + r.financing.loanAmount, 0);
          const requestCount = group.filter((r) => r.financing.fundingStatus === 'RequestFunds').length;
          const fundedCount = group.filter((r) => r.financing.fundingStatus === 'Funded').length;

          return (
            <div key={mechanic} className={`rounded-xl border-2 ${MECHANIC_COLOR[mechanic]}`}>
              <div className={`px-5 py-3 rounded-t-xl flex items-center justify-between flex-wrap gap-2 ${MECHANIC_HEADER[mechanic]}`}>
                <div>
                  <span className="font-bold text-sm">{MECHANIC_LABELS[mechanic]}</span>
                  <p className="text-xs mt-0.5 opacity-80">{MECHANIC_DESC[mechanic]}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{fmt(totalAmount)}</div>
                  <div className="text-xs opacity-80">
                    {requestCount > 0 && <span>{requestCount} requesting · </span>}
                    {fundedCount > 0 && <span>{fundedCount} awaiting reconciliation</span>}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Project</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Market</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Lender</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Loan $</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Rebate Stage</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Funding Status</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">App Ref</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">CS Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {sorted.map((row) => {
                      const f = row.financing;
                      const needsRecon = f.fundingStatus === 'Funded';
                      return (
                        <tr key={f.id} className={needsRecon ? 'bg-yellow-50' : ''}>
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-gray-900">{f.projectName}</div>
                            <div className="text-xs text-gray-400">{f.customerName}</div>
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{f.market}</td>
                          <td className="px-4 py-2.5 text-gray-700">{f.lender}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-700">{fmt(f.loanAmount)}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">{f.rebateStage}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            {f.fundingStatus === 'RequestFunds' ? (
                              <span className="text-xs bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded-full">⏳ Request Funds</span>
                            ) : (
                              <span className="text-xs bg-yellow-100 text-yellow-800 font-semibold px-2 py-0.5 rounded-full">Funded — Reconcile</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{f.applicationReference ?? '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-600">{f.ownerCS}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
