export function SpecTab() {
  return (
    <div className="p-6 max-w-4xl mx-auto text-sm text-gray-700 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Process & Data Spec</h1>
        <p className="text-gray-500">
          Handoff document for HubSpot view build and future automation. Last updated: 2026-06-24.
          Audience: CS, PC, RevOps, Engineering.
        </p>
      </div>

      {/* Migration Note */}
      <Section title="⚠️ Migration Context">
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-800 text-sm">
          <p className="font-semibold mb-1">Jetson is mid-migration: Legacy Model → Project & Job Model</p>
          <p>
            The current spec describes the <strong>legacy model</strong>: discrete Deal / Installation / Permit / Rebate
            HubSpot objects. A newer "Project & Job" model is in progress where financing blockers fold into{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">pending_reason</code> fields on the Project record,
            eliminating the separate Rebate pipeline.
          </p>
          <p className="mt-2">
            This prototype is built on the <strong>legacy model by default</strong>. The AT-RISK gate logic in{' '}
            <code className="text-xs bg-amber-100 px-1 rounded">src/data/dataAccess.ts → computeAtRisk()</code> is
            isolated so the Project &amp; Job variant can be swapped in by replacing the data access layer and
            stage enum. Stage names marked <strong>APPROXIMATE</strong> below must be confirmed against the live
            HubSpot pipeline before wiring.
          </p>
        </div>
      </Section>

      {/* HubSpot Object Mapping */}
      <Section title="HubSpot Object Mapping">
        <SubSection title="Rebate Custom Object (type: 2-37947739, pipeline: 663516535)">
          <FieldTable fields={[
            ['id', 'hs_object_id', 'Auto', 'Internal Jetson record ID'],
            ['projectName', 'rebate_project_name (TBC)', 'String', 'Human-readable project label'],
            ['customerName', 'associated_contact.name', 'String', 'From linked Contact'],
            ['market', 'market__c', 'Enum', 'MA | CO | NY | CA | BC | EXPANSION'],
            ['lender', 'lender__c', 'Enum', 'See lender list below'],
            ['tier', 'financing_tier__c', 'Number (1–5)', 'T1–T3 gov; T4–T5 private; T5 Financeit = Canada'],
            ['applicationReference', 'loan_id__c / lender_ref__c', 'String|null', 'Null until lender issues ID'],
            ['approvalStatus', 'hs_pipeline_stage', 'Enum', 'Maps to pipeline stages; Pending & Approved confirmed'],
            ['rebateStage', 'rebate_stage__c (APPROXIMATE)', 'Enum', 'See stage definitions; names unconfirmed'],
            ['loanAmount', 'loan_amount__c', 'Currency (USD)', '0 for opted-out records'],
            ['apr', 'loan_apr__c', 'Number (%)', '0 for MassSave 0% programs'],
            ['termMonths', 'loan_term_months__c', 'Number', 'Repayment term'],
            ['fundingMechanic', 'funding_mechanic__c', 'Enum', 'Derived from lender; see mechanics table'],
            ['fundingStatus', 'funding_status__c', 'Enum', 'Finance team updates manually'],
            ['optedOut', 'financing_opted_out__c', 'Boolean', 'Customer declined financing program'],
            ['altPaymentConfirmed', 'alt_payment_confirmed__c', 'Boolean', 'CS must confirm before install proceeds'],
            ['ownerCS', 'hubspot_owner_id (CS)', 'User', 'CS owns through Approved stage'],
            ['lastUpdated', 'hs_lastmodifieddate', 'Date', 'Auto-updated by HubSpot'],
          ]} />
        </SubSection>

        <SubSection title="Installation Pipeline">
          <FieldTable fields={[
            ['id', 'hs_object_id', 'Auto', 'Internal ID'],
            ['financingRecordId', 'associated_rebate_id__c', 'Lookup', 'FK to Rebate object'],
            ['stage', 'hs_pipeline_stage', 'Enum', 'Installation pipeline stages'],
            ['savingRequiredReason', 'saving_required_reason__c', 'String|null', 'Why install cannot proceed'],
            ['pendingReason', 'pending_reason__c', 'String|null', 'Blocking reason for Pending stage'],
            ['scheduledInstallDate', 'scheduled_install_date__c', 'Date|null', 'Set by PC when Scheduled'],
            ['ownerPC', 'hubspot_owner_id (PC)', 'User', 'PC owns from ReadyForInstall onward'],
          ]} />
        </SubSection>
      </Section>

      {/* Stage Definitions */}
      <Section title="Stage Definitions">
        <SubSection title="Rebate / Approval Stages (APPROXIMATE — confirm real HubSpot names)">
          <StageTable stages={[
            ['NotStarted', 'gray', 'No financing application submitted. Default state.'],
            ['ApplicationSent', 'yellow', 'CS has submitted the loan application to the lender. Awaiting lender decision.'],
            ['Qualified', 'blue', 'Lender has approved the customer. CS has confirmed eligibility. Financing gate is now CLEARED (with Approved approval status).'],
            ['RequestFunds', 'orange', 'Installation complete. CS/Finance has submitted the funding draw request to the lender.'],
            ['Funded', 'green', 'Lender has released funds. Finance team must reconcile against funding report.'],
          ]} />
        </SubSection>

        <SubSection title="Approval Status (confirmed in HubSpot pipeline)">
          <StageTable stages={[
            ['NotStarted', 'gray', 'No application submitted.'],
            ['Pending', 'yellow', 'Application submitted; awaiting lender decision. Confirmed pipeline stage.'],
            ['Approved', 'green', 'Lender approved the customer. Required for financing gate to clear.'],
            ['Declined', 'red', 'Lender declined. Installation must move to SavingRequired until resolved.'],
          ]} />
        </SubSection>

        <SubSection title="Installation Pipeline Stages">
          <StageTable stages={[
            ['SavingRequired', 'red', 'A blocker prevents scheduling. Reason captured in savingRequiredReason. Used when financing is declined or customer needs to resolve issues.'],
            ['Pending', 'yellow', 'Pre-conditions in progress (permitting, equipment, rebate application). pendingReason explains the specific blocker.'],
            ['ReadyForInstall', 'blue', 'All blockers (financing, permits, rebates) cleared. PC can schedule.'],
            ['Scheduled', 'indigo', 'Install date confirmed with customer. scheduledInstallDate is set.'],
            ['Installed', 'green', 'Work complete. Triggers funding draw request workflow.'],
          ]} />
        </SubSection>
      </Section>

      {/* AT-RISK Gate */}
      <Section title="The AT-RISK Gate — Financing as a Hard Blocker">
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 space-y-3">
          <p className="font-semibold text-red-800 text-base">
            An installation is AT-RISK when ALL of the following are true:
          </p>
          <ol className="list-decimal ml-5 space-y-1 text-red-900">
            <li>Installation stage is <strong>ReadyForInstall</strong> or <strong>Scheduled</strong></li>
            <li>
              Financing gate NOT cleared — i.e., it is NOT the case that:
              <ul className="list-disc ml-5 mt-1 space-y-0.5">
                <li>rebateStage ∈ {'{Qualified, RequestFunds, Funded}'} AND approvalStatus = Approved</li>
              </ul>
            </li>
            <li>
              Opt-out exemption NOT in effect — i.e., it is NOT the case that:
              <ul className="list-disc ml-5 mt-1 space-y-0.5">
                <li>optedOut = true AND altPaymentConfirmed = true</li>
              </ul>
            </li>
          </ol>
          <p className="text-sm text-red-700 bg-red-100 rounded-lg p-2">
            <strong>Intent:</strong> Financing must be treated as a hard gate equivalent to permits and rebates.
            A job with financing not yet approved must sit in SavingRequired or Pending — never ReadyForInstall
            or Scheduled. AT-RISK records are exactly the policy violations. This is Daniel's core mandate for CS/PC.
          </p>
        </div>

        <div className="mt-4">
          <p className="font-semibold text-gray-800 mb-2">Code implementation</p>
          <pre className="bg-gray-900 text-green-300 rounded-xl p-4 text-xs overflow-x-auto">{`// src/data/dataAccess.ts — computeAtRisk()
// MIGRATION NOTE: isolate this function when swapping to Project & Job model

const QUALIFIED_OR_LATER = ['Qualified', 'RequestFunds', 'Funded'];

function computeAtRisk(financing, installation) {
  const isActiveInstall =
    installation.stage === 'ReadyForInstall' ||
    installation.stage === 'Scheduled';

  if (!isActiveInstall) return { isAtRisk: false };

  const financingCleared =
    QUALIFIED_OR_LATER.includes(financing.rebateStage) &&
    financing.approvalStatus === 'Approved';

  const optOutCleared =
    financing.optedOut && financing.altPaymentConfirmed;

  return { isAtRisk: !financingCleared && !optOutCleared };
}`}</pre>
        </div>
      </Section>

      {/* CS → PC Handoff */}
      <Section title="CS → PC Handoff Point">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-4">
            <div className="flex-1 text-center p-3 bg-white rounded-xl border border-blue-200">
              <div className="font-bold text-blue-800 text-sm mb-1">Customer Success (CS)</div>
              <p className="text-xs text-gray-600">Owns from deal close through financing Approved status.</p>
              <p className="text-xs text-gray-500 mt-1">Responsible for: application submission, lender communication, approval status, opt-out confirmation, funding draw request.</p>
            </div>
            <div className="flex items-center text-2xl text-blue-400 mt-6">→</div>
            <div className="flex-1 text-center p-3 bg-white rounded-xl border border-blue-200">
              <div className="font-bold text-indigo-800 text-sm mb-1">Project Coordination (PC)</div>
              <p className="text-xs text-gray-600">Takes ownership at ReadyForInstall stage.</p>
              <p className="text-xs text-gray-500 mt-1">Responsible for: scheduling, equipment, install execution, post-install documentation.</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <strong>Gate:</strong> PC must not schedule until CS confirms the financing gate is cleared (or altPaymentConfirmed). The AT-RISK report is the mechanism for surfacing violations.
          </p>
        </div>
      </Section>

      {/* Per-Lender Funding Mechanics */}
      <Section title="Per-Lender Funding Mechanics">
        <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Lender</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Market</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Tier</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Funding Mechanic</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['MassSave', 'MA', 'T1–T2', 'ChequeSignedOver', 'MassSave issues cheque to customer; customer signs over to Jetson at install day.'],
              ['Renu', 'CO', 'T2–T3', 'SignedInvoiceToLender', 'Jetson sends signed invoice; Renu pays Jetson directly.'],
              ['NYSERDA', 'NY', 'T1–T2', 'PortalDisbursement', 'Funds requested and released via NYSERDA online portal.'],
              ['GoGreen', 'CA', 'T2–T3', 'PortalDisbursement', 'Funds requested and released via GoGreen portal.'],
              ['LendingClub', 'CA', 'T4', 'CustomerFundRelease', 'Lender releases to customer; customer pays Jetson invoice.'],
              ['Watercress', 'EXPANSION', 'T4', 'CustomerFundRelease', 'Private lender; customer fund release.'],
              ['Financeit', 'BC', 'T5', 'CustomerFundRelease', 'Canada-only. Customer fund release. Currency: CAD (tracked as USD equivalent in HubSpot).'],
              ['JetsonCaptive', 'MA', 'T5', 'CustomerFundRelease', 'Jetson internal financing. Internal ledger reconciliation.'],
            ].map(([lender, market, tier, mechanic, notes]) => (
              <tr key={lender} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-800">{lender}</td>
                <td className="px-4 py-2 text-gray-600">{market}</td>
                <td className="px-4 py-2 text-gray-600">{tier}</td>
                <td className="px-4 py-2"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{mechanic}</span></td>
                <td className="px-4 py-2 text-gray-500 text-xs">{notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Open Questions */}
      <Section title="Open Questions & Assumptions">
        <div className="space-y-3">
          {[
            {
              q: 'What are the exact HubSpot pipeline stage names for the Rebate object?',
              note: 'Stage names in this prototype (NotStarted, ApplicationSent, Qualified, RequestFunds, Funded) are APPROXIMATE. Must be confirmed against live HubSpot pipeline 663516535 before any automation is built.',
              tag: 'CRITICAL',
            },
            {
              q: 'Is "Qualified" the correct gate stage for financing clearance?',
              note: 'The prototype uses Qualified-or-later as the financing-cleared threshold. Confirm whether "Qualified" in HubSpot means the same as "lender has approved, customer is eligible."',
              tag: 'CRITICAL',
            },
            {
              q: 'How is the Financeit currency handled in HubSpot?',
              note: 'Financeit is Canada-only (BC market). loanAmount is stored as USD equivalent. Confirm whether HubSpot has a separate currency field or uses a conversion rate.',
              tag: 'DATA',
            },
            {
              q: 'Does the "Project & Job" migration affect the Rebate pipeline?',
              note: 'If the new model folds financing stages into Project pending_reason fields, the entire Rebate pipeline stage logic must be re-mapped. Timeline TBD.',
              tag: 'MIGRATION',
            },
            {
              q: 'What triggers the move from RequestFunds to Funded?',
              note: 'Unclear if this is a manual Finance team update or auto-triggered by a webhook/payment event from the lender.',
              tag: 'PROCESS',
            },
            {
              q: 'Is the EXPANSION market a catch-all or a pipeline stage?',
              note: 'Currently modeled as a market enum value. Confirm whether expansion markets get their own enum values as Jetson enters new states.',
              tag: 'DATA',
            },
          ].map(({ q, note, tag }) => (
            <div key={q} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded mt-0.5 shrink-0 ${
                  tag === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  tag === 'MIGRATION' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-700'
                }`}>{tag}</span>
                <div>
                  <p className="font-semibold text-gray-800">{q}</p>
                  <p className="text-gray-600 mt-1 text-xs">{note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function FieldTable({ fields }: { fields: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-50">
          <tr>
            {['Field', 'HubSpot Property', 'Type', 'Notes'].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fields.map(([field, prop, type, notes]) => (
            <tr key={field} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono font-medium text-blue-700">{field}</td>
              <td className="px-3 py-2 font-mono text-gray-600">{prop}</td>
              <td className="px-3 py-2 text-gray-600">{type}</td>
              <td className="px-3 py-2 text-gray-500">{notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const STAGE_COLORS: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-600',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  orange: 'bg-orange-100 text-orange-800',
  green: 'bg-green-100 text-green-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  red: 'bg-red-100 text-red-800',
};

function StageTable({ stages }: { stages: [string, string, string][] }) {
  return (
    <div className="space-y-2">
      {stages.map(([name, color, desc]) => (
        <div key={name} className="flex items-start gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STAGE_COLORS[color]}`}>{name}</span>
          <span className="text-gray-600 text-xs pt-1">{desc}</span>
        </div>
      ))}
    </div>
  );
}
