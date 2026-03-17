/* ────────────────────────────────────────────────────────
   CALCULATIONS MODULE
   All formulas for the three scenarios live here.
   Every function is pure — plug in numbers, get results.
   ──────────────────────────────────────────────────────── */

import {
  type IndustryPreset,
  ADMIN_HOURLY_RATE,
  WORKER_HOURLY_RATE,
  HOURS_LOST_PER_REMAKE_EVENT,
  ONBOARDING_AMORTIZATION_YEARS,
} from "./industryConfig";

/* ── No Program ──────────────────────────────────────── */

export type NoProgramResult = {
  expectedInjuries: number;
  injuryCost: number;
  citationCost: number;
  productivityLossHours: number;
  productivityLossValue: number;
  totalExposure: number;
};

export function calcNoProgram(
  eligibleEmployees: number,
  d: IndustryPreset,
): NoProgramResult {
  const expectedInjuries =
    eligibleEmployees * d.injuryRatePerEligibleWorkerPerYear;

  const injuryCost =
    expectedInjuries * d.avgDirectEyeInjuryCost * (1 + d.indirectCostMultiplier);

  const citationCost =
    expectedInjuries * d.citationProbabilityPerResidualInjury * d.avgCitationCost;

  const productivityLossHours =
    eligibleEmployees * d.noProgramDisruptionHoursPerWorkerPerYear;

  const productivityLossValue =
    productivityLossHours * WORKER_HOURLY_RATE;

  const totalExposure =
    injuryCost + citationCost + productivityLossValue;

  return {
    expectedInjuries,
    injuryCost,
    citationCost,
    productivityLossHours,
    productivityLossValue,
    totalExposure,
  };
}

/* ── Program scenario (Employer Managed or Fully Managed) ── */

export type ProgramResult = {
  participants: number;
  protectedWorkers: number;
  adminHours: number;
  adminValue: number;
  workerBurdenHours: number;
  workerBurdenValue: number;
  remakeEvents: number;
  remakeHours: number;
  remakeValue: number;
  residualInjuries: number;
  injuryCost: number;
  citationCost: number;
  eyewearCost: number;
  onboardingAmortized: number;
  totalCost: number;
};

export type FullyManagedPricingOverride = {
  eyewearCostPerWorker?: number;
  onboardingFee?: number;
};

export function calcEmployerManaged(
  eligibleEmployees: number,
  d: IndustryPreset,
): ProgramResult {
  const participants =
    eligibleEmployees * d.employerManagedParticipationRate;

  const protectedWorkers =
    eligibleEmployees
    * d.employerManagedParticipationRate
    * d.employerManagedWearComplianceRate;

  const adminHours =
    d.employerManagedBaseAdminHoursPerYear
    + (d.employerManagedAdminMinPerWorkerPerMonth * participants * 12) / 60;

  const adminValue = adminHours * ADMIN_HOURLY_RATE;

  const workerBurdenHours =
    (d.employerManagedWorkerBurdenMinPerWorkerPerMonth * participants * 12) / 60;

  const workerBurdenValue = workerBurdenHours * WORKER_HOURLY_RATE;

  const remakeEvents = participants * d.employerManagedRemakeRate;
  const remakeHours = remakeEvents * HOURS_LOST_PER_REMAKE_EVENT;
  const remakeValue = remakeHours * WORKER_HOURLY_RATE;

  const residualInjuries =
    eligibleEmployees
    * d.injuryRatePerEligibleWorkerPerYear
    * (
      1
      - d.employerManagedParticipationRate
        * d.employerManagedWearComplianceRate
        * d.protectionEffectiveness
    );

  const injuryCost =
    residualInjuries * d.avgDirectEyeInjuryCost * (1 + d.indirectCostMultiplier);

  const citationCost =
    residualInjuries * d.citationProbabilityPerResidualInjury * d.avgCitationCost;

  const eyewearCost =
    participants * d.employerManagedEyewearCostPerWorker;

  const onboardingAmortized = 0;

  const totalCost =
    eyewearCost
    + adminValue
    + workerBurdenValue
    + remakeValue
    + injuryCost
    + citationCost;

  return {
    participants,
    protectedWorkers,
    adminHours,
    adminValue,
    workerBurdenHours,
    workerBurdenValue,
    remakeEvents,
    remakeHours,
    remakeValue,
    residualInjuries,
    injuryCost,
    citationCost,
    eyewearCost,
    onboardingAmortized,
    totalCost,
  };
}

