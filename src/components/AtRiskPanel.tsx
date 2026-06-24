import type { ProjectRow } from '../types';

interface Props {
  rows: ProjectRow[];
}

export function AtRiskPanel({ rows }: Props) {
  const atRisk = rows.filter((r) => r.isAtRisk);

  if (atRisk.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-3">✅</div>
        <p className="text-lg font-semibold text-green-700">No at-risk installations</p>
        <p className="text-sm text-gray-500 mt-1">All scheduled/ready installs have financing cleared.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">⚠️</span>
        <div>
          <h2 className="text-lg font-bold text-red-700">Install Readiness Risks</h2>
          <p className="text-sm text-gray-500">
            {atRisk.length} installation{atRisk.length !== 1 ? 's' : ''} where financing has not cleared the gate.
            Per Jetson policy, financing must be Approved + Qualified-or-later before scheduling.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {atRisk.map((row) => {
          const f = row.financing;
          const i = row.installation;
          return (
            <div
              key={i.id}
              className="border-2 border-red-200 bg-red-50 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-semibold text-gray-900 text-base">{f.projectName}</div>
                  <div className="text-sm text-gray-500">{f.customerName} · {f.market} · {f.lender} T{f.tier}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white text-sm font-bold">
                    ⚠ AT RISK
                  </span>
                  {i.scheduledInstallDate && (
                    <span className="text-xs text-gray-600">Scheduled: {i.scheduledInstallDate}</span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatusCell label="Install Stage" value={i.stage} highlight />
                <StatusCell label="Approval Status" value={f.approvalStatus} warn={f.approvalStatus !== 'Approved'} />
                <StatusCell label="Rebate Stage" value={f.rebateStage} warn={!['Qualified','RequestFunds','Funded'].includes(f.rebateStage)} />
                <StatusCell
                  label="Opt-Out"
                  value={f.optedOut ? (f.altPaymentConfirmed ? 'Yes (confirmed)' : 'Yes — ALT UNCONFIRMED') : 'No'}
                  warn={f.optedOut && !f.altPaymentConfirmed}
                />
              </div>

              <div className="mt-3 rounded-lg bg-red-100 border border-red-300 px-4 py-2.5 text-sm text-red-800">
                <span className="font-semibold">Missing step: </span>
                {row.atRiskReason}
              </div>

              <div className="mt-3 text-xs text-gray-500 flex gap-4">
                <span>CS Owner: <span className="font-medium text-gray-700">{f.ownerCS}</span></span>
                <span>PC Owner: <span className="font-medium text-gray-700">{i.ownerPC}</span></span>
                <span>Last Updated: <span className="font-medium text-gray-700">{f.lastUpdated}</span></span>
                {f.applicationReference && (
                  <span>Ref: <span className="font-medium text-gray-700 font-mono">{f.applicationReference}</span></span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-gray-100 rounded-xl p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-800 mb-1">Resolution checklist</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Ensure the rebate application is submitted (ApplicationSent) and the lender has issued approval (Approved).</li>
          <li>Confirm the rebate stage has reached Qualified before moving the installation to ReadyForInstall or Scheduled.</li>
          <li>If the customer is opting out of financing, confirm the alt payment method and set <code className="text-xs bg-gray-200 px-1 rounded">altPaymentConfirmed = true</code>.</li>
          <li>If financing is declined, move the installation back to SavingRequired and note the reason.</li>
        </ul>
      </div>
    </div>
  );
}

function StatusCell({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={`rounded-lg p-2.5 ${warn ? 'bg-red-200' : highlight ? 'bg-red-100' : 'bg-white border border-gray-200'}`}>
      <div className="text-xs text-gray-500 font-medium mb-0.5">{label}</div>
      <div className={`text-sm font-semibold ${warn ? 'text-red-800' : 'text-gray-800'}`}>{value}</div>
    </div>
  );
}
