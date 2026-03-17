"use client";

import { useMemo, useState } from "react";

/* ── helpers ──────────────────────────────────────────── */

function currency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}
function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}
function num(v: number, d = 1) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: d }).format(v);
}

/* ── industry data ────────────────────────────────────── */

type IndustryKey = "Manufacturing" | "Construction" | "Warehousing" | "Utilities";

type IndustryData = {
  injuryRate: number;       // injuries per worker per year
  avgDirectCost: number;    // avg direct cost per eye injury
  indirectMultiplier: number;
  // DIY program defaults
  diyProgramCost: number;   // $ per worker per year
  diyParticipation: number;
  diyCompliance: number;
  diyAdminHoursWeek: number;
  diyLostHoursWeek: number;
  diyRemakeRate: number;
  // Managed program defaults
  managedProgramCost: number;
  managedParticipation: number;
  managedCompliance: number;
  managedAdminHoursWeek: number;
  managedLostHoursWeek: number;
  managedRemakeRate: number;
};

const INDUSTRIES: Record<IndustryKey, IndustryData> = {
  Manufacturing: {
    injuryRate: 0.00017, avgDirectCost: 3000, indirectMultiplier: 3,
    diyProgramCost: 150, diyParticipation: 0.55, diyCompliance: 0.70, diyAdminHoursWeek: 10, diyLostHoursWeek: 16, diyRemakeRate: 0.08,
    managedProgramCost: 220, managedParticipation: 0.85, managedCompliance: 0.92, managedAdminHoursWeek: 3, managedLostHoursWeek: 4, managedRemakeRate: 0.03,
  },
  Construction: {
    injuryRate: 0.00021, avgDirectCost: 3200, indirectMultiplier: 3.2,
    diyProgramCost: 155, diyParticipation: 0.50, diyCompliance: 0.66, diyAdminHoursWeek: 12, diyLostHoursWeek: 18, diyRemakeRate: 0.09,
    managedProgramCost: 225, managedParticipation: 0.82, managedCompliance: 0.90, managedAdminHoursWeek: 3, managedLostHoursWeek: 5, managedRemakeRate: 0.03,
  },
  Warehousing: {
    injuryRate: 0.00013, avgDirectCost: 2800, indirectMultiplier: 2.8,
    diyProgramCost: 140, diyParticipation: 0.60, diyCompliance: 0.73, diyAdminHoursWeek: 8, diyLostHoursWeek: 12, diyRemakeRate: 0.07,
    managedProgramCost: 210, managedParticipation: 0.87, managedCompliance: 0.93, managedAdminHoursWeek: 3, managedLostHoursWeek: 4, managedRemakeRate: 0.02,
  },
  Utilities: {
    injuryRate: 0.00015, avgDirectCost: 2900, indirectMultiplier: 2.9,
    diyProgramCost: 145, diyParticipation: 0.58, diyCompliance: 0.72, diyAdminHoursWeek: 9, diyLostHoursWeek: 14, diyRemakeRate: 0.07,
    managedProgramCost: 215, managedParticipation: 0.86, managedCompliance: 0.92, managedAdminHoursWeek: 3, managedLostHoursWeek: 4, managedRemakeRate: 0.02,
  },
};

const ADMIN_HOURLY = 45;
const WORKER_HOURLY = 35;
const REMAKE_HOURS_LOST = 2;
const PROTECTION_EFFECTIVENESS = 0.9;

/* ── stacked bar ──────────────────────────────────────── */

type BarSegment = { label: string; value: number; className: string };

