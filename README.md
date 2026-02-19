# Maintenance Division Estimating Calculator

**Version 4.0** | February 2026

A browser-based estimating tool that converts project scope inputs into crew sizes and activity durations. Built for pavement maintenance estimating with field-calibrated production rates, three-tier scheduling, and deterministic job analysis.

---

## What It Does

You enter quantities, phases, and travel time. It returns crew sizes and durations across three production tiers (conservative, standard, aggressive). Cost summaries exist as sanity checks against 347-job historical benchmarks — the calculator focuses on crew sizing and duration, not final bid pricing.

**12 work types supported:** Crack Filling, Sealcoating, Striping, Asphalt Repairs, Mastic Crack Fill, Wheel Stops, Signs, Bollards, Rubber Speed Bumps, Speed Humps, Inlet Repair, Paint Removal.

---

## Quick Start

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox)
2. Enter a project name
3. Enable the work types you need and enter quantities
4. Results calculate live — crew sizes, durations, costs, and analysis update instantly
5. Export via Quick Export, Full Export, JSON, or Print

No server, no install, no dependencies beyond Google Fonts.

---

## v4.0 Features

### Core Engine
- **Three-Tier Output** — Conservative (80%), Standard (100%), Aggressive (120%) production tiers from the same crew. Gives you a range instead of false precision.
- **Shift Buffer Zone Optimizer** — Snaps raw hours to practical shift increments (4/6/8/10/12h). Detects hustle zones where a crew can push to finish rather than booking another increment.
- **Crew Clustering** — Activities sharing equipment (heavy, paint, sealcoat, crack fill, mastic) cluster together to share mobilization. Shift optimization runs per cluster with hours apportioned back to individual activities.

### Estimating Intelligence
- **Unit Cost Reasonableness Check** — Compares calculated $/unit against P25-P75 ranges from 347 completed jobs. Flags items as IN RANGE, HIGH, LOW, VERY HIGH, or VERY LOW.
- **Job Analysis Engine** — Deterministic analysis tracing every flag to specific inputs: quantity vs. typical range, shift utilization, setup/breakdown overhead, phase count, travel ratio, and work-type-specific field logic from a 26-question field operations questionnaire.
- **Risk-Weighted Estimate Confidence** — Four sub-scores with explanatory drivers:
  - Production Reliability (35%) — weighted by activity cost share and rate variance bands
  - Benchmark Alignment (30%) — percentage of unit checks within historical range
  - Scope Definition (20%) — quantities within normal bands + critical inputs populated
  - Data Quality (15%) — sample size adequacy across active benchmarks
- **Scope Exclusions & Assumptions** — 12-item checklist (traffic control, permits, survey, disposal, etc.) with Included/Excluded/N/A status and notes. Exported with every estimate.

### Scheduling
- **Calendar Duration Estimate** — Working-day timeline with activity sequencing, cure windows between dependent activities (crack fill before sealcoat, sealcoat before striping, asphalt before striping), and weather contingency input.
- **Differentiated Wheel Stop Rates** — Install (80/day), Reset (155/day), Removal (220/day) per field-calibrated data instead of a single blended rate.

### Export & Output
- **Quick Export** — Clipboard summary with three-tier hours and cost totals
- **Full Export** — Comprehensive plain-text report: crew/duration first, then analysis, then costs (labeled as reference)
- **JSON Export** — Complete calculation snapshot for data analysis
- **Print/PDF** — Clean white-background document in a new window with all sections (crew summary, calendar, confidence scores with explanations, unit costs, analysis, scope assumptions). Triggers browser print dialog for PDF save.
- **Per-Activity Unit Costs** — Third column in Cost Summary showing $/unit with color-coded status badges

---

## Architecture

### Single-File Design
The entire application is one HTML file (~4,600 lines) with inline CSS and JavaScript. No build step, no framework, no server. Opens directly in any browser or hosts as a static page.

### Technology
- HTML5 / CSS3 with custom properties (dark theme)
- Vanilla JavaScript — all calculation, DOM manipulation, and export logic
- Google Fonts (JetBrains Mono for data, IBM Plex Sans for UI)
- LocalStorage for persisting rate configurations between sessions

### Data Flow
```
Scope Inputs (quantities, phases, travel)
    |
Rate Configuration (crew rates, materials, production rates, crew sizes, waste factors)
    |
calculateAll()
    |-- Per-activity calculation (12 work types)
    |   |-- Raw production hours
    |   |-- Phase adjustment + three-tier scaling
    |   |-- Shift optimization (snap to increments, hustle detection)
    |   |-- Cost calculation (labor + materials + waste)
    |   +-- Snapshot capture
    |
    |-- Crew Clustering (shared mobilization, per-cluster optimization)
    |-- Estimate Summary Table (crew, hours, days per tier)
    |-- Calendar Duration (sequencing + cure windows)
    |-- Estimate Confidence (4 sub-scores + explanations)
    |-- Unit Cost Check (vs. P25-P75 benchmarks)
    |-- Job Analysis Engine (deterministic flag reasoning)
    |-- Cost Summary (labor + material + unit costs + markup)
    +-- Scope Assumptions
            |
    window.lastCalcSnapshot
            |
    Exports (Quick / Full / JSON / Print)
```

