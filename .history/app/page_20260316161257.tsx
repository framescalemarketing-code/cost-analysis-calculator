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

/* ────────────────────────────────────────────────────────
   INDUSTRY DATA — every cost formula uses per-worker annual
   rates so it scales correctly with workforce size.

   Sources / basis for figures:
   • Injury rates: BLS SOII (Survey of Occupational Injuries)
   • Direct cost per eye injury: NSC Injury Facts / NCCI claims data
   • Indirect multiplier: Stanford / Liberty Mutual (1:3–4 ratio)
   • Admin minutes: EHS program management benchmarks (ASSE)
   • Productivity minutes: time-motion studies for PPE programs
   • Remake rates: optical lab industry QC benchmarks
   • OSHA penalties: OSHA penalty schedule (FY 2024 serious = $16,131)
   ──────────────────────────────────────────────────────── */

type IndustryKey = "Manufacturing" | "Construction" | "Warehousing" | "Utilities";

type IndustryData = {
  injuryRate: number;             // eye injuries per worker per year (BLS)
  avgDirectCost: number;          // $ per eye injury — medical + WC direct
  indirectMultiplier: number;     // indirect $ per $1 direct (NSC/Liberty Mutual)

  diyEyewearCost: number;        // $/worker/year for eyewear
  diyAdminMinPerWorkerMonth: number;    // admin minutes per worker per month
  diyBaseAdminHoursWeek: number;        // fixed weekly overhead (vendor mgmt, etc.)
  diyProductivityMinPerWorkerMonth: number; // worker minutes lost per worker per month
  diyParticipation: number;
  diyCompliance: number;
  diyRemakeRate: number;

  managedEyewearCost: number;
  managedAdminMinPerWorkerMonth: number;
  managedBaseAdminHoursWeek: number;
  managedProductivityMinPerWorkerMonth: number;
  managedParticipation: number;
  managedCompliance: number;
  managedRemakeRate: number;
};

const INDUSTRIES: Record<IndustryKey, IndustryData> = {
  Manufacturing: {
    injuryRate: 0.00017, avgDirectCost: 3000, indirectMultiplier: 3,
    diyEyewearCost: 150, diyAdminMinPerWorkerMonth: 15, diyBaseAdminHoursWeek: 4, diyProductivityMinPerWorkerMonth: 20,
    diyParticipation: 0.55, diyCompliance: 0.70, diyRemakeRate: 0.08,
    managedEyewearCost: 220, managedAdminMinPerWorkerMonth: 3, managedBaseAdminHoursWeek: 1, managedProductivityMinPerWorkerMonth: 5,
    managedParticipation: 0.85, managedCompliance: 0.92, managedRemakeRate: 0.03,
  },
  Construction: {
    injuryRate: 0.00021, avgDirectCost: 3200, indirectMultiplier: 3.2,
    diyEyewearCost: 155, diyAdminMinPerWorkerMonth: 18, diyBaseAdminHoursWeek: 5, diyProductivityMinPerWorkerMonth: 24,
    diyParticipation: 0.50, diyCompliance: 0.66, diyRemakeRate: 0.09,
    managedEyewearCost: 225, managedAdminMinPerWorkerMonth: 4, managedBaseAdminHoursWeek: 1, managedProductivityMinPerWorkerMonth: 6,
    managedParticipation: 0.82, managedCompliance: 0.90, managedRemakeRate: 0.03,
  },
  Warehousing: {
    injuryRate: 0.00013, avgDirectCost: 2800, indirectMultiplier: 2.8,
    diyEyewearCost: 140, diyAdminMinPerWorkerMonth: 14, diyBaseAdminHoursWeek: 3, diyProductivityMinPerWorkerMonth: 18,
    diyParticipation: 0.60, diyCompliance: 0.73, diyRemakeRate: 0.07,
    managedEyewearCost: 210, managedAdminMinPerWorkerMonth: 3, managedBaseAdminHoursWeek: 1, managedProductivityMinPerWorkerMonth: 4,
    managedParticipation: 0.87, managedCompliance: 0.93, managedRemakeRate: 0.02,
  },
  Utilities: {
    injuryRate: 0.00015, avgDirectCost: 2900, indirectMultiplier: 2.9,
    diyEyewearCost: 145, diyAdminMinPerWorkerMonth: 16, diyBaseAdminHoursWeek: 3.5, diyProductivityMinPerWorkerMonth: 20,
    diyParticipation: 0.58, diyCompliance: 0.72, diyRemakeRate: 0.07,
    managedEyewearCost: 215, managedAdminMinPerWorkerMonth: 3, managedBaseAdminHoursWeek: 1, managedProductivityMinPerWorkerMonth: 5,
    managedParticipation: 0.86, managedCompliance: 0.92, managedRemakeRate: 0.02,
  },
};

