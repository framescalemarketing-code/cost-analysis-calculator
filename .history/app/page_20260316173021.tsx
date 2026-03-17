"use client";

import { useMemo, useState } from "react";
import {
  type IndustryKey,
  INDUSTRIES,
} from "./lib/industryConfig";
import {
  calcNoProgram,
  calcEmployerManaged,
  calcFullyManaged,
  calcOperationalImpact,
  calcSavingsVsEmployerManaged,
  calcScaleData,
} from "./lib/calculations";

type PackageOption = "Compliance" | "Comfort" | "Complete OS" | "Covered";
type ServiceOption = "Essential" | "Access" | "Premier" | "Enterprise";
type SiteProfile = "Single Site" | "Multi-Site" | "Enterprise";

const PACKAGE_PRICE: Record<PackageOption, number> = {
  Compliance: 235,
  Comfort: 290,
  "Complete OS": 435,
  Covered: 500,
};

const SERVICE_PRICE: Record<ServiceOption, number> = {
  Essential: 65,
  Access: 85,
  Premier: 105,
  Enterprise: 130,
};

const ONBOARDING_BY_SITE: Record<SiteProfile, number> = {
  "Single Site": 2500,
  "Multi-Site": 9000,
  Enterprise: 15000,
};

/* ── formatting helpers ─────────────────────────────── */

function currency(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function num(v: number, d = 1) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: d }).format(v);
}

/* ── Workforce Scale Chart (SVG) ──────────────────── */

