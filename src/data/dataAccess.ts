// ============================================================
// Data access layer — thin wrapper so swapping in live HubSpot
// data means replacing mockData.ts and this file only.
// ============================================================

import { financingRecords, installationRecords } from './mockData';
import type {
  FinancingRecord,
  InstallationRecord,
  ProjectRow,
  RebateStage,
} from '../types';

// Stages that count as "Qualified-or-later" for the AT-RISK gate
const QUALIFIED_OR_LATER: RebateStage[] = ['Qualified', 'RequestFunds', 'Funded'];

/**
 * THE GUARDRAIL — Daniel's core mandate.
 *
 * An installation is AT RISK when:
 *   stage ∈ {ReadyForInstall, Scheduled}
 *   AND NOT (rebateStage ≥ Qualified AND approvalStatus = Approved)
 *   AND NOT (optedOut AND altPaymentConfirmed)
 */
export function computeAtRisk(
  financing: FinancingRecord,
  installation: InstallationRecord,
): { isAtRisk: boolean; reason: string | null } {
  const isActiveInstall =
    installation.stage === 'ReadyForInstall' || installation.stage === 'Scheduled';

  if (!isActiveInstall) return { isAtRisk: false, reason: null };

  const financingCleared =
    QUALIFIED_OR_LATER.includes(financing.rebateStage) &&
    financing.approvalStatus === 'Approved';

  const optOutCleared = financing.optedOut && financing.altPaymentConfirmed;

  if (financingCleared || optOutCleared) return { isAtRisk: false, reason: null };

  // Build specific reason string
  const parts: string[] = [];
  if (!financingCleared) {
    parts.push(
      `Rebate stage = ${financing.rebateStage}` +
        (financing.approvalStatus !== 'Approved'
          ? `, approval = ${financing.approvalStatus}`
          : ''),
    );
  }
  if (financing.optedOut && !financing.altPaymentConfirmed) {
    parts.push('Opted-out but alt payment not confirmed');
  }

  return {
    isAtRisk: true,
    reason: `${installation.stage}: ${parts.join('; ')}`,
  };
}

export function getProjectRows(): ProjectRow[] {
  const financingMap = new Map<string, FinancingRecord>(
    financingRecords.map((f) => [f.id, f]),
  );

  return installationRecords.map((installation) => {
    const financing = financingMap.get(installation.financingRecordId)!;
    const { isAtRisk, reason } = computeAtRisk(financing, installation);
    return { financing, installation, isAtRisk, atRiskReason: reason };
  });
}

export function getFinancingRecords(): FinancingRecord[] {
  return financingRecords;
}

export function getInstallationRecords(): InstallationRecord[] {
  return installationRecords;
}
