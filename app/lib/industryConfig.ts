/* ────────────────────────────────────────────────────────
   INDUSTRY ASSUMPTIONS
   Each industry provides a complete set of preset values
   used to drive all three scenarios: No Program,
   Employer Managed Program, and Fully Managed Program.

   Sources / basis for figures:
   • Injury rates: BLS SOII (Survey of Occupational Injuries)
   • Direct cost per eye injury: NSC Injury Facts / NCCI claims
   • Indirect multiplier: Stanford / Liberty Mutual (1:3–4 ratio)
   • Admin minutes: EHS program management benchmarks (ASSE)
   • Productivity minutes: time-motion studies for PPE programs
   • Remake rates: optical lab industry QC benchmarks
   • OSHA penalties: OSHA penalty schedule (FY 2024, serious = $16,131)
   • Participation & compliance: PPE adoption research (NIOSH, NSC)
   ──────────────────────────────────────────────────────── */

export type IndustryPreset = {
  /* ── risk profile ── */
  injuryRatePerEligibleWorkerPerYear: number;
  avgDirectEyeInjuryCost: number;
  indirectCostMultiplier: number;
  citationProbabilityPerResidualInjury: number;
  avgCitationCost: number;

  /* ── eyewear cost per participant ── */
  employerManagedEyewearCostPerWorker: number;
  fullyManagedEyewearCostPerWorker: number;

  /* ── admin burden (per-worker scaling) ── */
  employerManagedAdminMinPerWorkerPerMonth: number;
  fullyManagedAdminMinPerWorkerPerMonth: number;

  /* ── admin burden (fixed base) ── */
  employerManagedBaseAdminHoursPerYear: number;
  fullyManagedBaseAdminHoursPerYear: number;

  /* ── worker time burden (per-worker scaling) ── */
  employerManagedWorkerBurdenMinPerWorkerPerMonth: number;
  fullyManagedWorkerBurdenMinPerWorkerPerMonth: number;

  /* ── participation and compliance ── */
  employerManagedParticipationRate: number;
  fullyManagedParticipationRate: number;
  employerManagedWearComplianceRate: number;
  fullyManagedWearComplianceRate: number;

  /* ── remake / rework ── */
  employerManagedRemakeRate: number;
  fullyManagedRemakeRate: number;

  /* ── no-program disruption ── */
  noProgramDisruptionHoursPerWorkerPerYear: number;

  /* ── protection effectiveness ── */
  protectionEffectiveness: number;

  /* ── fully managed onboarding fee (one-time, amortised over contract) ── */
  fullyManagedOnboardingFee: number;
};

export type IndustryKey =
  | "Manufacturing"
  | "Construction"
  | "Warehousing"
  | "Utilities"
  | "Life Sciences"
  | "Aerospace & Defense";