function ScaleChart({
  data,
  userWorkers,
  breakevenWorkers,
}: {
  data: { workers: number; employerManagedCost: number; fullyManagedCost: number; noProgramExposure: number }[];
  userWorkers: number;
  breakevenWorkers: number | null;
}) {
  const W = 720;
  const H = 380;
  const pad = { top: 30, right: 24, bottom: 56, left: 82 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const maxW = data[data.length - 1]?.workers || 1;
  const maxCost = Math.max(
    ...data.map((p) => Math.max(p.employerManagedCost, p.fullyManagedCost, p.noProgramExposure)),
  );
  const yMax = Math.ceil(maxCost / 50000) * 50000 || 50000;

  const x = (w: number) => pad.left + (w / maxW) * cw;
  const y = (v: number) => pad.top + ch - (v / yMax) * ch;

  const toPath = (pts: { w: number; v: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.w).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");

  const emPath = toPath(data.map((d) => ({ w: d.workers, v: d.employerManagedCost })));
  const fmPath = toPath(data.map((d) => ({ w: d.workers, v: d.fullyManagedCost })));
  const npPath = toPath(data.map((d) => ({ w: d.workers, v: d.noProgramExposure })));

  // Y axis labels
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => (yMax / yTicks) * i);

  // X axis labels
  const xTicks = 5;
  const xLabels = Array.from({ length: xTicks + 1 }, (_, i) => Math.round((maxW / xTicks) * i));

  // User worker count position
  const userX = x(Math.min(userWorkers, maxW));

  // Breakeven position
  const beX = breakevenWorkers != null ? x(Math.min(breakevenWorkers, maxW)) : null;

  // Interpolate cost at breakeven for circle marker
  const beY = (() => {
    if (breakevenWorkers == null || breakevenWorkers > maxW) return 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].workers >= breakevenWorkers) {
        const prev = data[i - 1];
        const curr = data[i];
        const t = curr.workers === prev.workers ? 0 : (breakevenWorkers - prev.workers) / (curr.workers - prev.workers);
        return prev.employerManagedCost + t * (curr.employerManagedCost - prev.employerManagedCost);
      }
    }
    return data[data.length - 1].employerManagedCost;
  })();

  return (
    <div className="svg-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="scale-svg">
        {/* Grid */}
        {yLabels.map((v) => (
          <line key={v} x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
        ))}

        {/* No Program line */}
        <path d={npPath} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 4" />

        {/* Employer Managed line */}
        <path d={emPath} fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" />

        {/* Fully Managed line */}
        <path d={fmPath} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" />

        {/* Breakeven vertical line */}
        {beX != null && breakevenWorkers != null && breakevenWorkers <= maxW && (
          <>
            <line x1={beX} x2={beX} y1={pad.top} y2={pad.top + ch} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
            <circle cx={beX} cy={y(beY)} r={4} fill="#f59e0b" />
            <text
              x={beX}
              y={pad.top - 8}
              textAnchor="middle"
              fontSize={10}
              fill="#92400e"
              fontWeight={700}
            >
              Breakeven: {num(breakevenWorkers, 0)}
            </text>
          </>
        )}

        {/* User worker count vertical line */}
        <line x1={userX} x2={userX} y1={pad.top} y2={pad.top + ch} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3" />
        <text
          x={userX}
          y={pad.top + ch + 36}
          textAnchor="middle"
          fontSize={10}
          fill="#1d4ed8"
          fontWeight={700}
        >
          Your workforce: {num(userWorkers, 0)}
        </text>

        {/* Y axis labels */}
        {yLabels.map((v) => (
          <text key={v} x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#64748b">
            {v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
          </text>
        ))}

        {/* X axis labels */}
        {xLabels.map((w) => (
          <text key={w} x={x(w)} y={H - pad.bottom + 20} textAnchor="middle" fontSize={11} fill="#64748b">
            {w}
          </text>
        ))}

        {/* Axis titles */}
        <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={12} fill="#334155" fontWeight={600}>
          Eligible Workers Needing Safety Eyewear
        </text>
        <text
          x={14}
          y={H / 2}
          textAnchor="middle"
          fontSize={12}
          fill="#334155"
          fontWeight={600}
          transform={`rotate(-90,14,${H / 2})`}
        >
          Annual Total Cost
        </text>
      </svg>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────── */

export default function HomePage() {
  const [workers, setWorkers] = useState(500);
  const [industry, setIndustry] = useState<IndustryKey>("Manufacturing");
  const [packageOption, setPackageOption] = useState<PackageOption>("Compliance");
  const [serviceOption, setServiceOption] = useState<ServiceOption>("Essential");
  const [siteProfile, setSiteProfile] = useState<SiteProfile>("Single Site");

  const d = INDUSTRIES[industry];

  const fullyManagedPricePerWorker =
    PACKAGE_PRICE[packageOption] + SERVICE_PRICE[serviceOption];
  const onboardingFee = ONBOARDING_BY_SITE[siteProfile];
  const fmPricing = {
    eyewearCostPerWorker: fullyManagedPricePerWorker,
    onboardingFee,
  };

  /* ── No Program ── */
  const noProgram = useMemo(() => calcNoProgram(workers, d), [workers, d]);

  /* ── Employer Managed ── */
  const em = useMemo(() => calcEmployerManaged(workers, d), [workers, d]);

  /* ── Fully Managed ── */
  const fm = useMemo(
    () => calcFullyManaged(workers, d, fmPricing),
    [workers, d, fmPricing.eyewearCostPerWorker, fmPricing.onboardingFee],
  );

  /* ── Operational Impact ── */
  const impact = useMemo(() => calcOperationalImpact(em, fm), [em, fm]);

  /* ── Savings ── */
  const savings = useMemo(
    () => calcSavingsVsEmployerManaged(em, fm, impact, d),
    [em, fm, impact, d],
  );

  /* ── Scale chart data ── */
  const scaleData = useMemo(() => {
    const chartMax = Math.max(workers * 2.5, 200);
    return calcScaleData(d, chartMax, 60, fmPricing);
  }, [workers, d, fmPricing.eyewearCostPerWorker, fmPricing.onboardingFee]);

  const crossoverWorkers = useMemo(() => {
    const first = scaleData.find(
      (p) => p.workers > 0 && p.fullyManagedCost <= p.employerManagedCost,
    );
    return first?.workers ?? null;
  }, [scaleData]);

  const isFmLowerAtInput = fm.totalCost <= em.totalCost;
  const fmLowerAtAllScales = useMemo(
    () => scaleData.filter((p) => p.workers > 0).every((p) => p.fullyManagedCost <= p.employerManagedCost),
    [scaleData],
  );

  return (
    <main className="page">
      {/* ── HERO ── */}
      <section className="hero card">
        <p className="eyebrow">Safety Eyewear Savings Calculator</p>
        <h1>Understand the True Cost of Your Safety Eyewear Approach</h1>
        <p>
          See how having no program compares to managing one yourself — and at what
          scale a fully managed program becomes the more economical choice.
        </p>
      </section>

      {/* ── INPUT ── */}
      <section className="card input-section">
        <h2>Your Workforce</h2>
        <p className="section-sub">
          Enter the number of workers who need safety eyewear. Industry
          assumptions populate automatically.
        </p>

        <div className="input-row">
          <label className="big-field" htmlFor="workers">
            <span>How many workers need safety eyewear?</span>
            <div className="input-wrap big-input">
              <input
                id="workers"
                type="number"
                min={1}
                value={workers}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isFinite(v) && v >= 0) setWorkers(v);
                }}
              />
              <em>workers</em>
            </div>
          </label>
        </div>

        <div className="industry-pick">
          <p>
            Select your industry{" "}
            <span className="avg-tag">Sets industry averages</span>
          </p>
          <div className="chip-row">
            {(Object.keys(INDUSTRIES) as IndustryKey[]).map((key) => (
              <button
                type="button"
                key={key}
                className={industry === key ? "chip active" : "chip"}
                onClick={() => setIndustry(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div className="industry-pick" style={{ marginTop: 16 }}>
          <p>
            Fully Managed pricing model <span className="avg-tag">Your package + tier</span>
          </p>
          <div className="input-row" style={{ marginTop: 10 }}>
            <label className="big-field" htmlFor="package-option">
              <span>Eyewear package</span>
              <div className="input-wrap">
                <select
                  id="package-option"
                  value={packageOption}
                  onChange={(e) => setPackageOption(e.target.value as PackageOption)}
                >
                  <option value="Compliance">Compliance ($235)</option>
                  <option value="Comfort">Comfort ($290)</option>
                  <option value="Complete OS">Complete OS ($435)</option>
                  <option value="Covered">Covered (default $500)</option>
                </select>
              </div>
            </label>

            <label className="big-field" htmlFor="service-option">
              <span>Service tier</span>
              <div className="input-wrap">
                <select
                  id="service-option"
                  value={serviceOption}
                  onChange={(e) => setServiceOption(e.target.value as ServiceOption)}
                >
                  <option value="Essential">Essential ($65)</option>
                  <option value="Access">Access ($85)</option>
                  <option value="Premier">Premier ($105)</option>
                  <option value="Enterprise">Enterprise (default $130)</option>
                </select>
              </div>
            </label>

            <label className="big-field" htmlFor="site-profile">
              <span>Onboarding complexity</span>
              <div className="input-wrap">
                <select
                  id="site-profile"
                  value={siteProfile}
                  onChange={(e) => setSiteProfile(e.target.value as SiteProfile)}
                >
                  <option value="Single Site">Single Site ($2,500)</option>
                  <option value="Multi-Site">Multi-Site (~10 locations) ($9,000)</option>
                  <option value="Enterprise">Enterprise 10+ sites ($15,000)</option>
                </select>
              </div>
            </label>
          </div>
          <p className="section-sub" style={{ marginTop: 8 }}>
            Fully Managed per-worker price in this scenario: {currency(fullyManagedPricePerWorker)}
            {" "}(package + service).
          </p>
        </div>
      </section>

      {/* ── PART 1: NO PROGRAM ── */}
      <section className="card part-card">
        <div className="part-label">Part 1</div>
        <h2>Estimated Annual Exposure With No Program</h2>
        <p className="section-sub">
          Without a formal safety eyewear program, your organization faces
          these estimated costs each year based on{" "}
          <span className="avg-tag">Industry Averages</span> for {industry}.
        </p>

        <div className="result-grid three-col">
          <div className="result-card danger">
            <h3>Expected Eye Injuries</h3>
            <p className="big-num">{num(noProgram.expectedInjuries, 2)}</p>
            <small>per year among {num(workers, 0)} eligible workers</small>
          </div>
          <div className="result-card danger">
            <h3>Direct &amp; Indirect Injury Cost</h3>
            <p className="big-num">{currency(noProgram.injuryCost)}</p>
            <small>medical, workers&rsquo; comp, lost time, schedule disruption</small>
          </div>
          <div className="result-card warn">
            <h3>Citation Exposure</h3>
            <p className="big-num">{currency(noProgram.citationCost)}</p>
            <small>
              estimated OSHA citation risk at $
              {num(d.avgCitationCost, 0)} per serious violation
            </small>
          </div>
        </div>

        <div className="result-grid two-col" style={{ marginTop: 12 }}>
          <div className="result-card warn">
            <h3>Productivity Loss</h3>
            <p className="big-num">{currency(noProgram.productivityLossValue)}</p>
            <small>
              {num(noProgram.productivityLossHours, 0)} hours of disruption per year
            </small>
          </div>
          <div className="result-card">
            <h3>Total Annual Exposure</h3>
            <p className="big-num negative">{currency(noProgram.totalExposure)}</p>
            <small>combined annual risk without a program</small>
          </div>
        </div>
      </section>

      {/* ── PART 2: EMPLOYER MANAGED vs FULLY MANAGED ── */}
      <section className="card part-card">
        <div className="part-label">Part 2</div>
        <h2>Employer Managed vs. Fully Managed Program</h2>
        <p className="section-sub">
          Running a program is better than having none. But managing it
          internally still carries administrative burden, worker time costs,
          and operational rework. Here&rsquo;s how the two approaches compare.{" "}
          <span className="avg-tag">Industry Averages</span>
        </p>

        {/* ── Top-row summary cards ── */}
        <div className="result-grid three-col" style={{ marginTop: 16 }}>
          <div className="result-card">
            <h3>Employer Managed Program</h3>
            <p className="big-num">{currency(em.totalCost)}</p>
            <small>annual cost</small>
          </div>
          <div className="result-card">
            <h3>Fully Managed Program</h3>
            <p className="big-num" style={{ color: savings.netAnnualSavings > 0 ? "var(--positive)" : "var(--ink-900)" }}>
              {currency(fm.totalCost)}
            </p>
            <small>annual cost</small>
          </div>
          <div className="result-card emphasis-card">
            <h3>Net Annual Savings</h3>
            <p className="big-num" style={{ color: savings.netAnnualSavings > 0 ? "var(--positive)" : "var(--negative)" }}>
              {currency(savings.netAnnualSavings)}
            </p>
            <small>
              {savings.netAnnualSavings > 0
                ? "saved per year with Fully Managed"
                : "additional cost per year with Fully Managed"
              }
            </small>
          </div>
        </div>

        {/* ── Operational Impact cards ── */}
        <h3 className="sub-heading">Operational Impact</h3>
        <div className="result-grid four-col">
          <div className="insight-card">
            <div className="insight-icon">&#128337;</div>
            <h4>Administrative Hours Returned</h4>
            <p className="insight-num">{num(impact.administrativeHoursReturned, 0)} hrs/yr</p>
            <small>freed from program administration</small>
          </div>
          <div className="insight-card">
            <div className="insight-icon">&#9202;</div>
            <h4>Productive Work Hours Preserved</h4>
            <p className="insight-num">{num(impact.productiveWorkHoursPreserved, 0)} hrs/yr</p>
            <small>less worker time lost to eyewear issues</small>
          </div>
          <div className="insight-card">
            <div className="insight-icon">&#128260;</div>
            <h4>Remake Events Reduced</h4>
            <p className="insight-num">{num(impact.remakeEventsReduced, 0)} fewer</p>
            <small>{num(impact.remakeHoursReduced, 0)} rework hours eliminated</small>
          </div>
          <div className="insight-card">
            <div className="insight-icon">&#128737;</div>
            <h4>Additional Workers Protected</h4>
            <p className="insight-num">{num(impact.additionalWorkersProtected, 0)} more</p>
            <small>consistently wearing compliant eyewear</small>
          </div>
        </div>

        {/* ── Cost comparison table ── */}
        <h3 className="sub-heading">Cost Comparison</h3>
        <div className="breakdown-table">
          <div className="bt-header">
            <span></span>
            <span>Employer Managed</span>
            <span>Fully Managed</span>
            <span>Difference</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Eyewear spend</span>
            <span>{currency(em.eyewearCost)}</span>
            <span>{currency(fm.eyewearCost)}</span>
            <span className={em.eyewearCost - fm.eyewearCost >= 0 ? "positive" : "negative"}>
              {currency(em.eyewearCost - fm.eyewearCost)}
            </span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Administrative burden</span>
            <span>{currency(em.adminValue)}</span>
            <span>{currency(fm.adminValue)}</span>
            <span className="positive">{currency(savings.adminSavings)}</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Worker time burden</span>
            <span>{currency(em.workerBurdenValue)}</span>
            <span>{currency(fm.workerBurdenValue)}</span>
            <span className="positive">{currency(savings.productivitySavings)}</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Remake and rework</span>
            <span>{currency(em.remakeValue)}</span>
            <span>{currency(fm.remakeValue)}</span>
            <span className="positive">{currency(savings.remakeSavings)}</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Residual injury exposure</span>
            <span>{currency(em.injuryCost)}</span>
            <span>{currency(fm.injuryCost)}</span>
            <span className="positive">{currency(savings.injurySavings)}</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Citation exposure</span>
            <span>{currency(em.citationCost)}</span>
            <span>{currency(fm.citationCost)}</span>
            <span className="positive">{currency(savings.citationSavings)}</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Onboarding (amortized over {3} yrs)</span>
            <span>—</span>
            <span>{currency(fm.onboardingAmortized)}</span>
            <span className="negative">{currency(-fm.onboardingAmortized)}</span>
          </div>
          <div className="bt-row bt-total">
            <span className="bt-label">Total annual cost</span>
            <span>{currency(em.totalCost)}</span>
            <span>{currency(fm.totalCost)}</span>
            <span className={savings.netAnnualSavings >= 0 ? "positive savings-num" : "negative savings-num"}>
              {currency(savings.netAnnualSavings)}
            </span>
          </div>
        </div>
      </section>

      {/* ── PART 3: SCALE THRESHOLD ── */}
      <section className="card part-card">
        <div className="part-label">Part 3</div>
        <h2>Scale Value: Cost Performance by Workforce Size</h2>
        <p className="section-sub">
          A Fully Managed Program carries a one-time onboarding fee (shown amortized
          over {3} years) but delivers lower per-worker operating costs. This chart
          shows whether savings overtake that upfront investment and at what scale.
        </p>

        <ScaleChart
          data={scaleData}
          userWorkers={workers}
          breakevenWorkers={fmLowerAtAllScales ? null : crossoverWorkers}
        />

        <div className="chart-legend">
          <span><i style={{ background: "#dc2626" }} />Employer Managed Program</span>
          <span><i style={{ background: "#16a34a" }} />Fully Managed Program</span>
          <span><i style={{ background: "#94a3b8" }} />No Program (exposure)</span>
          <span><i style={{ background: "#3b82f6" }} />Your workforce</span>
          {!fmLowerAtAllScales && crossoverWorkers != null && (
            <span><i style={{ background: "#f59e0b" }} />Breakeven point</span>
          )}
        </div>

        {/* Breakeven summary */}
        <div className="threshold-summary">
          <div className="threshold-row">
            <div className="threshold-item">
              <span className="threshold-label">Breakeven threshold</span>
              <span className="threshold-value">
                {fmLowerAtAllScales
                  ? "Favorable from first worker"
                  : crossoverWorkers != null
                    ? `${num(crossoverWorkers, 0)} workers`
                  : "No crossover (Employer Managed stays lower-cost)"
                }
              </span>
            </div>
            <div className="threshold-item">
              <span className="threshold-label">Your input</span>
              <span className="threshold-value">{num(workers, 0)} workers</span>
            </div>
            <div className="threshold-item">
              <span className="threshold-label">Status</span>
              <span className={`threshold-value ${isFmLowerAtInput ? "positive" : "warn-text"}`}>
                {fmLowerAtAllScales
                  ? "Favorable at all scales"
                  : isFmLowerAtInput
                    ? "Favorable at your size"
                    : "Not favorable at your size"
                }
              </span>
            </div>
          </div>

          {!fmLowerAtAllScales && crossoverWorkers != null && (
            <p className="threshold-message">
              {isFmLowerAtInput
                ? `Fully Managed becomes more economical above about ${num(crossoverWorkers, 0)} workers. At your current size of ${num(workers, 0)}, Fully Managed is the lower-cost option.`
                : `At your current size of ${num(workers, 0)} workers, Employer Managed may be lower-cost. Fully Managed becomes favorable above about ${num(crossoverWorkers, 0)} workers.`
              }
            </p>
          )}
          {fmLowerAtAllScales && (
            <p className="threshold-message">
              Under these assumptions and selected package/tier, Fully Managed
              is already the lower-cost model at your current size and remains
              favorable as workforce size increases.
            </p>
          )}
          {!fmLowerAtAllScales && crossoverWorkers == null && (
            <p className="threshold-message">
              With this pricing scenario, Employer Managed remains the lower-cost
              option at all workforce sizes. Fully Managed may still be preferred
              for employee experience, compliance quality, and operational control.
            </p>
          )}
        </div>
      </section>

      {/* ── BOTTOM LINE ── */}
      <section className="card bottom-line-card">
        <h2>Your Bottom Line</h2>
        <div className="bottom-line-grid">
          <div className="bl-item">
            <h3>No Program Annual Exposure</h3>
            <p className="bl-negative">{currency(noProgram.totalExposure)}</p>
            <small>injury, citation, and productivity risk</small>
          </div>
          <div className="bl-item">
            <h3>Employer Managed Program</h3>
            <p>{currency(em.totalCost)}</p>
            <small>annual cost with internal administration</small>
          </div>
          <div className="bl-item">
            <h3>Fully Managed Program</h3>
            <p className={savings.netAnnualSavings > 0 ? "bl-positive" : ""}>
              {currency(fm.totalCost)}
            </p>
            <small>annual cost, fully outsourced</small>
          </div>
          <div className="bl-item emphasis">
            <h3>Net Annual Savings</h3>
            <p className={savings.netAnnualSavings > 0 ? "bl-positive" : "bl-negative"}>
              {currency(savings.netAnnualSavings)}
            </p>
            <small>
              {savings.netAnnualSavings > 0
                ? "saved per year with Fully Managed"
                : "additional cost per year with Fully Managed"
              }
            </small>
          </div>
        </div>
        <div className="bl-sentence">
          {fmLowerAtAllScales && (
            <p>
              With your selected pricing profile, Fully Managed is cost-favorable
              from the first worker and remains favorable as scale grows.
            </p>
          )}
          {!fmLowerAtAllScales && crossoverWorkers != null && isFmLowerAtInput && (
            <p>
              For organizations with about {num(crossoverWorkers, 0)} or
              more workers needing safety eyewear, a Fully Managed Program becomes
              the more economical operating model under current assumptions.
            </p>
          )}
          {!fmLowerAtAllScales && crossoverWorkers != null && !isFmLowerAtInput && (
            <p>
              At {num(workers, 0)} workers, an Employer Managed Program is currently
              lower-cost. Fully Managed becomes more economical above about
              {" "}{num(crossoverWorkers, 0)} workers.
            </p>
          )}
          {!fmLowerAtAllScales && crossoverWorkers == null && (
            <p>
              Under this pricing scenario, Employer Managed remains the lower-cost
              structure at all workforce sizes, while Fully Managed may still win
              on adoption, consistency, and employee experience.
            </p>
          )}
        </div>
      </section>



      {/* ── DISCLOSURE ── */}
      <section className="card disclosure">
        <h2>How We Calculate This</h2>
        <p>
          All figures use published industry averages for {industry.toLowerCase()} workplaces:
          BLS Survey of Occupational Injuries and Illnesses (SOII) for injury rates,
          NSC Injury Facts and NCCI claims data for direct costs,
          Liberty Mutual / Stanford research for indirect cost multipliers,
          OSHA 2025 penalty schedules (${num(d.avgCitationCost, 0)} serious citation max),
          and EHS program management benchmarks for admin and productivity time.
          Every formula scales with your eligible workforce size. The single input
          from you is the number of workers needing safety eyewear plus your selected
          package, service tier, and onboarding complexity; everything else reflects
          published industry assumptions that can be reviewed and adjusted.
        </p>
      </section>
    </main>
  );
}
