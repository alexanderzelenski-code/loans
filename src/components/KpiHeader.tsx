import type { ProjectRow } from '../types';

interface Props {
  rows: ProjectRow[];
}

export function KpiHeader({ rows }: Props) {
  const atRiskCount = rows.filter((r) => r.isAtRisk).length;
  const totalLoan = rows.reduce((s, r) => s + r.financing.loanAmount, 0);

  const byApproval = {
    NotStarted: rows.filter((r) => r.financing.approvalStatus === 'NotStarted').length,
    Pending: rows.filter((r) => r.financing.approvalStatus === 'Pending').length,
    Approved: rows.filter((r) => r.financing.approvalStatus === 'Approved').length,
    Declined: rows.filter((r) => r.financing.approvalStatus === 'Declined').length,
  };

  const byRebate = {
    NotStarted: rows.filter((r) => r.financing.rebateStage === 'NotStarted').length,
    ApplicationSent: rows.filter((r) => r.financing.rebateStage === 'ApplicationSent').length,
    Qualified: rows.filter((r) => r.financing.rebateStage === 'Qualified').length,
    RequestFunds: rows.filter((r) => r.financing.rebateStage === 'RequestFunds').length,
    Funded: rows.filter((r) => r.financing.rebateStage === 'Funded').length,
  };

  const awaitingFunding = rows.filter((r) => r.financing.fundingStatus === 'RequestFunds').length;
  const awaitingReconciliation = rows.filter((r) => r.financing.fundingStatus === 'Funded').length;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {/* AT RISK — headline metric */}
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">At-Risk Installs</span>
          <span className="text-4xl font-bold text-red-600">{atRiskCount}</span>
          <span className="text-xs text-red-500 mt-1">Financing gate not cleared</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Total Financed Pipeline</span>
          <span className="text-2xl font-bold text-blue-700">{fmt(totalLoan)}</span>
          <span className="text-xs text-blue-500 mt-1">{rows.length} projects</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Awaiting Funding</span>
          <span className="text-3xl font-bold text-amber-700">{awaitingFunding}</span>
          <span className="text-xs text-amber-600 mt-1">RequestFunds stage</span>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">Awaiting Reconciliation</span>
          <span className="text-3xl font-bold text-purple-700">{awaitingReconciliation}</span>
          <span className="text-xs text-purple-600 mt-1">Funded, not reconciled</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Approval Status</p>
          <div className="flex gap-3 flex-wrap">
            <Pill label="Not Started" count={byApproval.NotStarted} color="gray" />
            <Pill label="Pending" count={byApproval.Pending} color="yellow" />
            <Pill label="Approved" count={byApproval.Approved} color="green" />
            <Pill label="Declined" count={byApproval.Declined} color="red" />
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rebate Stage</p>
          <div className="flex gap-3 flex-wrap">
            <Pill label="Not Started" count={byRebate.NotStarted} color="gray" />
            <Pill label="App Sent" count={byRebate.ApplicationSent} color="yellow" />
            <Pill label="Qualified" count={byRebate.Qualified} color="blue" />
            <Pill label="Req Funds" count={byRebate.RequestFunds} color="orange" />
            <Pill label="Funded" count={byRebate.Funded} color="green" />
          </div>
        </div>
      </div>
    </div>
  );
}

type PillColor = 'gray' | 'yellow' | 'green' | 'red' | 'blue' | 'orange';

const pillStyles: Record<PillColor, string> = {
  gray: 'bg-gray-100 text-gray-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  orange: 'bg-orange-100 text-orange-800',
};

function Pill({ label, count, color }: { label: string; count: number; color: PillColor }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${pillStyles[color]}`}>
      <span className="font-bold">{count}</span>
      {label}
    </span>
  );
}
