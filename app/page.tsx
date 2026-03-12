"use client";

import { useMemo, useState } from "react";

type NumericFieldProps = {
  id: string;
  label: string;
  value: number;
  min?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
};

function NumericField({
  id,
  label,
  value,
  min = 0,
  step = 1,
  prefix,
  suffix,
  onChange,
}: NumericFieldProps) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <div className="input-wrap">
        {prefix ? <em>{prefix}</em> : null}
        <input
          id={id}
          type="number"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {suffix ? <em>{suffix}</em> : null}
      </div>
    </label>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HomePage() {
  const [workforceSize, setWorkforceSize] = useState(500);
  const [annualEyeIncidents, setAnnualEyeIncidents] = useState(8);
  const [visionLossIncidents, setVisionLossIncidents] = useState(0.05);
  const [medicalCost, setMedicalCost] = useState(5800);
  const [workLossCost, setWorkLossCost] = useState(1690);
  const [visionLossCost, setVisionLossCost] = useState(159358);

  const [currentAnnualEyewearSpend, setCurrentAnnualEyewearSpend] = useState(120000);
  const [currentAdminHoursPerWeek, setCurrentAdminHoursPerWeek] = useState(12);
  const [currentProductivityLossHoursPerWeek, setCurrentProductivityLossHoursPerWeek] = useState(18);

  const [managedAnnualProgramSpend, setManagedAnnualProgramSpend] = useState(155000);
  const [managedAdminHoursPerWeek, setManagedAdminHoursPerWeek] = useState(5);
  const [managedProductivityLossHoursPerWeek, setManagedProductivityLossHoursPerWeek] = useState(8);

  const [hourlyAdminRate, setHourlyAdminRate] = useState(48);
  const [hourlyProductivityValue, setHourlyProductivityValue] = useState(62);
  const [managedIncidentReductionPct, setManagedIncidentReductionPct] = useState(20);

  const calculations = useMemo(() => {
    const nonFatalInjuryCost = annualEyeIncidents * (medicalCost + workLossCost);
    const severeInjuryCost = visionLossIncidents * visionLossCost;
    const injuryCostCurrent = nonFatalInjuryCost + severeInjuryCost;

    const currentAdminCost = currentAdminHoursPerWeek * 52 * hourlyAdminRate;
    const currentProductivityCost = currentProductivityLossHoursPerWeek * 52 * hourlyProductivityValue;

    const managedAdminCost = managedAdminHoursPerWeek * 52 * hourlyAdminRate;
    const managedProductivityCost = managedProductivityLossHoursPerWeek * 52 * hourlyProductivityValue;
    const managedInjuryCost = injuryCostCurrent * Math.max(0, 1 - managedIncidentReductionPct / 100);

    const currentTotal = currentAnnualEyewearSpend + currentAdminCost + currentProductivityCost + injuryCostCurrent;
    const managedTotal =
      managedAnnualProgramSpend + managedAdminCost + managedProductivityCost + managedInjuryCost;

    const annualSavings = currentTotal - managedTotal;
    const extraProgramInvestment = managedAnnualProgramSpend - currentAnnualEyewearSpend;

    let paybackMonths = 0;
    if (extraProgramInvestment > 0 && annualSavings > 0) {
      paybackMonths = (extraProgramInvestment / annualSavings) * 12;
    }

    return {
      nonFatalInjuryCost,
      severeInjuryCost,
      injuryCostCurrent,
      currentAdminCost,
      currentProductivityCost,
      managedAdminCost,
      managedProductivityCost,
      managedInjuryCost,
      currentTotal,
      managedTotal,
      annualSavings,
      extraProgramInvestment,
      paybackMonths,
    };
  }, [
    annualEyeIncidents,
    medicalCost,
    workLossCost,
    visionLossIncidents,
    visionLossCost,
    currentAdminHoursPerWeek,
    currentAnnualEyewearSpend,
    currentProductivityLossHoursPerWeek,
    managedAdminHoursPerWeek,
    managedAnnualProgramSpend,
    managedIncidentReductionPct,
    managedProductivityLossHoursPerWeek,
    hourlyAdminRate,
    hourlyProductivityValue,
  ]);

  return (
    <main className="page">
      <section className="hero card">
        <p className="eyebrow">Cost Analysis Calculator</p>
        <h1>Safety Eyewear Program Cost Analysis Calculator</h1>
        <p>
          Estimate injury-cost exposure and compare current program economics to a managed model. Figures are
          directional planning context, not company-specific forecasts.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>1) Injury Cost Context</h2>
          <div className="fields two-col">
            <NumericField
              id="workforce"
              label="Workforce Size"
              value={workforceSize}
              onChange={setWorkforceSize}
            />
            <NumericField
              id="incidents"
              label="Annual Eye Incidents (nonfatal)"
              value={annualEyeIncidents}
              step={0.1}
              onChange={setAnnualEyeIncidents}
            />
            <NumericField
              id="vision-loss"
              label="Vision Loss Incidents (annual estimate)"
              value={visionLossIncidents}
              step={0.01}
              onChange={setVisionLossIncidents}
            />
            <NumericField
              id="medical"
              label="Medical Cost Per Nonfatal Injury"
              value={medicalCost}
              prefix="$"
              onChange={setMedicalCost}
            />
            <NumericField
              id="work-loss"
              label="Work Loss Cost Per Nonfatal Injury"
              value={workLossCost}
              prefix="$"
              onChange={setWorkLossCost}
            />
            <NumericField
              id="vision-loss-cost"
              label="Cost Per Vision Loss Incident"
              value={visionLossCost}
              prefix="$"
              onChange={setVisionLossCost}
            />
          </div>

          <div className="result">
            <h3>Estimated Current Annual Injury Cost</h3>
            <p className="big">{currency(calculations.injuryCostCurrent)}</p>
            <p>
              Nonfatal injury component: <strong>{currency(calculations.nonFatalInjuryCost)}</strong>
            </p>
            <p>
              Vision loss component: <strong>{currency(calculations.severeInjuryCost)}</strong>
            </p>
            <p className="small">National context defaults: CDC averages ($5,800 medical, $1,690 work loss) and OSHA Safety Pays estimate ($159,358 vision loss incident).</p>
          </div>
        </article>

        <article className="card">
          <h2>2) Program Cost Comparison</h2>
          <div className="fields two-col">
            <NumericField
              id="current-spend"
              label="Current Annual Eyewear Program Spend"
              value={currentAnnualEyewearSpend}
              prefix="$"
              onChange={setCurrentAnnualEyewearSpend}
            />
            <NumericField
              id="managed-spend"
              label="Managed Program Annual Spend"
              value={managedAnnualProgramSpend}
              prefix="$"
              onChange={setManagedAnnualProgramSpend}
            />
            <NumericField
              id="current-admin"
              label="Current Admin Hours / Week"
              value={currentAdminHoursPerWeek}
              step={0.5}
              onChange={setCurrentAdminHoursPerWeek}
            />
            <NumericField
              id="managed-admin"
              label="Managed Admin Hours / Week"
              value={managedAdminHoursPerWeek}
              step={0.5}
              onChange={setManagedAdminHoursPerWeek}
            />
            <NumericField
              id="current-productivity"
              label="Current Productivity Loss Hours / Week"
              value={currentProductivityLossHoursPerWeek}
              step={0.5}
              onChange={setCurrentProductivityLossHoursPerWeek}
            />
            <NumericField
              id="managed-productivity"
              label="Managed Productivity Loss Hours / Week"
              value={managedProductivityLossHoursPerWeek}
              step={0.5}
              onChange={setManagedProductivityLossHoursPerWeek}
            />
            <NumericField
              id="admin-rate"
              label="Admin Hourly Rate"
              value={hourlyAdminRate}
              prefix="$"
              onChange={setHourlyAdminRate}
            />
            <NumericField
              id="productivity-value"
              label="Productivity Hourly Value"
              value={hourlyProductivityValue}
              prefix="$"
              onChange={setHourlyProductivityValue}
            />
            <NumericField
              id="incident-reduction"
              label="Managed Incident Reduction Assumption"
              value={managedIncidentReductionPct}
              suffix="%"
              step={1}
              onChange={setManagedIncidentReductionPct}
            />
          </div>

          <div className="comparison">
            <div>
              <h3>Current Total Annual Cost</h3>
              <p className="big">{currency(calculations.currentTotal)}</p>
            </div>
            <div>
              <h3>Managed Model Annual Cost</h3>
              <p className="big">{currency(calculations.managedTotal)}</p>
            </div>
            <div>
              <h3>Estimated Annual Savings</h3>
              <p className={`big ${calculations.annualSavings >= 0 ? "positive" : "negative"}`}>
                {currency(calculations.annualSavings)}
              </p>
            </div>
          </div>

          <div className="result">
            <p>
              Additional managed-program spend: <strong>{currency(calculations.extraProgramInvestment)}</strong>
            </p>
            <p>
              Estimated payback: <strong>{calculations.paybackMonths > 0 ? `${calculations.paybackMonths.toFixed(1)} months` : "Not reached with current assumptions"}</strong>
            </p>
            <p className="small">
              This comparison includes direct program spend, administrative effort, productivity friction, and injury-cost context.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