function StackedBar({ title, total, segments }: { title: string; total: number; segments: BarSegment[] }) {
  return (
    <div className="stack-block">
      <div className="stack-meta">
        <h4>{title}</h4>
        <p>{currency(total)}</p>
      </div>
      <div className="stack-bar" aria-label={`${title} cost breakdown`}>
        {segments.map((s) => {
          const w = total > 0 ? (s.value / total) * 100 : 0;
          return <span key={s.label} className={`segment ${s.className}`} style={{ width: `${w}%` }} />;
        })}
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────── */

export default function HomePage() {
  const [workers, setWorkers] = useState(500);
  const [industry, setIndustry] = useState<IndustryKey>("Manufacturing");

  const d = INDUSTRIES[industry];

  /* Part 1 — cost of NO safety eyewear program */
  const noProgramCosts = useMemo(() => {
    const injuries = workers * d.injuryRate;
    const direct = injuries * d.avgDirectCost;
    const indirect = direct * d.indirectMultiplier;
    const totalInjury = direct + indirect;
    // OSHA penalty exposure (average per serious citation)
    const oshaAvgPenalty = 16131;
    const oshaPenaltyExposure = injuries > 0 ? oshaAvgPenalty * Math.ceil(injuries) : 0;
    // Unprotected productivity loss — no program means more disruptions
    const productivityLoss = workers * 0.004 * WORKER_HOURLY * 52; // ~0.2 hrs/week per worker in disruptions
    const totalExposure = totalInjury + oshaPenaltyExposure + productivityLoss;
    return { injuries, direct, indirect, totalInjury, oshaPenaltyExposure, productivityLoss, totalExposure };
  }, [workers, d]);

  /* Part 2 — DIY vs Managed comparison */
  const comparison = useMemo(() => {
    const diyProgramSpend = workers * d.diyProgramCost;
    const managedProgramSpend = workers * d.managedProgramCost;

    const diyCoverage = d.diyParticipation * d.diyCompliance;
    const managedCoverage = d.managedParticipation * d.managedCompliance;

    const baseInjuries = workers * d.injuryRate;
    const injuryUnit = d.avgDirectCost * (1 + d.indirectMultiplier);

    const diyInjuries = baseInjuries * (1 - diyCoverage * PROTECTION_EFFECTIVENESS);
    const managedInjuries = baseInjuries * (1 - managedCoverage * PROTECTION_EFFECTIVENESS);
    const diyInjuryCost = diyInjuries * injuryUnit;
    const managedInjuryCost = managedInjuries * injuryUnit;

    const diyAdminCost = d.diyAdminHoursWeek * 52 * ADMIN_HOURLY;
    const managedAdminCost = d.managedAdminHoursWeek * 52 * ADMIN_HOURLY;

    const diyProductivityCost = d.diyLostHoursWeek * 52 * WORKER_HOURLY;
    const managedProductivityCost = d.managedLostHoursWeek * 52 * WORKER_HOURLY;

    const diyRemakeCost = workers * d.diyRemakeRate * REMAKE_HOURS_LOST * WORKER_HOURLY;
    const managedRemakeCost = workers * d.managedRemakeRate * REMAKE_HOURS_LOST * WORKER_HOURLY;

    const diyTotal = diyProgramSpend + diyAdminCost + diyProductivityCost + diyRemakeCost + diyInjuryCost;
    const managedTotal = managedProgramSpend + managedAdminCost + managedProductivityCost + managedRemakeCost + managedInjuryCost;
    const savings = diyTotal - managedTotal;

    return {
      diyProgramSpend, managedProgramSpend,
      diyAdminCost, managedAdminCost,
      diyProductivityCost, managedProductivityCost,
      diyRemakeCost, managedRemakeCost,
      diyInjuryCost, managedInjuryCost,
      diyTotal, managedTotal, savings,
      diyCoverage, managedCoverage,
      diyInjuries, managedInjuries,
    };
  }, [workers, d]);

  const diySegments: BarSegment[] = [
    { label: "Eyewear", value: comparison.diyProgramSpend, className: "program" },
    { label: "Admin", value: comparison.diyAdminCost, className: "admin" },
    { label: "Productivity", value: comparison.diyProductivityCost, className: "productivity" },
    { label: "Remakes", value: comparison.diyRemakeCost, className: "remake" },
    { label: "Injuries", value: comparison.diyInjuryCost, className: "injury" },
  ];
  const managedSegments: BarSegment[] = [
    { label: "Eyewear", value: comparison.managedProgramSpend, className: "program" },
    { label: "Admin", value: comparison.managedAdminCost, className: "admin" },
    { label: "Productivity", value: comparison.managedProductivityCost, className: "productivity" },
    { label: "Remakes", value: comparison.managedRemakeCost, className: "remake" },
    { label: "Injuries", value: comparison.managedInjuryCost, className: "injury" },
  ];

  const hiddenCosts = [
    { label: "Admin time savings", diy: comparison.diyAdminCost, managed: comparison.managedAdminCost },
    { label: "Productivity recovery", diy: comparison.diyProductivityCost, managed: comparison.managedProductivityCost },
    { label: "Fewer remakes", diy: comparison.diyRemakeCost, managed: comparison.managedRemakeCost },
    { label: "Lower injury exposure", diy: comparison.diyInjuryCost, managed: comparison.managedInjuryCost },
  ];

  return (
    <main className="page">
      {/* ── HERO ── */}
      <section className="hero card">
        <p className="eyebrow">Safety Eyewear Savings Calculator</p>
        <h1>What Is Your Safety Eyewear Program Really Costing You?</h1>
        <p>
          Enter your workforce size below. We&rsquo;ll show you the true cost of going without a
          program, then reveal why managing it yourself may cost more than you think.
        </p>
      </section>

      {/* ── YOUR INPUT ── */}
      <section className="card input-section">
        <h2>Your Workforce</h2>
        <p className="section-sub">This is the only number we need. Everything else uses industry-verified averages.</p>

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
          <p>Select your industry <span className="avg-tag">Sets industry averages</span></p>
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
      </section>

      {/* ── PART 1: COST OF NO PROGRAM ── */}
      <section className="card part-card">
        <div className="part-label">Part 1</div>
        <h2>The Cost of Having No Safety Eyewear Program</h2>
        <p className="section-sub">
          Without a formal program, your business faces these risks every year. All figures below are
          calculated from <span className="avg-tag">Industry Averages</span> for {industry}.
        </p>

        <div className="result-grid three-col">
          <div className="result-card danger">
            <h3>Workplace Eye Injuries</h3>
            <p className="big-num">{num(noProgramCosts.injuries, 2)}</p>
            <small>expected per year</small>
          </div>
          <div className="result-card danger">
            <h3>Direct Medical Costs</h3>
            <p className="big-num">{currency(noProgramCosts.direct)}</p>
            <small>treatment, workers&rsquo; comp claims</small>
          </div>
          <div className="result-card danger">
            <h3>Indirect Business Costs</h3>
            <p className="big-num">{currency(noProgramCosts.indirect)}</p>
            <small>lost time, training replacements, schedule disruption</small>
          </div>
        </div>

        <div className="hidden-costs-callout">
          <h3>Hidden costs most companies overlook</h3>
          <div className="result-grid two-col">
            <div className="result-card warn">
              <h3>OSHA Penalty Exposure</h3>
              <p className="big-num">{currency(noProgramCosts.oshaPenaltyExposure)}</p>
              <small>average $16,131 per serious citation</small>
            </div>
            <div className="result-card warn">
              <h3>Unprotected Productivity Loss</h3>
              <p className="big-num">{currency(noProgramCosts.productivityLoss)}</p>
              <small>disruptions, downtime, and workarounds</small>
            </div>
          </div>
        </div>

        <div className="total-exposure-card">
          <h3>Total Annual Risk Exposure Without a Program</h3>
          <p className="hero-num negative">{currency(noProgramCosts.totalExposure)}</p>
          <small>This is what doing nothing costs your business every year.</small>
        </div>
      </section>

      {/* ── PART 2: DIY vs MANAGED ── */}
      <section className="card part-card">
        <div className="part-label">Part 2</div>
        <h2>Managing It Yourself vs. a Managed Program</h2>
        <p className="section-sub">
          Having a program is better than nothing — but how you run it matters. A self-managed (DIY) program
          comes with hidden costs that add up fast. Here&rsquo;s how it compares to a
          professionally managed program. <span className="avg-tag">Industry Averages</span>
        </p>

        {/* Side-by-side headline */}
        <div className="versus-grid">
          <div className="versus-card diy">
            <span className="versus-label">Self-Managed (DIY)</span>
            <p className="versus-total">{currency(comparison.diyTotal)}</p>
            <small>total annual cost</small>
          </div>
          <div className="versus-vs">vs</div>
          <div className="versus-card managed">
            <span className="versus-label">Professionally Managed</span>
            <p className="versus-total managed-num">{currency(comparison.managedTotal)}</p>
            <small>total annual cost</small>
          </div>
        </div>

        {/* Hidden cost breakdown */}
        <h3 className="breakdown-title">Where the Real Costs Hide</h3>
        <p className="section-sub">The eyewear itself is only part of the story. Look at what else you&rsquo;re paying for:</p>

        <div className="breakdown-table">
          <div className="bt-header">
            <span></span>
            <span>Self-Managed</span>
            <span>Managed</span>
            <span>You Save</span>
          </div>
          <div className="bt-row">
            <span className="bt-label">Eyewear cost per worker</span>
            <span>{currency(d.diyProgramCost)}</span>
            <span>{currency(d.managedProgramCost)}</span>
            <span className={d.diyProgramCost - d.managedProgramCost >= 0 ? "positive" : "negative"}>
              {currency(d.diyProgramCost - d.managedProgramCost)}
            </span>
          </div>
          {hiddenCosts.map((row) => (
            <div className="bt-row" key={row.label}>
              <span className="bt-label">{row.label}</span>
              <span>{currency(row.diy)}</span>
              <span>{currency(row.managed)}</span>
              <span className="positive">{currency(row.diy - row.managed)}</span>
            </div>
          ))}
          <div className="bt-row bt-total">
            <span className="bt-label">Total annual cost</span>
            <span>{currency(comparison.diyTotal)}</span>
            <span>{currency(comparison.managedTotal)}</span>
            <span className="positive savings-num">{currency(comparison.savings)}</span>
          </div>
        </div>

        {/* What people don't think about */}
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">&#128337;</div>
            <h4>Admin Time</h4>
            <p>
              DIY programs eat <strong>{d.diyAdminHoursWeek} hrs/week</strong> of admin time — ordering, tracking,
              follow-ups. A managed program cuts that to <strong>{d.managedAdminHoursWeek} hrs/week</strong>.
            </p>
            <p className="insight-save">Saves {currency(comparison.diyAdminCost - comparison.managedAdminCost)}/year</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">&#128260;</div>
            <h4>Remakes &amp; Rework</h4>
            <p>
              With DIY, <strong>{pct(d.diyRemakeRate)}</strong> of orders get remade. Managed programs
              drop that to <strong>{pct(d.managedRemakeRate)}</strong> through better fitting and QC.
            </p>
            <p className="insight-save">Saves {currency(comparison.diyRemakeCost - comparison.managedRemakeCost)}/year</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">&#128200;</div>
            <h4>Worker Compliance</h4>
            <p>
              DIY programs see only <strong>{pct(d.diyParticipation)}</strong> participation
              and <strong>{pct(d.diyCompliance)}</strong> consistent wear. Managed programs
              hit <strong>{pct(d.managedParticipation)}</strong> and <strong>{pct(d.managedCompliance)}</strong>.
            </p>
            <p className="insight-save">Fewer injuries = {currency(comparison.diyInjuryCost - comparison.managedInjuryCost)} less risk/year</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">&#9202;</div>
            <h4>Productivity Loss</h4>
            <p>
              Workers in DIY programs lose <strong>{d.diyLostHoursWeek} hrs/week</strong> dealing with
              eyewear issues. Managed programs bring that to <strong>{d.managedLostHoursWeek} hrs/week</strong>.
            </p>
            <p className="insight-save">Saves {currency(comparison.diyProductivityCost - comparison.managedProductivityCost)}/year</p>
          </div>
        </div>

        {/* Visual comparison */}
        <div className="chart-section">
          <h3>Cost Breakdown — Visual Comparison</h3>
          <div className="chart-grid">
            <StackedBar title="Self-Managed (DIY)" total={comparison.diyTotal} segments={diySegments} />
            <StackedBar title="Managed Program" total={comparison.managedTotal} segments={managedSegments} />
          </div>
          <div className="legend">
            <span><i className="program" />Eyewear</span>
            <span><i className="admin" />Admin</span>
            <span><i className="productivity" />Productivity</span>
            <span><i className="remake" />Remakes</span>
            <span><i className="injury" />Injuries</span>
          </div>
        </div>
      </section>

      {/* ── BOTTOM LINE ── */}
      <section className="card bottom-line-card">
        <h2>Your Bottom Line</h2>
        <div className="bottom-line-grid">
          <div className="bl-item">
            <h3>Doing Nothing Costs</h3>
            <p className="negative">{currency(noProgramCosts.totalExposure)}</p>
            <small>per year in injury, penalty, and lost productivity exposure</small>
          </div>
          <div className="bl-item">
            <h3>DIY Program Costs</h3>
            <p>{currency(comparison.diyTotal)}</p>
            <small>per year including all hidden costs</small>
          </div>
          <div className="bl-item">
            <h3>Managed Program Costs</h3>
            <p className="managed-num">{currency(comparison.managedTotal)}</p>
            <small>per year — fully handled for you</small>
          </div>
          <div className="bl-item emphasis">
            <h3>Annual Savings with Managed</h3>
            <p className="positive">{currency(comparison.savings)}</p>
            <small>saved per year vs. running it yourself</small>
          </div>
        </div>
      </section>

      {/* ── DISCLOSURE ── */}
      <section className="card disclosure">
        <h2>How We Calculate This</h2>
        <p>
          All figures use published industry averages for {industry.toLowerCase()} workplaces including
          BLS injury rates, OSHA penalty data, and typical program performance benchmarks. The only input
          from you is your workforce size — everything else reflects standard conditions. Actual costs may
          vary based on your specific workplace environment, location, and existing safety measures.
        </p>
      </section>
    </main>
  );
}