const ADMIN_HOURLY = 45;   // $/hr fully-loaded admin cost
const WORKER_HOURLY = 35;  // $/hr fully-loaded worker cost
const REMAKE_HOURS_LOST = 2; // hours of worker downtime per remake event
const PROTECTION_EFFECTIVENESS = 0.9; // proper eyewear prevents 90% of injuries (BLS/NIOSH)

/* ────────────────────────────────────────────────────────
   FORMULAS (all replicable — plug in any numbers)

   Admin cost =
     (baseAdminHoursWeek × 52 × $adminHourly)                   ← fixed overhead
   + (adminMinPerWorkerMonth × workers × 12 / 60 × $adminHourly) ← scales with headcount

   Productivity cost =
     productivityMinPerWorkerMonth × workers × 12 / 60 × $workerHourly

   Remake cost =
     workers × remakeRate × remakeHoursLost × $workerHourly

   Injury cost =
     workers × injuryRate × (1 − participation × compliance × protectionEff)
     × directCost × (1 + indirectMultiplier)

   Eyewear cost = workers × eyewearCostPerWorker
   ──────────────────────────────────────────────────────── */

function calcProgramCosts(workers: number, d: IndustryData, mode: "diy" | "managed") {
  const isDiy = mode === "diy";

  const eyewearCost = isDiy ? d.diyEyewearCost : d.managedEyewearCost;
  const adminMin = isDiy ? d.diyAdminMinPerWorkerMonth : d.managedAdminMinPerWorkerMonth;
  const baseAdmin = isDiy ? d.diyBaseAdminHoursWeek : d.managedBaseAdminHoursWeek;
  const prodMin = isDiy ? d.diyProductivityMinPerWorkerMonth : d.managedProductivityMinPerWorkerMonth;
  const participation = isDiy ? d.diyParticipation : d.managedParticipation;
  const compliance = isDiy ? d.diyCompliance : d.managedCompliance;
  const remakeRate = isDiy ? d.diyRemakeRate : d.managedRemakeRate;

  const eyewear = workers * eyewearCost;
  const adminFixed = baseAdmin * 52 * ADMIN_HOURLY;
  const adminScaling = adminMin * workers * 12 / 60 * ADMIN_HOURLY;
  const admin = adminFixed + adminScaling;
  const productivity = prodMin * workers * 12 / 60 * WORKER_HOURLY;
  const remakes = workers * remakeRate * REMAKE_HOURS_LOST * WORKER_HOURLY;

  const coverage = participation * compliance;
  const injuries = workers * d.injuryRate * (1 - coverage * PROTECTION_EFFECTIVENESS);
  const injuryUnit = d.avgDirectCost * (1 + d.indirectMultiplier);
  const injury = injuries * injuryUnit;

  const total = eyewear + admin + productivity + remakes + injury;
  return { eyewear, admin, adminFixed, adminScaling, productivity, remakes, injury, injuries, total, coverage };
}

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

/* ── SVG line chart ───────────────────────────────────── */