export const INDUSTRIES: Record<IndustryKey, IndustryPreset> = {
  Manufacturing: {
    injuryRatePerEligibleWorkerPerYear: 0.012,
    avgDirectEyeInjuryCost: 3000,
    indirectCostMultiplier: 3,
    citationProbabilityPerResidualInjury: 0.15,
    avgCitationCost: 16550,

    employerManagedEyewearCostPerWorker: 190,
    fullyManagedEyewearCostPerWorker: 320,

    employerManagedAdminMinPerWorkerPerMonth: 15,
    fullyManagedAdminMinPerWorkerPerMonth: 3,

    employerManagedBaseAdminHoursPerYear: 208,
    fullyManagedBaseAdminHoursPerYear: 52,

    employerManagedWorkerBurdenMinPerWorkerPerMonth: 20,
    fullyManagedWorkerBurdenMinPerWorkerPerMonth: 5,

    employerManagedParticipationRate: 0.55,
    fullyManagedParticipationRate: 0.85,
    employerManagedWearComplianceRate: 0.70,
    fullyManagedWearComplianceRate: 0.92,

    employerManagedRemakeRate: 0.08,
    fullyManagedRemakeRate: 0.03,

    noProgramDisruptionHoursPerWorkerPerYear: 2.4,
    protectionEffectiveness: 0.9,
    fullyManagedOnboardingFee: 2500,
  },

  Construction: {
    injuryRatePerEligibleWorkerPerYear: 0.015,
    avgDirectEyeInjuryCost: 3200,
    indirectCostMultiplier: 3.2,
    citationProbabilityPerResidualInjury: 0.18,
    avgCitationCost: 16550,

    employerManagedEyewearCostPerWorker: 205,
    fullyManagedEyewearCostPerWorker: 330,

    employerManagedAdminMinPerWorkerPerMonth: 18,
    fullyManagedAdminMinPerWorkerPerMonth: 4,

    employerManagedBaseAdminHoursPerYear: 260,
    fullyManagedBaseAdminHoursPerYear: 52,

    employerManagedWorkerBurdenMinPerWorkerPerMonth: 24,
    fullyManagedWorkerBurdenMinPerWorkerPerMonth: 6,

    employerManagedParticipationRate: 0.50,
    fullyManagedParticipationRate: 0.82,
    employerManagedWearComplianceRate: 0.66,
    fullyManagedWearComplianceRate: 0.90,

    employerManagedRemakeRate: 0.09,
    fullyManagedRemakeRate: 0.03,

    noProgramDisruptionHoursPerWorkerPerYear: 2.9,
    protectionEffectiveness: 0.9,
    fullyManagedOnboardingFee: 3000,
  },

  Warehousing: {
    injuryRatePerEligibleWorkerPerYear: 0.009,
    avgDirectEyeInjuryCost: 2800,
    indirectCostMultiplier: 2.8,
    citationProbabilityPerResidualInjury: 0.12,
    avgCitationCost: 16550,

    employerManagedEyewearCostPerWorker: 180,
    fullyManagedEyewearCostPerWorker: 310,

    employerManagedAdminMinPerWorkerPerMonth: 14,
    fullyManagedAdminMinPerWorkerPerMonth: 3,

    employerManagedBaseAdminHoursPerYear: 156,
    fullyManagedBaseAdminHoursPerYear: 52,

    employerManagedWorkerBurdenMinPerWorkerPerMonth: 18,
    fullyManagedWorkerBurdenMinPerWorkerPerMonth: 4,

    employerManagedParticipationRate: 0.60,
    fullyManagedParticipationRate: 0.87,
    employerManagedWearComplianceRate: 0.73,
    fullyManagedWearComplianceRate: 0.93,

    employerManagedRemakeRate: 0.07,
    fullyManagedRemakeRate: 0.02,

    noProgramDisruptionHoursPerWorkerPerYear: 2.2,
    protectionEffectiveness: 0.9,
    fullyManagedOnboardingFee: 2200,
  },

  Utilities: {
    injuryRatePerEligibleWorkerPerYear: 0.010,
    avgDirectEyeInjuryCost: 2900,
    indirectCostMultiplier: 2.9,
    citationProbabilityPerResidualInjury: 0.14,
    avgCitationCost: 16550,

    employerManagedEyewearCostPerWorker: 195,
    fullyManagedEyewearCostPerWorker: 325,

    employerManagedAdminMinPerWorkerPerMonth: 16,
    fullyManagedAdminMinPerWorkerPerMonth: 3,

    employerManagedBaseAdminHoursPerYear: 182,
    fullyManagedBaseAdminHoursPerYear: 52,

    employerManagedWorkerBurdenMinPerWorkerPerMonth: 20,
    fullyManagedWorkerBurdenMinPerWorkerPerMonth: 5,

    employerManagedParticipationRate: 0.58,
    fullyManagedParticipationRate: 0.86,
    employerManagedWearComplianceRate: 0.72,
    fullyManagedWearComplianceRate: 0.92,

    employerManagedRemakeRate: 0.07,
    fullyManagedRemakeRate: 0.02,

    noProgramDisruptionHoursPerWorkerPerYear: 2.4,
    protectionEffectiveness: 0.9,
    fullyManagedOnboardingFee: 2800,
  },

  "Life Sciences": {
    injuryRatePerEligibleWorkerPerYear: 0.008,
    avgDirectEyeInjuryCost: 3400,
    indirectCostMultiplier: 3.5,
    citationProbabilityPerResidualInjury: 0.20,
    avgCitationCost: 16550,

    employerManagedEyewearCostPerWorker: 220,
    fullyManagedEyewearCostPerWorker: 360,

    employerManagedAdminMinPerWorkerPerMonth: 16,
    fullyManagedAdminMinPerWorkerPerMonth: 3,

    employerManagedBaseAdminHoursPerYear: 220,
    fullyManagedBaseAdminHoursPerYear: 56,

    employerManagedWorkerBurdenMinPerWorkerPerMonth: 18,
    fullyManagedWorkerBurdenMinPerWorkerPerMonth: 5,

    employerManagedParticipationRate: 0.62,
    fullyManagedParticipationRate: 0.90,
    employerManagedWearComplianceRate: 0.75,
    fullyManagedWearComplianceRate: 0.94,

    employerManagedRemakeRate: 0.06,
    fullyManagedRemakeRate: 0.02,

    noProgramDisruptionHoursPerWorkerPerYear: 2.2,
    protectionEffectiveness: 0.9,
    fullyManagedOnboardingFee: 3200,
  },

  "Aerospace & Defense": {
    injuryRatePerEligibleWorkerPerYear: 0.011,
    avgDirectEyeInjuryCost: 3600,
    indirectCostMultiplier: 3.8,
    citationProbabilityPerResidualInjury: 0.22,
    avgCitationCost: 16550,

    employerManagedEyewearCostPerWorker: 235,
    fullyManagedEyewearCostPerWorker: 380,

    employerManagedAdminMinPerWorkerPerMonth: 17,
    fullyManagedAdminMinPerWorkerPerMonth: 3,

    employerManagedBaseAdminHoursPerYear: 240,
    fullyManagedBaseAdminHoursPerYear: 60,

    employerManagedWorkerBurdenMinPerWorkerPerMonth: 22,
    fullyManagedWorkerBurdenMinPerWorkerPerMonth: 5,

    employerManagedParticipationRate: 0.56,
    fullyManagedParticipationRate: 0.88,
    employerManagedWearComplianceRate: 0.72,
    fullyManagedWearComplianceRate: 0.93,

    employerManagedRemakeRate: 0.07,
    fullyManagedRemakeRate: 0.02,

    noProgramDisruptionHoursPerWorkerPerYear: 2.6,
    protectionEffectiveness: 0.9,
    fullyManagedOnboardingFee: 3500,
  },
};

/* ── Global constants ── */

export const ADMIN_HOURLY_RATE = 45;
export const WORKER_HOURLY_RATE = 35;
export const HOURS_LOST_PER_REMAKE_EVENT = 2;
export const ONBOARDING_AMORTIZATION_YEARS = 3;
