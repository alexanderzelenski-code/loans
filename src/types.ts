// ============================================================
// Domain types — mirrors HubSpot "Rebate" custom object (type 2-37947739, pipeline 663516535)
// and the "Installation" pipeline.
// ============================================================

export type Market = 'MA' | 'CO' | 'NY' | 'CA' | 'BC' | 'EXPANSION';

export type Lender =
  | 'MassSave'
  | 'Renu'
  | 'NYSERDA'
  | 'GoGreen'
  | 'LendingClub'
  | 'Watercress'
  | 'Financeit'
  | 'JetsonCaptive';

export type Tier = 1 | 2 | 3 | 4 | 5;
// T1–T3: government programs; T4–T5: private; Financeit = Canada

export type ApprovalStatus = 'NotStarted' | 'Pending' | 'Approved' | 'Declined';

// APPROXIMATE — real HubSpot stage names TBD; see Open Questions in Spec tab
export type RebateStage =
  | 'NotStarted'
  | 'ApplicationSent'
  | 'Qualified'
  | 'RequestFunds'
  | 'Funded';

export type FundingMechanic =
  | 'CustomerFundRelease'   // Financeit & LendingClub
  | 'SignedInvoiceToLender' // Renu (CO)
  | 'ChequeSignedOver'      // MassSave (MA)
  | 'PortalDisbursement';   // GoGreen (CA)

export type FundingStatus = 'NotFunded' | 'RequestFunds' | 'Funded' | 'Reconciled';

// HubSpot "Rebate" custom object (type 2-37947739)
export interface FinancingRecord {
  id: string;
  projectName: string;
  customerName: string;
  market: Market;
  lender: Lender;
  tier: Tier;
  applicationReference: string | null; // Loan/Lender ID; null until approved
  approvalStatus: ApprovalStatus;
  rebateStage: RebateStage;            // APPROXIMATE stage names
  loanAmount: number;                  // USD
  apr: number;                         // percentage
  termMonths: number;
  fundingMechanic: FundingMechanic;
  fundingStatus: FundingStatus;
  optedOut: boolean;            // customer opted out of financing
  altPaymentConfirmed: boolean; // confirmed alternative payment method
  ownerCS: string;              // CS rep who owns through approval
  lastUpdated: string;          // ISO date string
}

// Installation stage — legacy "Deal/Installation/Permit/Rebate" model
// MIGRATION NOTE: Jetson is mid-migration to "Project & Job" model where financing
// blockers fold into pending reasons on the Project. See Spec tab for details.
export type InstallationStage =
  | 'SavingRequired'
  | 'Pending'
  | 'ReadyForInstall'
  | 'Scheduled'
  | 'Installed';

// HubSpot "Installation" pipeline
export interface InstallationRecord {
  id: string;
  financingRecordId: string;  // FK → FinancingRecord.id
  stage: InstallationStage;
  savingRequiredReason: string | null;
  pendingReason: string | null;
  scheduledInstallDate: string | null; // ISO date string
  ownerPC: string;            // PC rep who owns from ReadyForInstall onward
}

// Computed join for views
export interface ProjectRow {
  financing: FinancingRecord;
  installation: InstallationRecord;
  isAtRisk: boolean;
  atRiskReason: string | null;
}