---

## Rate Configuration

All rates are user-editable with field-calibrated defaults:

| Category | Count | Examples |
|----------|-------|---------|
| Crew Hourly Rates | 14 | $133.40/hr (wheel stop reset) to $336.48/hr (asphalt repair >4T) |
| Material Unit Costs | 22 | Per-unit discrete items + per-LF/SF continuous materials |
| Production Rates | 23 | Crack fill 4,000 LF/day, sealcoat 52,000 SF/day, striping 5,000 LF/day |
| Default Crew Sizes | 12 | Crack fill 3, sealcoat 4, asphalt repair 4, mastic 5 |
| Material Waste Factors | 6 | Crack fill 10%, sealcoat 5%, asphalt/DGA 7% |

Rates persist in browser LocalStorage. Save/Load/Reset controls in the Rate Configuration panel.

---

## Key Design Decisions

**Three tiers, not one number.** A single duration implies false precision. Three tiers reflect real variability in crew capability, site complexity, and conditions. The estimator picks the tier that matches their read of the job.

**Shift snapping, not raw hours.** You send a crew for a half day or a full day, not 5.3 hours. The optimizer reflects how work is actually scheduled and billed.

**Deterministic analysis, not ML.** Every observation traces to specific inputs and explicit rules from field experience. Same inputs always produce the same analysis. Auditable and predictable.

**Costs are secondary.** The calculator's primary output is crew sizes and durations. Cost summaries exist to sanity-check whether the sizing seems reasonable, not to produce bid pricing. Exports label them accordingly.

**Confidence with explanations.** Bare confidence scores are useless without knowing why. Each component shows its definition and lists every driver sorted by cost impact with severity tags.

---

## Source Data

| Source | Role |
|--------|------|
| Darrell's Production Rates | Baseline crew rates, material costs, daily production rates (all Rate Config defaults) |
| 347-Job Historical Dataset (Dec 2024 - Dec 2025) | P25/median/P75 unit cost benchmarks, typical quantity ranges, sample sizes per activity |
| Field Operations Questionnaire (Feb 2026) | 26 questions on crew sizing, site conditions, phasing, judgment calls, work-type specifics. Integrated as deterministic rules in the analysis engine. |
| MnDOT Asphalt Pavement Maintenance Field Handbook | Specifications for sealcoat windows, HMA temperatures, crack sealing sequencing |

---

## Version History

| Version | Changes |
|---------|---------|
| **4.0** | Differentiated wheel stop production rates (install/reset/removal). Scope Exclusions & Assumptions checklist. Risk-Weighted Estimate Confidence with explanatory drivers. Per-activity unit cost column with status badges. Calendar Duration Estimate with cure windows and weather contingency. Print/PDF export. BENCHMARKS sample sizes. RATE_CONFIDENCE at module scope. |
| 3.5 | Sealcoat rate recalibrated to 52,000 SF/day. Crew clustering engine (heavy, paint, sealcoat, crack fill, mastic). Per-cluster shift optimization. Cluster deployment summary. |
| 3.4 | Field Operations Questionnaire integration (26 questions). Production rate confidence bands. Setup/breakdown detection. Crew-sizing thresholds. Cure window sequencing. Tack-on activity detection. |
| 3.3 | Job Analysis Engine. Full Export and JSON Export. Snapshot architecture. |
| 3.2 | Asphalt price warnings. Shift duration clamping. Unit Cost Reasonableness Check (347-job benchmarks). |
| 3.1 | Base calculator: 12 work types, three-tier output, shift optimizer, cost summary, quick export. |

---

## Standards Alignment

The calculator's methodology aligns with practices described in:
- **AACE RP 17R-97** — Cost Estimate Classification System
- **AACE RP 18R-97** — Cost Estimate Classification as Applied to Engineering, Procurement, and Construction
- **AACE RP 42R-08** — Risk Analysis and Contingency Determination
- **AACE RP 34R-05** — Basis of Estimate
- **AACE RP 40R-08** — Estimate Accuracy
- **ASPE Standard Estimating Practice** — Scope definition, exclusions/assumptions documentation

---

*Maintenance Division Estimating Calculator v4.0 — Internal estimating tool. Not client-facing.*
