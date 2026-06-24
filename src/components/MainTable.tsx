import { useState, useMemo } from 'react';
import type { ProjectRow } from '../types';

interface Props {
  rows: ProjectRow[];
}

type SortKey = 'projectName' | 'market' | 'lender' | 'tier' | 'loanAmount' | 'approvalStatus' | 'rebateStage' | 'installStage' | 'scheduledDate';

const APPROVAL_COLOR: Record<string, string> = {
  NotStarted: 'bg-gray-100 text-gray-600',
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-green-100 text-green-800',
  Declined: 'bg-red-100 text-red-800',
};

const REBATE_COLOR: Record<string, string> = {
  NotStarted: 'bg-gray-100 text-gray-600',
  ApplicationSent: 'bg-yellow-100 text-yellow-800',
  Qualified: 'bg-blue-100 text-blue-800',
  RequestFunds: 'bg-orange-100 text-orange-800',
  Funded: 'bg-green-100 text-green-800',
};

const INSTALL_COLOR: Record<string, string> = {
  SavingRequired: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  ReadyForInstall: 'bg-blue-100 text-blue-700',
  Scheduled: 'bg-indigo-100 text-indigo-800',
  Installed: 'bg-green-100 text-green-800',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const ALL = 'All';

export function MainTable({ rows }: Props) {
  const [marketFilter, setMarketFilter] = useState<string>(ALL);
  const [lenderFilter, setLenderFilter] = useState<string>(ALL);
  const [approvalFilter, setApprovalFilter] = useState<string>(ALL);
  const [installFilter, setInstallFilter] = useState<string>(ALL);
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('projectName');
  const [sortAsc, setSortAsc] = useState(true);

  const markets = useMemo(() => [ALL, ...Array.from(new Set(rows.map((r) => r.financing.market))).sort()], [rows]);
  const lenders = useMemo(() => [ALL, ...Array.from(new Set(rows.map((r) => r.financing.lender))).sort()], [rows]);
  const approvals = useMemo(() => [ALL, 'NotStarted', 'Pending', 'Approved', 'Declined'], []);
  const installStages = useMemo(() => [ALL, 'SavingRequired', 'Pending', 'ReadyForInstall', 'Scheduled', 'Installed'], []);

  const filtered = useMemo(() => {
    let result = rows;
    if (marketFilter !== ALL) result = result.filter((r) => r.financing.market === marketFilter);
    if (lenderFilter !== ALL) result = result.filter((r) => r.financing.lender === lenderFilter);
    if (approvalFilter !== ALL) result = result.filter((r) => r.financing.approvalStatus === approvalFilter);
    if (installFilter !== ALL) result = result.filter((r) => r.installation.stage === installFilter);
    if (atRiskOnly) result = result.filter((r) => r.isAtRisk);
    return result;
  }, [rows, marketFilter, lenderFilter, approvalFilter, installFilter, atRiskOnly]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (sortKey) {
        case 'projectName': va = a.financing.projectName; vb = b.financing.projectName; break;
        case 'market': va = a.financing.market; vb = b.financing.market; break;
        case 'lender': va = a.financing.lender; vb = b.financing.lender; break;
        case 'tier': va = a.financing.tier; vb = b.financing.tier; break;
        case 'loanAmount': va = a.financing.loanAmount; vb = b.financing.loanAmount; break;
        case 'approvalStatus': va = a.financing.approvalStatus; vb = b.financing.approvalStatus; break;
        case 'rebateStage': va = a.financing.rebateStage; vb = b.financing.rebateStage; break;
        case 'installStage': va = a.installation.stage; vb = b.installation.stage; break;
        case 'scheduledDate': va = a.installation.scheduledInstallDate ?? ''; vb = b.installation.scheduledInstallDate ?? ''; break;
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  function Th({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <th
        className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap hover:text-gray-800 select-none"
        onClick={() => toggleSort(k)}
      >
        {label} {active ? (sortAsc ? '↑' : '↓') : ''}
      </th>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex flex-wrap gap-3 items-center">
        <FilterSelect label="Market" value={marketFilter} options={markets} onChange={setMarketFilter} />
        <FilterSelect label="Lender" value={lenderFilter} options={lenders} onChange={setLenderFilter} />
        <FilterSelect label="Approval" value={approvalFilter} options={approvals} onChange={setApprovalFilter} />
        <FilterSelect label="Install Stage" value={installFilter} options={installStages} onChange={setInstallFilter} />
        <label className="flex items-center gap-2 cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={atRiskOnly}
            onChange={(e) => setAtRiskOnly(e.target.checked)}
            className="w-4 h-4 accent-red-600"
          />
          <span className="text-sm font-medium text-red-700">At-Risk only</span>
        </label>
        <span className="ml-auto text-xs text-gray-500">{sorted.length} of {rows.length} records</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <Th label="Project" k="projectName" />
              <Th label="Market" k="market" />
              <Th label="Lender" k="lender" />
              <Th label="Tier" k="tier" />
              <Th label="Loan $" k="loanAmount" />
              <Th label="Approval" k="approvalStatus" />
              <Th label="Rebate Stage" k="rebateStage" />
              <Th label="Install Stage" k="installStage" />
              <Th label="Sched. Date" k="scheduledDate" />
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((row) => (
              <tr
                key={row.installation.id}
                className={`hover:bg-gray-50 transition-colors ${row.isAtRisk ? 'bg-red-50 hover:bg-red-100' : ''}`}
              >
                <td className="px-3 py-2.5">
                  <div className="font-medium text-gray-900 whitespace-nowrap">{row.financing.projectName}</div>
                  <div className="text-xs text-gray-500">{row.financing.customerName}</div>
                </td>
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.financing.market}</td>
                <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{row.financing.lender}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                    T{row.financing.tier}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700 whitespace-nowrap font-mono text-xs">
                  {row.financing.loanAmount > 0 ? fmt(row.financing.loanAmount) : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${APPROVAL_COLOR[row.financing.approvalStatus]}`}>
                    {row.financing.approvalStatus}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${REBATE_COLOR[row.financing.rebateStage]}`}>
                    {row.financing.rebateStage}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${INSTALL_COLOR[row.installation.stage]}`}>
                    {row.installation.stage}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">
                  {row.installation.scheduledInstallDate ?? '—'}
                </td>
                <td className="px-3 py-2.5">
                  {row.isAtRisk ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold whitespace-nowrap">
                      ⚠ AT RISK
                    </span>
                  ) : row.financing.optedOut && row.financing.altPaymentConfirmed ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs whitespace-nowrap">
                      Opted Out ✓
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs whitespace-nowrap">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