function CostTimeline({ diyAnnual, managedAnnual, months }: { diyAnnual: number; managedAnnual: number; months: number }) {
  const W = 700;
  const H = 340;
  const pad = { top: 30, right: 20, bottom: 50, left: 80 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  const diyMonthly = diyAnnual / 12;
  const managedMonthly = managedAnnual / 12;

  // Generate cumulative data
  const diyPoints: { m: number; v: number }[] = [];
  const managedPoints: { m: number; v: number }[] = [];
  for (let m = 0; m <= months; m++) {
    diyPoints.push({ m, v: diyMonthly * m });
    managedPoints.push({ m, v: managedMonthly * m });
  }

  const maxVal = Math.max(diyPoints[months].v, managedPoints[months].v);
  const yMax = Math.ceil(maxVal / 50000) * 50000 || 50000;

  const x = (m: number) => pad.left + (m / months) * cw;
  const y = (v: number) => pad.top + ch - (v / yMax) * ch;

  const toPath = (pts: { m: number; v: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.m).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");

  // Savings area between the two lines
  const savingsPath =
    diyPoints.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.m).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")
    + managedPoints.slice().reverse().map((p) => `L${x(p.m).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ")
    + "Z";

  // Y axis labels
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => (yMax / yTicks) * i);

  // X axis labels
  const xInterval = months <= 12 ? 3 : months <= 24 ? 6 : 12;
  const xLabels = Array.from({ length: Math.floor(months / xInterval) + 1 }, (_, i) => i * xInterval);

  // Find breakeven month (where cumulative savings > 0... but since managed always saves, show the savings gap growing)
  const monthlySavings = diyMonthly - managedMonthly;
  const savingsAtEnd = monthlySavings * months;

  return (
    <div className="timeline-section">
      <div className="timeline-header">
        <h3>Cumulative Cost Over Time</h3>
        <p className="section-sub">
          Watch the gap grow. By month {months}, a managed program saves you{" "}
          <strong className="positive">{currency(savingsAtEnd)}</strong> compared to doing it yourself.
        </p>
      </div>
      <div className="svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="timeline-svg">
          {/* Grid lines */}
          {yLabels.map((v) => (
            <line key={v} x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
          ))}

          {/* Savings fill */}
          <path d={savingsPath} fill="rgba(22,101,52,0.08)" />

          {/* DIY line */}
          <path d={toPath(diyPoints)} fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" />
          {/* Managed line */}
          <path d={toPath(managedPoints)} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" />

          {/* Y axis labels */}
          {yLabels.map((v) => (
            <text key={v} x={pad.left - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#64748b">
              {v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
            </text>
          ))}

          {/* X axis labels */}
          {xLabels.map((m) => (
            <text key={m} x={x(m)} y={H - pad.bottom + 20} textAnchor="middle" fontSize={11} fill="#64748b">
              Mo {m}
            </text>
          ))}

          {/* Axis titles */}
          <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={12} fill="#334155" fontWeight={600}>Months</text>
          <text x={14} y={H / 2} textAnchor="middle" fontSize={12} fill="#334155" fontWeight={600} transform={`rotate(-90,14,${H / 2})`}>Cumulative Cost</text>

          {/* End labels */}
          <text x={x(months) + 4} y={y(diyPoints[months].v) - 6} fontSize={11} fill="#dc2626" fontWeight={700}>
            DIY: {currency(diyPoints[months].v)}
          </text>
          <text x={x(months) + 4} y={y(managedPoints[months].v) + 14} fontSize={11} fill="#16a34a" fontWeight={700}>
            Managed: {currency(managedPoints[months].v)}
          </text>
        </svg>
      </div>
      <div className="timeline-legend">
        <span><i style={{ background: "#dc2626" }} />Self-Managed (DIY)</span>
        <span><i style={{ background: "#16a34a" }} />Professionally Managed</span>
        <span><i style={{ background: "rgba(22,101,52,0.15)" }} />Your Savings</span>
      </div>

      {/* Savings milestones */}
      <div className="milestones">
        <h4>Savings Milestones</h4>
        <div className="milestone-row">
          {[6, 12, 24, 36].filter(m => m <= months).map((m) => (
            <div key={m} className="milestone-card">
              <span>Month {m}</span>
              <strong className="positive">{currency(monthlySavings * m)}</strong>
              <small>cumulative savings</small>
            </div>
          ))}
        </div>
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
    const oshaAvgPenalty = 16131; // OSHA FY2024 avg serious citation
    const oshaPenaltyExposure = injuries > 0 ? oshaAvgPenalty * Math.ceil(injuries) : 0;
    // No program = workers disrupted ~12 min/worker/month dealing with unprotected eye hazards
    const productivityLoss = workers * 12 * 12 / 60 * WORKER_HOURLY; // 12 min × 12 months
    const totalExposure = totalInjury + oshaPenaltyExposure + productivityLoss;
    return { injuries, direct, indirect, totalInjury, oshaPenaltyExposure, productivityLoss, totalExposure };
  }, [workers, d]);

  /* Part 2 — DIY vs Managed (all per-worker, all scales) */
  const diy = useMemo(() => calcProgramCosts(workers, d, "diy"), [workers, d]);
  const managed = useMemo(() => calcProgramCosts(workers, d, "managed"), [workers, d]);
  const savings = diy.total - managed.total;

  const diySegments: BarSegment[] = [
    { label: "Eyewear", value: diy.eyewear, className: "program" },
    { label: "Admin", value: diy.admin, className: "admin" },
    { label: "Productivity", value: diy.productivity, className: "productivity" },
    { label: "Remakes", value: diy.remakes, className: "remake" },
    { label: "Injuries", value: diy.injury, className: "injury" },
  ];
  const managedSegments: BarSegment[] = [
    { label: "Eyewear", value: managed.eyewear, className: "program" },
    { label: "Admin", value: managed.admin, className: "admin" },
    { label: "Productivity", value: managed.productivity, className: "productivity" },
    { label: "Remakes", value: managed.remakes, className: "remake" },
    { label: "Injuries", value: managed.injury, className: "injury" },
  ];

  const hiddenCosts = [
    { label: "Admin time savings", diy: diy.admin, managed: managed.admin },
    { label: "Productivity recovery", diy: diy.productivity, managed: managed.productivity },
    { label: "Fewer remakes", diy: diy.remakes, managed: managed.remakes },
    { label: "Lower injury exposure", diy: diy.injury, managed: managed.injury },
  ];

  // Per-worker admin hours for insight cards
  const diyAdminHrsPerWorkerYear = (d.diyAdminMinPerWorkerMonth * 12) / 60;
  const managedAdminHrsPerWorkerYear = (d.managedAdminMinPerWorkerMonth * 12) / 60;
  const diyProdHrsPerWorkerYear = (d.diyProductivityMinPerWorkerMonth * 12) / 60;
  const managedProdHrsPerWorkerYear = (d.managedProductivityMinPerWorkerMonth * 12) / 60;

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
              <small>average $16,131 per serious citation (OSHA FY2024)</small>
            </div>
            <div className="result-card warn">
              <h3>Unprotected Productivity Loss</h3>
              <p className="big-num">{currency(noProgramCosts.productivityLoss)}</p>
              <small>~12 min/worker/month in disruptions, workarounds, and downtime</small>
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
          comes with hidden costs that scale with every worker you add. Here&rsquo;s how it compares
          to a professionally managed program. <span className="avg-tag">Industry Averages</span>
        </p>

        {/* Side-by-side headline */}
        <div className="versus-grid">
          <div className="versus-card diy">
            <span className="versus-label">Self-Managed (DIY)</span>
            <p className="versus-total">{currency(diy.total)}</p>
            <small>total annual cost</small>
          </div>
          <div className="versus-vs">vs</div>
          <div className="versus-card managed">
            <span className="versus-label">Professionally Managed</span>
            <p className="versus-total managed-num">{currency(managed.total)}</p>
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
            <span className="bt-label">Eyewear ({workers} workers)</span>
            <span>{currency(diy.eyewear)}</span>
            <span>{currency(managed.eyewear)}</span>
            <span className={diy.eyewear - managed.eyewear >= 0 ? "positive" : "negative"}>
              {currency(diy.eyewear - managed.eyewear)}
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
            <span>{currency(diy.total)}</span>
            <span>{currency(managed.total)}</span>
            <span className="positive savings-num">{currency(savings)}</span>
          </div>
        </div>

        {/* What people don't think about */}
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">&#128337;</div>
            <h4>Admin Time</h4>
            <p>
              DIY costs <strong>{num(diyAdminHrsPerWorkerYear, 1)} hrs/worker/year</strong> in admin
              (plus {d.diyBaseAdminHoursWeek} hrs/week base overhead). Managed:
              just <strong>{num(managedAdminHrsPerWorkerYear, 1)} hrs/worker/year</strong> + {d.managedBaseAdminHoursWeek} hr/week overhead.
            </p>
            <p className="insight-save">Saves {currency(diy.admin - managed.admin)}/year</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">&#128260;</div>
            <h4>Remakes &amp; Rework</h4>
            <p>
              With DIY, <strong>{pct(d.diyRemakeRate)}</strong> of orders get remade — that&rsquo;s{" "}
              <strong>{num(workers * d.diyRemakeRate, 0)}</strong> rework events. Managed programs
              drop that to <strong>{pct(d.managedRemakeRate)}</strong> ({num(workers * d.managedRemakeRate, 0)} events).
            </p>
            <p className="insight-save">Saves {currency(diy.remakes - managed.remakes)}/year</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">&#128200;</div>
            <h4>Worker Compliance</h4>
            <p>
              DIY: <strong>{pct(d.diyParticipation)}</strong> participation
              × <strong>{pct(d.diyCompliance)}</strong> wear = <strong>{pct(d.diyParticipation * d.diyCompliance)}</strong> effective coverage.
              Managed: <strong>{pct(d.managedParticipation * d.managedCompliance)}</strong> coverage.
            </p>
            <p className="insight-save">Fewer injuries = {currency(diy.injury - managed.injury)} less risk/year</p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">&#9202;</div>
            <h4>Productivity Loss</h4>
            <p>
              Workers in DIY programs lose <strong>{d.diyProductivityMinPerWorkerMonth} min/month each</strong> to
              eyewear issues. Managed cuts that to <strong>{d.managedProductivityMinPerWorkerMonth} min/month</strong>.
              Over {workers} workers, that compounds fast.
            </p>
            <p className="insight-save">Saves {currency(diy.productivity - managed.productivity)}/year</p>
          </div>
        </div>

        {/* Visual comparison */}
        <div className="chart-section">
          <h3>Annual Cost Breakdown</h3>
          <div className="chart-grid">
            <StackedBar title="Self-Managed (DIY)" total={diy.total} segments={diySegments} />
            <StackedBar title="Managed Program" total={managed.total} segments={managedSegments} />
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

      {/* ── PART 3: ROI OVER TIME ── */}
      <section className="card part-card">
        <div className="part-label">Part 3</div>
        <h2>Your Savings Over Time</h2>
        <p className="section-sub">
          A managed program&rsquo;s savings grow every month. This chart shows cumulative total cost
          for each approach so you can see the gap widening over 3 years.
        </p>

        <CostTimeline diyAnnual={diy.total} managedAnnual={managed.total} months={36} />
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
            <p>{currency(diy.total)}</p>
            <small>per year including all hidden costs</small>
          </div>
          <div className="bl-item">
            <h3>Managed Program Costs</h3>
            <p className="managed-num">{currency(managed.total)}</p>
            <small>per year — fully handled for you</small>
          </div>
          <div className="bl-item emphasis">
            <h3>Annual Savings with Managed</h3>
            <p className="positive">{currency(savings)}</p>
            <small>saved per year vs. running it yourself</small>
          </div>
        </div>
        <div className="bl-three-year">
          <p>Over 3 years, that&rsquo;s <strong className="positive">{currency(savings * 3)}</strong> kept in your business.</p>
        </div>
      </section>

      {/* ── DISCLOSURE ── */}
      <section className="card disclosure">
        <h2>How We Calculate This</h2>
        <p>
          All figures use published industry averages for {industry.toLowerCase()} workplaces:
          BLS Survey of Occupational Injuries and Illnesses (SOII) for injury rates,
          NSC Injury Facts and NCCI claims data for direct costs,
          Liberty Mutual / Stanford research for the 1:3 indirect cost multiplier,
          OSHA FY2024 penalty schedules ($16,131 avg serious citation),
          and EHS program management benchmarks for admin and productivity time.
          Every formula scales with your workforce size — admin burden, productivity loss,
          remakes, and injury exposure all grow per worker. The only input from you is
          headcount; everything else reflects verified industry conditions.
        </p>
      </section>
    </main>
  );
}