export function calcFullyManaged(
  eligibleEmployees: number,
  d: IndustryPreset,
  pricing?: FullyManagedPricingOverride,
): ProgramResult {
  const participants =
    eligibleEmployees * d.fullyManagedParticipationRate;

  const protectedWorkers =
    eligibleEmployees
    * d.fullyManagedParticipationRate
    * d.fullyManagedWearComplianceRate;

  const adminHours =
    d.fullyManagedBaseAdminHoursPerYear
    + (d.fullyManagedAdminMinPerWorkerPerMonth * participants * 12) / 60;

  const adminValue = adminHours * ADMIN_HOURLY_RATE;

  const workerBurdenHours =
    (d.fullyManagedWorkerBurdenMinPerWorkerPerMonth * participants * 12) / 60;

  const workerBurdenValue = workerBurdenHours * WORKER_HOURLY_RATE;

  const remakeEvents = participants * d.fullyManagedRemakeRate;
  const remakeHours = remakeEvents * HOURS_LOST_PER_REMAKE_EVENT;
  const remakeValue = remakeHours * WORKER_HOURLY_RATE;

  const residualInjuries =
    eligibleEmployees
    * d.injuryRatePerEligibleWorkerPerYear
    * (
      1
      - d.fullyManagedParticipationRate
        * d.fullyManagedWearComplianceRate
        * d.protectionEffectiveness
    );

  const injuryCost =
    residualInjuries * d.avgDirectEyeInjuryCost * (1 + d.indirectCostMultiplier);

  const citationCost =
    residualInjuries * d.citationProbabilityPerResidualInjury * d.avgCitationCost;

  const fullyManagedEyewearCostPerWorker =
    pricing?.eyewearCostPerWorker ?? d.fullyManagedEyewearCostPerWorker;
  const onboardingFee =
    pricing?.onboardingFee ?? d.fullyManagedOnboardingFee;

  const eyewearCost =
    participants * fullyManagedEyewearCostPerWorker;

  const onboardingAmortized =
    onboardingFee / ONBOARDING_AMORTIZATION_YEARS;

  const totalCost =
    eyewearCost
    + adminValue
    + workerBurdenValue
    + remakeValue
    + injuryCost
    + citationCost
    + onboardingAmortized;

  return {
    participants,
    protectedWorkers,
    adminHours,
    adminValue,
    workerBurdenHours,
    workerBurdenValue,
    remakeEvents,
    remakeHours,
    remakeValue,
    residualInjuries,
    injuryCost,
    citationCost,
    eyewearCost,
    onboardingAmortized,
    totalCost,
  };
}

/* ── Operational impact (Fully Managed vs Employer Managed) ── */

export type OperationalImpact = {
  administrativeHoursReturned: number;
  productiveWorkHoursPreserved: number;
  remakeEventsReduced: number;
  remakeHoursReduced: number;
  additionalWorkersProtected: number;
  residualInjuriesReduced: number;
};

export function calcOperationalImpact(
  em: ProgramResult,
  fm: ProgramResult,
): OperationalImpact {
  return {
    administrativeHoursReturned: em.adminHours - fm.adminHours,
    productiveWorkHoursPreserved: em.workerBurdenHours - fm.workerBurdenHours,
    remakeEventsReduced: em.remakeEvents - fm.remakeEvents,
    remakeHoursReduced: em.remakeHours - fm.remakeHours,
    additionalWorkersProtected: fm.protectedWorkers - em.protectedWorkers,
    residualInjuriesReduced: em.residualInjuries - fm.residualInjuries,
  };
}

/* ── Savings breakdown (Fully Managed vs Employer Managed) ── */

export type SavingsBreakdown = {
  adminSavings: number;
  productivitySavings: number;
  remakeSavings: number;
  injurySavings: number;
  citationSavings: number;
  additionalEyewearSpend: number;
  netAnnualSavings: number;
};

export function calcSavingsVsEmployerManaged(
  em: ProgramResult,
  fm: ProgramResult,
  impact: OperationalImpact,
  d: IndustryPreset,
): SavingsBreakdown {
  const adminSavings = impact.administrativeHoursReturned * ADMIN_HOURLY_RATE;
  const productivitySavings =
    impact.productiveWorkHoursPreserved * WORKER_HOURLY_RATE;
  const remakeSavings = impact.remakeHoursReduced * WORKER_HOURLY_RATE;

  const injurySavings =
    impact.residualInjuriesReduced
    * d.avgDirectEyeInjuryCost
    * (1 + d.indirectCostMultiplier);

  const citationSavings = em.citationCost - fm.citationCost;

  const additionalEyewearSpend = fm.eyewearCost - em.eyewearCost;

  const netAnnualSavings =
    adminSavings
    + productivitySavings
    + remakeSavings
    + injurySavings
    + citationSavings
    - additionalEyewearSpend;

  return {
    adminSavings,
    productivitySavings,
    remakeSavings,
    injurySavings,
    citationSavings,
    additionalEyewearSpend,
    netAnnualSavings,
  };
}

/* ── No Program comparison ── */

export type NoProgramComparison = {
  netSavingsVsNoProgram: number;
  injuriesPreventedVsNoProgram: number;
};

export function calcSavingsVsNoProgram(
  noProgram: NoProgramResult,
  fm: ProgramResult,
): NoProgramComparison {
  return {
    netSavingsVsNoProgram: noProgram.totalExposure - fm.totalCost,
    injuriesPreventedVsNoProgram: noProgram.expectedInjuries - fm.residualInjuries,
  };
}

/* ── Breakeven logic ── */

export type BreakevenResult = {
  fixedCostGap: number;
  variableSavingsPerWorker: number;
  breakevenWorkers: number | null; // null = never breaks even
  isAboveBreakeven: boolean;
};

export function calcBreakeven(
  eligibleEmployees: number,
  d: IndustryPreset,
  pricing?: FullyManagedPricingOverride,
): BreakevenResult {
  const fullyManagedEyewearCostPerWorker =
    pricing?.eyewearCostPerWorker ?? d.fullyManagedEyewearCostPerWorker;
  const onboardingFee =
    pricing?.onboardingFee ?? d.fullyManagedOnboardingFee;

  const fixedCostGap =
    (onboardingFee / ONBOARDING_AMORTIZATION_YEARS)
    + (d.fullyManagedBaseAdminHoursPerYear - d.employerManagedBaseAdminHoursPerYear)
      * ADMIN_HOURLY_RATE;

  // Per-worker injury and citation savings
  const emResidualFactor =
    1
    - d.employerManagedParticipationRate
      * d.employerManagedWearComplianceRate
      * d.protectionEffectiveness;
  const fmResidualFactor =
    1
    - d.fullyManagedParticipationRate
      * d.fullyManagedWearComplianceRate
      * d.protectionEffectiveness;

  const perWorkerInjurySavings =
    d.injuryRatePerEligibleWorkerPerYear
    * (emResidualFactor - fmResidualFactor)
    * d.avgDirectEyeInjuryCost
    * (1 + d.indirectCostMultiplier);

  const perWorkerCitationSavings =
    d.injuryRatePerEligibleWorkerPerYear
    * (emResidualFactor - fmResidualFactor)
    * d.citationProbabilityPerResidualInjury
    * d.avgCitationCost;

  const perWorkerInjuryAndCitationSavings =
    perWorkerInjurySavings + perWorkerCitationSavings;

  const variableSavingsPerWorker =
    // Admin savings per worker
    (
      d.employerManagedAdminMinPerWorkerPerMonth * d.employerManagedParticipationRate
      - d.fullyManagedAdminMinPerWorkerPerMonth * d.fullyManagedParticipationRate
    ) * 12 / 60 * ADMIN_HOURLY_RATE
    // Worker burden savings per worker
    + (
      d.employerManagedWorkerBurdenMinPerWorkerPerMonth * d.employerManagedParticipationRate
      - d.fullyManagedWorkerBurdenMinPerWorkerPerMonth * d.fullyManagedParticipationRate
    ) * 12 / 60 * WORKER_HOURLY_RATE
    // Remake savings per worker
    + (
      d.employerManagedRemakeRate * d.employerManagedParticipationRate
      - d.fullyManagedRemakeRate * d.fullyManagedParticipationRate
    ) * HOURS_LOST_PER_REMAKE_EVENT * WORKER_HOURLY_RATE
    // Injury and citation savings per worker
    + perWorkerInjuryAndCitationSavings
    // Minus additional eyewear cost per worker
    - (
      d.fullyManagedParticipationRate * fullyManagedEyewearCostPerWorker
      - d.employerManagedParticipationRate * d.employerManagedEyewearCostPerWorker
    );

  let breakevenWorkers: number | null = null;
  if (variableSavingsPerWorker > 0) {
    breakevenWorkers = Math.ceil(fixedCostGap / variableSavingsPerWorker);
    if (breakevenWorkers < 0) breakevenWorkers = 0;
  }

  const isAboveBreakeven =
    breakevenWorkers !== null && eligibleEmployees >= breakevenWorkers;

  return {
    fixedCostGap,
    variableSavingsPerWorker,
    breakevenWorkers,
    isAboveBreakeven,
  };
}

/* ── Scale chart data (cost vs workforce size) ── */

export type ScalePoint = {
  workers: number;
  employerManagedCost: number;
  fullyManagedCost: number;
  noProgramExposure: number;
};

export function calcScaleData(
  d: IndustryPreset,
  maxWorkers: number,
  steps: number = 50,
  pricing?: FullyManagedPricingOverride,
): ScalePoint[] {
  const points: ScalePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const w = Math.round((maxWorkers / steps) * i);
    const em = calcEmployerManaged(w, d);
    const fm = calcFullyManaged(w, d, pricing);
    const np = calcNoProgram(w, d);
    points.push({
      workers: w,
      employerManagedCost: em.totalCost,
      fullyManagedCost: fm.totalCost,
      noProgramExposure: np.totalExposure,
    });
  }
  return points;
}
