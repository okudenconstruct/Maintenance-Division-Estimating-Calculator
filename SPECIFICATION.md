# Maintenance Division Estimating Calculator — Technical Specification

**Version:** 4.0
**Author:** Steve Rutledge
**Date:** February 2026
**Status:** Active — internal estimating tool

---

## 1. Purpose

The Maintenance Division Estimating Calculator is an internal tool that converts project scope inputs (quantities, phases, travel time) into crew sizes and activity durations. It does not produce final bid pricing. Cost summaries exist as sanity checks against 347-job historical benchmarks — the calculator focuses on crew sizing and duration, which are the two numbers hardest to get right from a rate table alone.

The tool serves the Maintenance Division estimating workflow and exists to make the translation from scope description to line-item entry faster, more consistent, and auditable. It is not referenced externally, not client-facing, and not presented as a formal application. It is a working calculator that runs in a browser.

---

## 2. How It Was Developed

### 2.1 Foundation: Darrell's Production Rates

All production rates in the calculator originate from Darrell Bishop's field-calibrated rates. These are standalone rates: one crew, one activity, full day. They represent what a standard crew produces under normal conditions on a single-scope job. The rates were developed over years of field observation and are the division's accepted baseline for estimating.

The calculator takes these rates as defaults but allows the user to override any rate for a specific job. This is important because Darrell's rates are standalone assumptions — real jobs with multiple activities, small quantities, complex lots, or weather constraints will deviate from them.

### 2.2 Historical Benchmarking Data

Unit cost benchmarks (P25, median, P75) are derived from 347 completed jobs spanning December 2024 through December 2025. These benchmarks represent all-in unit costs: labor, equipment, and material at the standard tier, before markup. They provide the reference ranges used by the Unit Cost Reasonableness Check, the Job Analysis Engine, and the Estimate Confidence scoring.

The benchmarks are stored as constants in the code (the `BENCHMARKS` object). Each entry includes sample size (`n`) for data quality scoring. The typical quantity ranges in the Historical Benchmarking Reference table also come from this dataset (the `QTY_RANGES` object) and inform the analysis engine's quantity-based reasoning.

### 2.3 Field Operations Questionnaire

In February 2026, a structured questionnaire was developed to capture construction logic and field physics that production rate tables alone cannot represent. The questionnaire covers 26 topics across six sections: crew sizing decisions, site conditions, phasing and scheduling, judgment calls, specific work types, and general field wisdom.

Working answers were developed using production rate data from historical jobs, the MnDOT Asphalt Pavement Maintenance Field Handbook, and construction logic informed by field experience. Each answer includes a confidence rating and a specific calculator implication.

Key insights from the questionnaire that are integrated into the analysis engine:

- **Setup/breakdown time is not captured in production rates** (Q15, Q26). Every job starts and ends with 1–2 hours of non-productive time. On small jobs, this can be 25% of the shift. This is the most common reason field actuals exceed rate-based estimates.
- **Crew sizing has quantity thresholds** (Q1, Q3). When quantity is under 50% of a crew's daily capacity, a smaller crew is often appropriate. For sealcoat, the 3-man vs. 4-man threshold is approximately 35,000 SF per phase.
- **Striping is a concurrent operation** (Q4). Machine work and hand work happen simultaneously. Total hours equals the maximum of machine hours and hand hours, not their sum.
- **Wheel stop operations have different production rates** (Q21). New installs run at 80/day, resets at approximately 155/day (2× faster), and removals at approximately 220/day (2.5–3× faster).
- **Crack fill quantities from scope descriptions are unreliable** (Q18, Q25). Field quantities routinely come in 30–60% higher than salesperson walkthrough estimates.
- **Asphalt patching has the widest estimate-to-actuals variance** (Q17). Every patch is different. Sub-base condition, water presence, and delamination extent are unknown until excavation.
- **20–30% of inlet repairs escalate to reconstruction** (Q22). Deterioration is invisible from the surface.
- **Production rate confidence varies by work type** (Q17). Striping machine rates are reliable within ±10%. Asphalt patching swings ±35%. Inlet work swings ±40%.
- **Multi-activity jobs differ from standalone benchmarks** (Q14). Small add-on activities (under 25% of a crew's daily capacity) are often tacked onto the primary crew's day rather than requiring separate mobilization.
- **Work sequencing has required cure windows** (Q12). Patch, then crack fill (24–48 hrs), then sealcoat (24–48 hrs), then stripe. Each layer depends on the one below being cured.

### 2.4 MnDOT Asphalt Pavement Maintenance Field Handbook

The MnDOT handbook provides specifications referenced in the questionnaire answers and used for validation of calculator assumptions. Relevant specifications include sealcoat application windows (May 15 through August 31, 60°+ F), HMA placement temperatures (minimum 275°F, compaction before 185°F), and the requirement that crack sealing precede surface treatments.

---

## 3. Architecture

### 3.1 Single-File Design

The entire application is a single HTML file (`index.html`) containing inline CSS and JavaScript. There are no external dependencies beyond Google Fonts (JetBrains Mono for monospace data, IBM Plex Sans for UI text). No build step, no framework, no server. The file can be opened directly in any modern browser or hosted as a static page.

### 3.2 Technology

- **HTML5** for structure
- **CSS3** with CSS custom properties (dark theme, responsive grid)
- **Vanilla JavaScript** for all calculation logic, DOM manipulation, and export functionality
- **LocalStorage** for persisting custom rate configurations and scope checklist state between sessions

### 3.3 File Size

Approximately 4,628 lines. The CSS portion is approximately 614 lines. The HTML structure is approximately 740 lines. The JavaScript portion is approximately 3,274 lines containing all calculation logic, the shift optimization engine, the clustering engine, the analysis engine, the confidence system, the calendar system, the scope checklist, four export functions, and save/load/reset.

### 3.4 External Dependencies

| Dependency | Purpose | Load Method |
|-----------|---------|-------------|
| Google Fonts: JetBrains Mono (400/500/600/700) | Monospace font for numerical data, rates, calculated values | `<link>` in `<head>` |
| Google Fonts: IBM Plex Sans (400/500/600/700) | UI text, labels, analysis narratives | `<link>` in `<head>` |

No other external dependencies. No JavaScript libraries. No CSS frameworks.

---

## 4. Visual Design

### 4.1 Color System

Dark theme using CSS custom properties defined on `:root`:

| Variable | Hex | Role |
|----------|-----|------|
| `--bg-primary` | `#0a0f1a` | Page background, output sections |
| `--bg-secondary` | `#111827` | Panel backgrounds, settings, cost summary |
| `--bg-tertiary` | `#1a2332` | Hover states, totals rows, composites |
| `--bg-input` | `#0d1320` | Input field backgrounds |
| `--border-color` | `#2a3548` | Standard borders |
| `--border-highlight` | `#3b4d6b` | Emphasized borders (totals, composites) |
| `--text-primary` | `#e8edf5` | Primary text |
| `--text-secondary` | `#9ca8bc` | Labels, secondary text |
| `--text-muted` | `#6b7a94` | Hints, footnotes, muted elements |
| `--accent-red` / `--accent-red-dim` | `#ef5350` / `#c62828` | Danger buttons, VERY HIGH/LOW flags |
| `--accent-yellow` / `--accent-yellow-dim` | `#fdd835` / `#f9a825` | Hand striping rows, hustle warnings |
| `--accent-purple` / `--accent-purple-dim` | `#ab47bc` / `#7b1fa2` | Cluster deployment section |
| `--accent-pink` / `--accent-pink-dim` | `#f06292` / `#c2185b` | Bollard / Paint Removal color tags |
| `--accent-blue` / `--accent-blue-dim` | `#42a5f5` / `#1565c0` | Primary buttons, machine striping rows, LOW flags |
| `--accent-green` / `--accent-green-dim` | `#66bb6a` / `#2e7d32` | Success buttons, IN RANGE flags, cost summary border |
| `--accent-orange` | `#ffa726` | Conservative tier, HIGH flags, analysis border, logo gradient |
| `--accent-cyan` | `#26c6da` | Standard tier, estimate summary border, confidence section |
| `--accent-teal` | `#26a69a` | Wheel stop / Inlet color tags |

### 4.2 Typography

| Context | Font | Weight | Size |
|---------|------|--------|------|
| Body text | IBM Plex Sans | 400 | Inherits |
| Labels (uppercase) | IBM Plex Sans | 600 | 0.70–0.78rem |
| Input fields | JetBrains Mono | 400 | 0.78–0.85rem |
| Calculated values | JetBrains Mono | 600 | 0.75–0.78rem |
| Panel headers | IBM Plex Sans | 600 | 0.85rem |
| Section headings (H2) | IBM Plex Sans | 700 | 1.1rem |
| Logo title (H1) | IBM Plex Sans | 700 | 1.2rem |
| Tooltips | IBM Plex Sans | 400 | 0.7rem |
| Badges | IBM Plex Sans | 700 | 0.62–0.65rem |

### 4.3 Layout

- Container: `max-width: 1400px`, centered, `1.5rem` padding
- Grid systems:
  - `.wt-grid`: `repeat(auto-fit, minmax(200px, 1fr))` — work type input fields
  - `.wt-grid-wide`: `repeat(auto-fit, minmax(280px, 1fr))` — wider input layouts
  - `.rate-grid`: `repeat(auto-fit, minmax(280px, 1fr))` — rate configuration sections
  - `.cost-grid`: `repeat(auto-fit, minmax(300px, 1fr))` — cost summary columns
- Responsive: At `max-width: 768px`, all grids collapse to single column, settings row goes vertical, header stacks vertically

---

## 5. HTML Structure

### 5.1 Header

Logo with gradient icon ("M"), title "Maintenance Division Estimating Calculator", version subtitle. Six action buttons:

| Button | CSS Class | Action |
|--------|-----------|--------|
| ⚡ Calculate | `btn-primary` | `calculateAll()` |
| 📋 Quick Export | `btn-secondary` | `exportResults()` |
| 📄 Full Export | `btn-secondary` | `exportComprehensiveText()` |
| 💾 JSON | `btn-secondary` | `exportJSON()` |
| 🖨️ Print | `btn-secondary` | `printEstimate()` |
| ↺ Reset | `btn-danger` | `resetForm()` |

### 5.2 Project Info

Single text input (`id="projectName"`) for project name. Exported in all formats.

### 5.3 Global Settings Panel

Seven settings controlling calculation parameters:

| Setting | ID | Type | Default | Purpose |
|---------|-----|------|---------|---------|
| Standard Shift | `hoursPerDay` | Select (6/8/10) | 8 | Base shift length for production hours and shift snapping |
| Max Shift | `maxShift` | Select (8/10/12) | 10 | Upper bound for single-day scheduling |
| 9.5mm Asphalt ($/ton) | `asphaltPrice` | Number | (empty) | Material pricing for surface-course asphalt |
| 19mm Base Asphalt ($/ton) | `baseAsphaltPrice` | Number | (empty) | Material pricing for base-course asphalt |
| DGA ($/ton) | `dgaPrice` | Number | (empty) | Material pricing for sub-base aggregate |
| Markup % | `markupPercent` | Number | 60 | Applied to direct cost for bid price estimate |
| Crew Clustering | `clusterMode` | Select (Off/On) | On | Groups co-deployed activities sharing equipment |

All settings trigger `calculateAll()` on change. Markup syncs between the global settings and the cost summary section via `syncMarkup()`.

### 5.4 Rate Configuration Panel

Collapsible panel (`togglePanel()`) containing five rate sections in a CSS grid. All rates persist via `saveRates()` / `loadRates()` to localStorage under key `'maintCalcRates'`.

**5.4.1 Crew Hourly Rates (Equipment + Labor) — 14 inputs**

| ID | Label | Default | Notes |
|----|-------|---------|-------|
| `rateCrackFill` | Crack Fill Crew | $219.34/hr | |
| `rateSealcoat` | Sealcoat Crew | $245.79/hr | |
| `rateStriping` | Striping Crew | $245.75/hr | |
| `rateAsphaltSmall` | Asphalt Repair (≤4T) | $351.35/hr | Hot box crew |
| `rateAsphaltLarge` | Asphalt Repair (>4T) | $555.10/hr | Triaxle crew (includes truck rental) |
| `rateWsInstall` | Wheel Stop Install | $261.99/hr | |
| `rateWsReset` | Wheel Stop Reset | $133.40/hr | |
| `rateWsRemove` | Wheel Stop Removal | $179.94/hr | |
| `rateSpeedBump` | Rubber Speed Bump | $269.27/hr | |
| `rateBollard` | Bollard Crew | $360.73/hr | |
| `rateSign` | Sign Crew | $360.73/hr | Same as bollard |
| `rateMastic` | Mastic Crew (excl machine) | $310.02/hr | Machine rental costed separately |
| `rateInlet` | Inlet Crew | $297.07/hr | |
| `rateSpeedHump` | Speed Hump Crew | $514.02/hr | |

**5.4.2 Material Unit Costs — 22 inputs**

| ID | Label | Default | Unit |
|----|-------|---------|------|
| `matCrackFill` | Crack Fill | $0.19 | /LF |
| `matSealcoat` | Sealer | $0.07 | /SF |
| `mat4Line` | 4" Paint Lines | $0.10 | /LF |
| `mat6Line` | 6" Paint Lines | $0.15 | /LF |
| `mat12Line` | 12" Paint Lines | $0.30 | /LF |
| `mat24Line` | 24" Paint Lines | $0.60 | /LF |
| `matArrow` | Arrows | $8.50 | /EA |
| `matHC` | HC Symbol w/ Hash | $12.50 | /EA |
| `matStencil` | Stencils/Lettering | $4.25 | /EA |
| `matCurb` | Curb Paint | $0.30 | /LF |
| `matWsNew` | Wheel Stop w/ Pins | $55.00 | /UN |
| `matWsPin` | WS Reset Pins | $4.00 | /UN |
| `matWsDispose` | WS Disposal | $16.67 | /UN |
| `matSpeedBump` | Rubber Speed Bump | $560.00 | /UN |
| `matBollard` | Bollard | $260.00 | /UN |
| `matSignSmall` | Small Sign | $110.00 | /UN |
| `matSignLarge` | Large Sign | $170.00 | /UN |
| `matMasticBox` | Mastic Box 30lb | $31.99 | /box |
| `matMasticMachine` | Mastic Machine Rental | $586.44 | /DAY |
| `matBlock` | Block & Mortar | $150.00 | /UN |
| `matCasting` | Casting | $300.00 | /EA |
| `matPaintRemoval` | Grinder Rental | $650.00 | /DAY |

**5.4.3 Production Rates — 23 inputs**

| ID | Label | Default | Unit |
|----|-------|---------|------|
| `prodCrackFill` | Crack Fill | 4,000 | LF/day |
| `prodSealcoat` | Sealcoat | 52,000 | SF/day |
| `prod4Line` | 4" Lines | 5,000 | LF/day |
| `prod6Line` | 6" Lines | 5,000 | LF/day |
| `prod12Line` | 12" Lines | 5,000 | LF/day |
| `prod24Bar` | 24" Lines | 3,000 | LF/day |
| `prodHC` | HC Symbols | 80 | EA/day |
| `prodArrow` | Arrows | 50 | EA/day |
| `prodStencil` | Stencils/Lettering | 200 | EA/day |
| `prodCurb` | Curbing | 5,000 | LF/day |
| `prodAsphaltRepair` | Asphalt Repair | 600 | SF/day |
| `prodWsInstall` | WS Install | 80 | UN/day |
| `prodWsReset` | WS Reset | 155 | UN/day |
| `prodWsRemoval` | WS Removal | 220 | UN/day |
| `prodSpeedBump` | Rubber Speed Bumps | 16 | UN/day |
| `prodBollard` | Bollards | 8 | UN/day |
| `prodSignPost` | Signs - Post | 32 | UN/day |
| `prodSignBollard` | Signs - Bollard | 8 | UN/day |
| `prodMastic` | Mastic | 1,000 | LF/day |
| `prodInletRepair` | Inlet Repair | 6 | UN/day |
| `prodInletRecon` | Inlet Reconstruct | 8 | hrs/unit |
| `prodSpeedHump` | Speed Humps | 4 | **standard** UN/day (2.13-ton humps) |
| `shSetupFrac` | Speed Hump Setup Frac (α) | 0.4 | fraction of hump labor that is fixed setup |
| `prodPaintRemoval` | Paint Removal | 2,000 | LF/day |

Note: Inlet repair uses units/day while inlet reconstruction uses hours/unit — these are different rate formats reflecting how the rates were originally described in field data. They are calculated differently in the code.

### 5.4.x Labor & Wage Mode (resource-based)

The app mirrors the bid system resource costing. Fully-loaded straight-time cost per manhour:

```
loaded/MH = base x (1 + tax%) x (1 + WC%) + fringe
```

| Input | Description | Standard default |
|---|---|---|
| `pwMode` | Prevailing Wage toggle (global) | off |
| `wageForemanBase` / `wageForemanFringe` | Foreman base / fringe $/MH | 52.50 / 10.50 |
| `wageLaborerBase` / `wageLaborerFringe` | Laborer base / fringe $/MH | 37.50 / 5.50 |
| `wageTaxPct` | Payroll tax % | 16.5 |
| `wageWcPct` | Workers comp % (NJ5500), applied on top of tax | 6.93 |
| `salesTaxPct` | NJ sales tax on all material | 6.625 |
| `rateLaborerAdj` | **Derived, read-only** — loaded laborer $/MH at the active mode | 52.22 |

PW wage table (from the wage sheet, not user-editable): Foreman base 89.71 / fringe 0 / tax 18.5%; Laborer base 52.25 / fringe 47.318 / tax 18.5%.

**Loaded $/MH:** Standard - Foreman $75.90, Laborer $52.22. PW - Foreman $113.67, Laborer $113.53.

**WC derivation:** 6.93% is the loading that reconciles the bid system actual burden on BOTH a standard job (16.5% tax to 24.59% effective) and a PW job (18.5% to 26.70%). Both independently yield ~6.93%.

**Crew composition rule:** every crew is **1 Foreman + (N-1) General Laborers** - verified across 6 the bid system jobs (patch, crack fill, sealcoat, striping, sign) in both standard and PW.

**Crew rate formula:**
```
rate = baseRate + crewLabor(currentCrew, mode) - crewLabor(baseCrew, standard)
```
The configured base rate is the **work-hours-only** standard-wage rate (crew labor + equipment, no travel). At base size in standard mode it returns baseRate unchanged; growing the crew adds a loaded laborer; PW adds the wage differential for every person. Equipment is unaffected by either.

**Travel (mirrors the bid system):** travel is booked as extra manhours paid at **1.5x** base, and **equipment is NOT charged during travel**:
```
travelCost = travelHrsPerDay x crewTravelPerHr(crewSize, mode) x days
```
A 1 hr/shift round trip yields MH x 1.125 and the bid system's 105.56% Tax/OT factor: `(8 + 1x1.5) / 9 = 1.0556`. Verified against a 0.25 hr case too, which the bid system shows as 102.94%.

**Mastic crew:** mirrors the crack fill crew (1F+2L) but runs a **rental mastic machine instead of the crack melter**, so its equipment is surface blower + crew truck ($32/hr). The machine is billed separately as `matMasticMachine` x days, and boxes as material - unchanged from the existing model.

**Material sales tax:** all material is billed `qty x unit cost x (1 + salesTaxPct)`. the bid system bills takeoff quantity with no waste, so the crack fill / sealcoat / striping / mastic waste factors default to **0**. Asphalt (7%) and speed-hump (5%) waste factors remain - those are tonnage-conversion allowances, and the bid system's entered tonnages match them.

**Validation vs the bid system actuals:**

| Job | the bid system | App | Delta |
|---|---|---|---|
| McLean patch 360 SF @2" | 2,516.00 | 2,515.86 | -0.01% |
| Needleman crack fill 5,000 LF | 3,581.53 | 3,580.32 | -0.03% |
| Winzinger **PW** sign crew (labor+equip) | 1,716.39 | 1,716.46 | +0.004% |

**5.4.4 Default Crew Sizes — 12 inputs**

| ID | Label | Default | Range |
|----|-------|---------|-------|
| `crewCrackFill` | Crack Fill | 3 | 2–5 |
| `crewSealcoat` | Sealcoat | 3 | 2–5 |
| `crewStriping` | Striping | 4 | 2–5 |
| `crewAsphaltSmall` | Asphalt Repair (≤4T) | 4 | 2–5 |
| `crewAsphaltLarge` | Asphalt Repair (>4T) | 4 | 2–5 |
| `crewWsInstall` | Wheel Stop Install | 3 | 2–5 |
| `crewSpeedBump` | Rubber Speed Bump | 3 | 2–5 |
| `crewBollard` | Bollard | 4 | 2–5 |
| `crewSign` | Sign | 4 | 2–5 |
| `crewMastic` | Mastic | 4 | 2–6 |
| `crewInlet` | Inlet | 4 | 2–5 |
| `crewSpeedHump` | Speed Hump | 4 | 2–5 |

**5.4.5 Material Waste Factors — 6 inputs**

| ID | Label | Default | Applied To |
|----|-------|---------|-----------|
| `wasteCrackFill` | Crack Fill | 10% | Crack fill material quantity |
| `wasteSealcoat` | Sealcoat | 5% | Sealer quantity |
| `wasteStriping` | Striping Paint | 5% | All striping material quantities |
| `wasteAsphalt` | Asphalt / DGA | 7% | Asphalt and DGA tonnage |
| `wasteMastic` | Mastic | 10% | Mastic box count |
| `wasteSpeedHump` | Speed Hump Asphalt | 5% | Speed hump asphalt tonnage |

Waste factors apply to continuous materials only. Discrete items (wheel stops, signs, bollards, speed bumps, castings, blocks) do not have waste factors.

### 5.5 Work Type Input Panels

Twelve collapsible work type panels. Each uses `toggleWorkType()` for expand/collapse and has an enable/disable checkbox. All quantity/phase/travel inputs trigger `calculateAll()` via `oninput`. Each panel contains:

- Input fields for quantities, phases, travel
- An output section rendered by `renderTierTable()`
- A reviewer notes textarea (`notes-box` class)
- A cluster badge showing which crew cluster the activity belongs to

**5.5.1 Crack Filling**
- Panel ID: `wt_crackfill` | Enable: `en_crackfill` | Cluster: Crack Fill (purple)
- Inputs: LF (`cf_lf`), Phases (`cf_phases`, default 1), Travel hrs (`cf_travel`, default 0)
- Output: `cf_output` | Notes: `note_cf`

**5.5.2 Sealcoating**
- Panel ID: `wt_sealcoat` | Enable: `en_sealcoat` | Cluster: Sealcoat (green)
- Inputs: SF (`sc_sf`), Phases (`sc_phases`, default 1), Travel hrs (`sc_travel`, default 0)
- Output: `sc_output` | Notes: `note_sc`
- Note: "4-man crew required for manual spray bar. Rate based on 50K SF/day 3-man baseline + 4th man support gain. Open lot: ~52K standard. Complex lot with islands/medians: ~42-45K. 2-coat application at 100 SF/gal, 125 gal/hr sustained."

**5.5.3 Striping**
- Panel ID: `wt_striping` | Enable: `en_striping` | Cluster: Paint (blue)
- Inputs: Phases (`st_phases`), Travel hrs (`st_travel`), plus 8 line-item quantities in a striping table:
  - Machine items (blue left-border): 4" Lines (`st_4line`), 6" Lines (`st_6line`), 12" Lines (`st_12line`), 24" Lines (`st_24bar`)
  - Hand items (yellow left-border): HC Symbols (`st_hc`), Arrows (`st_arrow`), Stencils/Lettering (`st_stencil`), Curbing (`st_curb`)
- Each line item shows: Qty input, Unit, Prod/Day (from rate config), calculated Hours, calculated Mat Cost
- Output displays: Machine Hours, Hand Hours, separator, then tier table
- Concurrency model: Duration = max(machine hours, hand hours)
- Notes: `note_st`

**5.5.4 Asphalt Repairs**
- Panel ID: `wt_asphalt` | Enable: `en_asphalt` | Cluster: Heavy (orange)
- Inputs: Total Repair Area SF (`ar_sf`), Depth Configuration select (`ar_depth`), Phases (`ar_phases`), Travel hrs (`ar_travel`)
- Depth options: `2s` (2" Surface Only), `2s4b` (2" Surface + 4" Base), `2s4d` (2" Surface + 4" DGA), `2s4b4d` (2" Surface + 4" Base + 4" DGA), `2s4b6d` (2" Surface + 4" Base + 6" DGA), `2s6d` (2" Surface + 6" DGA)
- Output displays: Surface tons, Base tons, DGA tons, Total Asphalt tons, Crew Type (Hot Box ≤4T / Triaxle >4T), then tier table
- Notes: `note_ar`

**5.5.5 Mastic Crack Filling**
- Panel ID: `wt_mastic` | Enable: `en_mastic` | Cluster: Mastic (red)
- Inputs: Total LF (`ma_lf`), Avg Crack Width inches (`ma_width`, default 1.0), Avg Crack Depth inches (`ma_depth`, default 0.5), Phases (`ma_phases`), Travel hrs (`ma_travel`)
- Note: "5-man crew: 2 dumping buckets, 2 on hot irons, 1 driving/traffic/logistics."
- Note: "Material: 30 lb box yields ~57.5 cu. in. of fill. Coverage per box = 57.5 / (width × depth)."
- Output: `ma_output` | Notes: `note_ma`

**5.5.6 Wheel Stops**
- Panel ID: `wt_wheelstop` | Enable: `en_wheelstop` | Cluster: Heavy (orange)
- Inputs: New Installs qty (`ws_new`), Reset/Re-pin qty (`ws_reset`), Remove & Dispose qty (`ws_remove`), Phases (`ws_phases`), Travel hrs (`ws_travel`)
- Three separate operation types with differentiated production rates (v4.0 feature)
- Output: `ws_output` | Notes: `note_ws`

**5.5.7 Signs**
- Panel ID: `wt_sign` | Enable: `en_sign` | Cluster: Heavy (orange)
- Inputs: Signs on Post qty (`sg_post`), Signs in Bollard qty (`sg_bollard`), Phases (`sg_phases`), Travel hrs (`sg_travel`)
- Note: "Post signs include small and large at blended rate of 32/day. Bollard signs include sign + bollard material costs."
- Output: `sg_output` | Notes: `note_sg`

**5.5.8 Bollard Replacement**
- Panel ID: `wt_bollard` | Enable: `en_bollard` | Cluster: Heavy (orange)
- Inputs: Bollards qty (`bo_qty`), Phases (`bo_phases`), Travel hrs (`bo_travel`)
- Output: `bo_output` | Notes: `note_bo`

**5.5.9 Rubber Speed Bumps**
- Panel ID: `wt_speedbump` | Enable: `en_speedbump` | Cluster: Paint (blue)
- Inputs: Speed Bumps qty (`sb_qty`), Phases (`sb_phases`), Travel hrs (`sb_travel`)
- Output: `sb_output` | Notes: `note_sb`

**5.5.10 Asphalt Speed Humps**
- Panel ID: `wt_speedhump` | Enable: `en_speedhump` | Cluster: Heavy (orange)
- Inputs: Speed Humps qty (`sh_qty`), Phases (`sh_phases`), Travel hrs (`sh_travel`), and per-hump length/width/depth fields (`sh_len_i` / `sh_wid_i` / `sh_dep_i`, i = 0…n−1) rendered dynamically when qty changes (each defaults to the standard 16' / 13' / 2.64")
- Note: "Sinusoidal (half-sine) profile. Set each hump's length, width, and max depth; standard 16'×13'×2.64" = 2.13 tons. Tonnage scales with length×width×depth; production is driven by footprint area (SF) so depth changes material but not crew time."
- Output displays: Total length (ft), Footprint area (SF), Asphalt tons, then tier table
- Notes: `note_sh`

**5.5.11 Inlet Repair / Reconstruction**
- Panel ID: `wt_inlet` | Enable: `en_inlet` | Cluster: Heavy (orange)
- Inputs: Repairs qty (`in_repair`), Reconstructions qty (`in_recon`), Castings Required qty (`in_casting`), Phases (`in_phases`), Travel hrs (`in_travel`)
- Note: "Repair = 6 units/day (4-man crew). Reconstruction hours depend on scope."
- Dual calculation paths: repair uses units/day, reconstruction uses hrs/unit
- Output: `in_output` | Notes: `note_in`

**5.5.12 Paint Striping Removal**
- Panel ID: `wt_paintremoval` | Enable: `en_paintremoval` | Cluster: Paint (blue)
- Inputs: Linear Feet LF (`pr_lf`), Phases (`pr_phases`), Travel hrs (`pr_travel`)
- Note: "Uses striping crew + grinder rental per day."
- Output: `pr_output` | Notes: `note_pr`

### 5.6 Scope Exclusions & Assumptions Panel

Collapsible panel (uses `togglePanel()`, not `toggleWorkType()`). Contains 12 fixed scope items rendered by `renderScopeChecklist()`. Each item has:
- Item name
- Radio group: Included / Excluded / N/A (styled as pill buttons)
- Optional note text input

Scope items are defined in the `SCOPE_ITEMS` constant:

**Default Included:**
1. Saw Cutting
2. Barricading / Coning
3. Material Hauling & Delivery

**Default Excluded:**
4. Traffic Control (flagging/MOT)
5. Permits & Fees
6. Survey / Layout / Staking
7. Quality Testing / Inspection
8. Off-site Disposal
9. Night / Weekend Premium
10. Temporary Pavement Markings
11. Concrete Work (curb/sidewalk)
12. Landscaping Restoration

States and notes persist via `saveRates()` / `loadRates()` using `scope_` prefixed keys. Reset to defaults via `resetForm()`. Collected via `collectAssumptions()` which returns `{ included: [], excluded: [], na: [] }` with names and notes. Exported in all four export formats (Quick, Full, JSON, Print).

Reference: ASPE Standard Estimating Practice — every estimate should document its basis and exclusions.

### 5.7 Estimate Summary Table

The primary output table. Bordered section with cyan accent. Contains:
- Description: "Crew sizes and hours per activity. Standard = Darrell's standalone rates. Conservative = 80% production. Aggressive = 120% production. Same crew for all tiers."
- Table (`hb-table`, ID `hbTable`) with columns: Activity, Crew, Conservative Hours/Days, Standard Hours/Days, Aggressive Hours/Days, Travel Hours
- Rows populated by `calculateAll()` into `<tbody id="hbBody">`
- Reviewer notes textarea: `note_estimateSummary`

### 5.8 Cluster Deployment Summary

Conditionally displayed section (ID `clusterSection`, purple border). Shows when crew clustering is active. Contains per-cluster cards showing:
- Cluster name, icon, crew size, equipment description
- Activity table: Activity name, Apportioned hours, Share percentage
- Cluster total hours and days
- Hours saved vs. standalone calculation
- Shared travel hours
- Job totals: physical crews, clustered hours, standalone hours, hours saved

Reviewer notes textarea: `note_clusterSummary`

### 5.9 Estimate Confidence Section

Conditionally displayed section (ID `confidenceSection`, cyan border). Shows composite score from four sub-scores as visual progress bars. Reference: AACE RP 42R-08. See Section 8 for full algorithm.

### 5.10 Calendar Duration Estimate

Conditionally displayed section (ID `calendarSection`, green border). Shows working-day timeline. Includes:
- Weather contingency days input (`weatherDays`, default 0)
- Timeline grid: Days, Activity, Crew, Hours
- Cure window rows (styled with orange left border, italic)
- Weather contingency rows
- Total row: X calendar days (Y work + Z cure + W weather)

See Section 9 for full algorithm.

### 5.11 Unit Cost Reasonableness Check

Conditionally displayed section (ID `unitCheckSection`). Shows table comparing calculated unit costs against P25-P75 benchmarks from 347 jobs. Columns: Activity, Qty, Unit, Calc $/Unit, P25, Median, P75, Status. Reviewer notes: `note_unitCheck`.

### 5.12 Job Analysis Section

Conditionally displayed section (ID `analysisSection`, orange border). Renders analysis cards with flag badges (HIGH/LOW/VERY HIGH/VERY LOW/INFO/OK) and bulleted reasons. Reviewer notes: `note_analysis`. See Section 10 for full algorithm.

### 5.13 Cost Summary

Always-visible section with green border. Contains:
- Three-column grid:
  1. **Labor & Equipment by Work Type** — 12 rows + subtotal
  2. **Materials by Work Type** — 12 rows + subtotal
  3. **Unit Cost Check** — Per-activity $/unit with status badges (conditionally displayed via `renderUnitCostColumn()`)
- Cost totals: Direct Cost Total, Markup % (synced with global settings), Markup Amount, BID PRICE (grand total row)
- Reviewer notes: `note_costSummary`

### 5.14 Historical Benchmarking Reference

Collapsible reference table showing P25/Median/P75 ranges and typical quantity ranges for 11 activities from the 347-job dataset. Static HTML (not dynamically generated).

### 5.15 Footer

Version, feature list, "All rates subject to superintendent review."

### 5.16 Toast Notification

Fixed-position notification at bottom-right. Shown by `showToast(msg)` for 3 seconds with slide-up animation.

### 5.17 Reviewer Notes System

17 textarea elements across the application for reviewer annotations:

| Key | ID | Location |
|-----|-----|----------|
| cf | `note_cf` | Crack Filling panel |
| sc | `note_sc` | Sealcoating panel |
| st | `note_st` | Striping panel |
| ar | `note_ar` | Asphalt Repairs panel |
| ma | `note_ma` | Mastic panel |
| ws | `note_ws` | Wheel Stops panel |
| sg | `note_sg` | Signs panel |
| bo | `note_bo` | Bollards panel |
| sb | `note_sb` | Speed Bumps panel |
| sh | `note_sh` | Speed Humps panel |
| in | `note_in` | Inlet Repair panel |
| pr | `note_pr` | Paint Removal panel |
| estimateSummary | `note_estimateSummary` | Estimate Summary section |
| clusterSummary | `note_clusterSummary` | Cluster Deployment section |
| unitCheck | `note_unitCheck` | Unit Cost Check section |
| analysis | `note_analysis` | Job Analysis section |
| costSummary | `note_costSummary` | Cost Summary section |

Notes are collected by `collectNotes()` and exported in Quick Export, Full Export, JSON, and Print.

### 5.18 Tooltip System

CSS-only hover tooltips using `data-tip` attribute on elements with class `tip`. Positioned above the element, max-width 320px, with arrow animation. Used extensively on labels for shift settings, phases, travel, production rates, and benchmark columns.

---

## 6. JavaScript Constants and Data Structures

### 6.1 Shift Optimization Constants

```
SHIFT_INCREMENTS = [4, 6, 8, 10, 12]  // Valid billing increments in hours
HUSTLE_THRESHOLD = 0.5                 // Hours beyond boundary where crew can push to finish
```

### 6.2 BENCHMARKS Object (24 entries)

Historical P25/median/P75 unit cost benchmarks from 347 jobs. Each entry includes sample size (`n`). Basis classification:
- **EMPIRICAL**: Direct from dataset (e.g., crack fill n=52, sealcoat n=40, 4" lines n=63)
- **DERIVED**: Calculated from crew/rates/material when historical data is insufficient (e.g., 6" lines n=0, mastic n=0, speed humps n=0, paint removal n=0)

Full entries:

| Key | Name | Unit | P25 | Median | P75 | n | Basis |
|-----|------|------|-----|--------|-----|---|-------|
| cf | Crack Fill | LF | $0.66 | $0.84 | $1.14 | 52 | Empirical |
| sc | Sealcoat | SF | $0.098 | $0.113 | $0.14 | 40 | Empirical |
| st4 | 4" Lines | LF | $0.30 | $0.53 | $1.18 | 63 | Empirical |
| st6 | 6" Lines | LF | $0.50 | $0.85 | $1.80 | 0 | Derived |
| st12 | 12" Lines | LF | $1.67 | $1.93 | $6.36 | 7 | Empirical |
| st24 | 24" Lines | LF | $1.43 | $4.05 | $9.28 | 10 | Empirical |
| stAr | Arrows | EA | $19.87 | $25.62 | $36.01 | 30 | Empirical |
| stHC | HC Symbols | EA | $25.16 | $45.66 | $73.75 | 38 | Empirical |
| stSt | Stencils | EA | $11.00 | $22.09 | $46.86 | 20 | Empirical |
| stCb | Curb Paint | LF | $0.37 | $0.91 | $1.36 | 6 | Empirical |
| ar | Asphalt Repair | SF | $5.10 | $7.57 | $14.77 | 36 | Empirical |
| ma | Mastic Crack Fill | LF | $5.50 | $6.50 | $8.50 | 0 | Derived |
| ws | Wheel Stops (new) | UN | $36.77 | $88.22 | $103.75 | 8 | Empirical |
| ws_r | Wheel Stops (reset) | UN | $25.00 | $45.00 | $75.00 | 0 | Derived |
| ws_rm | Wheel Stops (remove) | UN | $30.00 | $50.00 | $90.00 | 0 | Derived |
| sg_sm | Signs (small) | UN | $24.34 | $53.67 | $113.84 | 3 | Empirical |
| sg_lg | Signs (large) | UN | $217.50 | $277.90 | $386.09 | 4 | Empirical |
| bo | Bollards | UN | $173.67 | $351.26 | $528.84 | 2 | Empirical |
| sb | Speed Bumps | UN | $493.34 | $554.62 | $615.90 | 2 | Empirical |
| sh | Speed Humps | UN | $750.00 | $950.00 | $1,400.00 | 0 | Derived |
| in_r | Inlet Repair | UN | $863.29 | $969.46 | $1,222.09 | 20 | Empirical |
| in_c | Inlet Reconstruct | UN | $835.31 | $966.74 | $1,459.28 | 18 | Empirical |
| pr | Paint Removal | LF | $0.55 | $0.85 | $1.50 | 0 | Derived |

### 6.3 QTY_RANGES Object (23 entries)

Typical quantity ranges from historical data. Used by the analysis engine for quantity-based reasoning and by the confidence system for scope definition scoring. Each entry has `low` and `high` values defining the normal band.

### 6.4 RATE_CONFIDENCE Object (12 entries)

Production rate confidence bands from Field Operations Questionnaire Q17. Each entry has:
- `band`: Numeric variance (10, 15, 20, 25, 35, or 40)
- `label`: Display string (e.g., "±20%")
- `reliability`: Descriptive text

| Activity | Band | Reliability |
|----------|------|-------------|
| crackFill | ±20% | Moderate — crack density and access vary |
| sealcoat | ±15% | Moderate-High — spray rig is consistent, lot complexity is the variable |
| striping | ±10% | High — machine speed is very consistent |
| asphaltRepair | ±35% | Low — every patch is different (depth, sub-base condition, delamination) |
| mastic | ±20% | Moderate — machine rate is fixed but crack width variance changes material consumption |
| wheelStops | ±15% | Moderate-High |
| bollards | ±25% | Moderate — removal of existing bollards is unpredictable (unknown foundation depth) |
| speedBumps | ±15% | Moderate-High |
| speedHumps | ±20% | Moderate |
| inletRepair | ±40% | Low — deterioration is invisible until opened; 20-30% of repairs escalate to reconstruction |
| paintRemoval | ±15% | Moderate-High — thermoplastic vs standard paint is the main variable |
| signs | ±15% | Moderate-High |

### 6.5 BAND_SCORE Mapping

Converts variance bands to confidence sub-scores for the Production Reliability calculation:

| Band | Score |
|------|-------|
| 10 | 0.90 |
| 15 | 0.85 |
| 20 | 0.80 |
| 25 | 0.75 |
| 35 | 0.65 |
| 40 | 0.60 |

### 6.6 Cure Windows and Work Sequence

```
CURE_WINDOWS = {
    crackFill_before_sealcoat: 1,    // 1 day cure between crack fill and sealcoat
    sealcoat_before_striping: 1,     // 1 day cure between sealcoat and striping
    asphaltRepair_before_striping: 1 // 1 day cure between asphalt repair and striping
}

WORK_SEQUENCE = [
    'asphaltRepair', 'inletRepair', 'crackFill', 'mastic', 'sealcoat',
    'striping', 'paintRemoval', 'wheelStops', 'bollards', 'signs', 'speedBumps', 'speedHumps'
]
```

### 6.7 Crew Clusters

Five crew clusters defining which activities share equipment and deploy as one physical crew:

| Cluster ID | Name | Icon | Activities | Equipment | Standalone |
|-----------|------|------|-----------|-----------|-----------|
| heavy | Heavy Crew | 🔶 | asphaltRepair, wheelStops, bollards, signs, inletRepair, speedHumps | Skid steer, hot box/triaxle, roller, dump truck, F550s | No |
| paint | Paint Crew | 🔷 | striping, paintRemoval, speedBumps | Striping machine, core drill, hand tools, F550s | No |
| sealcoat | Sealcoat Crew | 🟢 | sealcoat | Spray rig, edging tools, barricades | Yes |
| crackFill | Crack Fill Crew | 🟣 | crackFill | Routing machine, pour pot, F550 | Yes |
| mastic | Mastic Crew | 🔴 | mastic | Mastic machine (rented), 5-man specialized | Yes |

Supporting lookups:
- `ACTIVITY_CLUSTER`: Reverse lookup — activity key → cluster ID
- `CLUSTER_ACTIVITY_MAP`: Maps each activity key to its enable checkbox ID and snapshot key

---

## 7. Calculation Engine

### 7.1 Utility Functions

| Function | Signature | Purpose |
|----------|-----------|---------|
| `gv(id)` | `string → number` | Get numeric value from input element, returns 0 if empty/NaN |
| `sv(id, val)` | `string, string → void` | Set text content of element |
| `fmt(n)` | `number → string` | Format as USD with 2 decimals (always shows value) |
| `fmt2(n)` | `number → string` | Format as USD with 2 decimals (returns "$0" for ≤0) |
| `isOn(id)` | `string → boolean` | Check if checkbox is checked |
| `togglePanel(btn, contentId)` | `element, string → void` | Toggle panel open/closed (for config panels) |
| `toggleWorkType(btn, contentId)` | `element, string → void` | Toggle work type panel open/closed |
| `showToast(msg)` | `string → void` | Show 3-second notification |
| `syncMarkup(el)` | `element → void` | Sync markup % between the two markup inputs |
| `collectNotes()` | `void → object` | Collect all non-empty reviewer notes by key |

### 7.2 Shift Buffer Zone Optimizer

The core scheduling engine that converts raw production hours into billable shift durations.

**`snapWithHustle(hrs, stdShift)`**

Snaps raw hours to the next billing increment from `SHIFT_INCREMENTS`. Checks for hustle zone at two specific boundaries:
1. The standard shift increment
2. The maximum increment (12h)

When raw hours exceed a boundary by ≤0.5 hours (`HUSTLE_THRESHOLD`), snaps down instead of up. Returns `{ hours, hustle }`.

**`optimizeShifts(rawHrs, stdShift, maxShift, minDays)`**

Core shift optimizer. Handles single-day and multi-day scheduling:

1. **Zero hours**: Returns 0h/0d, or 4h×minDays if minDays > 0
2. **Single day** (rawHrs ≤ maxShift + hustle): Uses `snapWithHustle()`
3. **Multi-day**: Tries two base shift lengths (stdShift and maxShift), picks combination minimizing total billed hours:
   - Calculates full days + remainder
   - Tries extending last full day to absorb remainder
   - If remainder can't be absorbed, adds an extra day
4. **minDays floor**: If result has fewer days than minDays (phase-driven), recalculates with hours distributed across minDays

Returns `{ hours, days, hustle }`.

**`calcPhasedHours(qty, prodPerDay, stdShift, maxShift, phases)`**

Converts quantity + production rate into optimized shift hours:
```
rawHrs = (qty / prodPerDay) × stdShift
result = optimizeShifts(rawHrs, stdShift, maxShift, phases)
```

Returns `{ hours, days, hustle, rawHrs }`.

### 7.3 Three-Tier Calculator

**`calcThreeTier(qty, prodPerDay, stdShift, maxShift, phases, stdCrew)`**

Produces three duration estimates from the same crew by scaling the production rate:
- Conservative: `prodPerDay × 0.80`
- Standard: `prodPerDay × 1.00`
- Aggressive: `prodPerDay × 1.20`

Each tier runs through `calcPhasedHours()` independently. Returns `{ cons, std, agg }`, each with `{ crew, hours, days, hustle }`.

### 7.4 Crew Clustering Engine

**`clusterize(snapshot, stdShift, maxShift)`**

Groups co-deployable activities by cluster and applies shared shift optimization. Only active when `clusterMode` is "on".

**Algorithm:**

1. **Identify active clusters**: Scan all enabled activities via `CLUSTER_ACTIVITY_MAP`, group into clusters. For each activity, record raw production hours, travel time, crew rate, crew size.

2. **Single-activity clusters**: Pass through unchanged. No clustering benefit. Set `apportionedHrs` = standalone hours, `proportion` = 1.

3. **Multi-activity clusters** (2+ activities):
   a. Calculate combined raw production hours across all activities
   b. Take maximum travel time across activities (shared trip)
   c. Run `optimizeShifts()` on combined raw hours → cluster-level snapped hours
   d. Apportion snapped hours back to individual activities proportionally by raw hours
   e. Reconcile rounding: adjust primary activity (highest hours) to make sum exact
   f. All activities in cluster get same `apportionedDays` = cluster snapped days

4. **Track savings**: `hoursSaved = standaloneTotal - clusterTotalHrs`

Returns object keyed by cluster ID with cluster results, or `null` if clustering is off.

### 7.5 Per-Activity Calculation Blocks

The `calculateAll()` function (~850 lines) runs the following calculation for each of the 12 work types. Each block follows this pattern:

1. Read inputs (quantity, rate, production rate, phases, crew, travel, material prices)
2. Apply waste factor to material quantities
3. Call `calcThreeTier()` for standard activities
4. Calculate travel cost = travel hours × crew rate
5. Call `renderTierTable()` to update the work type's output panel
6. Accumulate labor/material costs into `sumLabor` and `sumMat`
7. Push row to `hbRows` array (for estimate summary table)
8. Push unit check(s) to `unitChecks` array
9. Store detailed snapshot in `snapshot.activities[key]`

**Work-type-specific calculation logic:**

**Striping (Concurrency Model):**
- Machine items and hand items calculated separately
- Each item: `hours = (qty / prodPerDay) × stdShift`
- `machineHrs` = sum of machine item hours
- `handHrs` = sum of hand item hours
- `concurrentHrs` = `max(machineHrs, handHrs)` — duration is the longer group, not the sum
- Phase and travel applied to concurrent hours
- Material cost: sum of all 8 line items × waste factor
- Labor cost: shift hours × crew rate (crew handles both machine and hand work)
- Snapshot includes `lineItems[]` and `concurrency` object

**Asphalt Repairs (Auto Crew Selection & Tonnage):**
- Tonnage calculation per depth config:
  - Surface tons: `(sf × depth × 148) / 2000` for 9.5mm (2" = 0.167 ft)
  - Base tons: `(sf × depth × 148) / 2000` for 19mm (4" = 0.333 ft)
  - DGA tons: `(sf × depth × 115) / 2000` (115 lb/ft³ density, 4" or 6" depending on config)
- Apply waste factor to each tonnage
- Total asphalt tons = surface + base (DGA is separate)
- **Crew selection**: If `totalAsphaltTons > 4` → triaxle crew (rateAsphaltLarge, crewAsphaltLarge), else → hot box crew (rateAsphaltSmall, crewAsphaltSmall)
- **Material cap (`maxAsphaltTons`, default 13.5 T/day)** — the hot mix the crew can place and compact per day. Applied as a **rate clip**, not merely a floor on days:
  ```
  capSF   = maxAsphaltTons / tonsPerSF
  effRate = min(laborRate x tierFactor, capSF)
  ```
  Previously the cap only forced extra days while hours were computed from the labor rate alone, producing artifacts like *8 crew-hours spread over 2 days* — understating labor and overstating travel days. As a rate clip, hours grow with the stretched schedule.
- **Calibration**: 13.5 T/day comes from the bid system actuals (Camden: 975 SF @4", 27 T over 2 shifts). The app now reproduces that job exactly at **16 crew-hours / 2 days**. Small and shallow jobs are labor-limited and unaffected by the cap; deep or large sections are the ones it stretches.
- Material cost: `surfTons × asphaltPrice + baseTons × baseAsphaltPrice + dgaTons × dgaPrice`
- Snapshot includes `tonnage`, `crewType`, `depthConfig`

**Mastic (Box Calculation):**
- Box coverage: `lfPerBox = 57.5 / (crackWidth × crackDepth)` (57.5 cu.in. per 30lb box)
- Boxes needed: `Math.ceil((lf / lfPerBox) × wasteFactor)`
- Material cost: `boxes × matMasticBox`
- Machine rental: `masticMachineRate × tier.std.days`
- Labor cost includes crew hours only (machine rental is separate)
- Snapshot includes `boxCalc`

**Wheel Stops (Differentiated Production Rates — v4.0):**
- Three operation types calculated separately:
  - Install hours: `(newQty / prodWsInstall) × stdShift`
  - Reset hours: `(resetQty / prodWsReset) × stdShift`
  - Removal hours: `(removeQty / prodWsRemoval) × stdShift`
- Combined raw hours = install + reset + removal
- Shift optimization on combined hours
- **Labor cost uses blended rate weighted by hours fraction:**
  - `installFraction = installHrs / combinedRawHrs`
  - `blendedRate = installFraction × rateWsInstall + resetFraction × rateWsReset + removeFraction × rateWsRemove`
- Material cost: `newQty × matWsNew + resetQty × matWsPin + removeQty × matWsDispose`
- Separate unit checks for new, reset, and removal operations
- Snapshot includes `blendedRate`, per-type hours, per-type rates

**Signs (Equivalency-Based):**
- Bollard-mounted signs weighted by production rate ratio: `equivalentUnits = postQty + bollQty × (prodPost / prodBoll)`
- Uses sign crew rate for all
- Material cost: `postQty × matSignSmall + bollQty × (matSignLarge + matBollard)` (bollard signs include bollard material)

**Inlet Repair (Dual Calculation Paths):**
- Repair: uses units/day → `repairHrs = (repairQty / prodRepair) × stdShift`
- Reconstruction: uses hrs/unit → `reconHrs = reconQty × prodRecon`
- Combined hours = repair + reconstruction
- Material: `reconQty × matBlock + castingQty × matCasting`
- Separate unit checks for repair and reconstruction

**Speed Humps (Per-Hump Dimensions → Tonnage):**
- Geometry: sinusoidal (half-sine) profile with **fully variable per-hump length, width, and max depth**. Asphalt volume = half-sine average height × footprint, so tonnage is linear in each dimension.
- Calibration anchor: the standard hump (16'×13'×2.64") = 2.13 tons of 9.5mm asphalt. `SH_TON_FACTOR = 2.13 / (2.64 × 13 × 16) ≈ 0.0038789` tons per (in·ft·ft) folds in the half-sine factor 2/π, the inch→ft and lb→ton conversions, and the ~146 lb/ft³ compacted density — derived from the anchor so the standard hump still yields exactly 2.13 tons.
- Per hump: `tons_i = SH_TON_FACTOR × depth_i × width_i × length_i` (depth in inches, width/length in feet).
- Dimensions come from the dynamic `sh_len_i` / `sh_wid_i` / `sh_dep_i` inputs; any absent/blank value falls back to the standard 16' / 13' / 2.64" (so headless/test DOM and untouched fields reproduce the legacy 2.13/hump).
- `totalTons = ceil(Σ tons_i × wasteFactor)`
- Material cost: `totalTons × asphaltPrice`
- Snapshot `tonnage` records `totalTons`, `avgTonsPerHump`, `lengths[]`, `widths[]`, `depths[]`, `totalLength`, `totalArea`, `stdArea`, `tonFactor`, and the `stdLength`/`stdWidth`/`stdDepth` references.

**Speed Humps (Footprint-Area-Weighted Production):**
- `prodSpeedHump` (4/day) is **standard-hump** throughput, not raw count. Off-size humps are converted to standard-hump equivalents before applying it. The size proxy is **footprint area (length × width, SF)** — matching how the crew's rate is tracked in the bid system (SF/day, like patching). Depth therefore drives material tonnage but **not** crew time.
- Per hump: `equiv_i = α + (1 − α) × (area_i / SH_STD_AREA)`, where `area_i = length_i × width_i`, `SH_STD_AREA = 16 × 13 = 208 SF`, and `α = shSetupFrac` (default 0.4) is the fraction of a hump's labor that is fixed setup (marking, edge prep, forming the profile) and does not scale with size.
- `equivalentUnits = Σ equiv_i` is passed to `calcThreeTier` in place of `qty`; hours ≈ `(equivalentUnits / prodSpeedHump) × stdShift` (phased/tiered as usual).
- **Bounds & backward compatibility**: at standard footprint `area_i = 208` so `equiv_i = 1` for any α → an all-standard job gives `equivalentUnits = qty` and reproduces legacy hours exactly (golden-test safe). `α = 1` → pure unit count (legacy behavior at all sizes); `α = 0` → pure SF-driven (≡ `prodSpeedHump × 208` SF/day).
- Production (α, area) is independent of material (tonnage, depth, waste factor); changing depth or waste affects tons/cost only, not hours.
- Snapshot records `equivalentUnits`, `sizeProxy: 'area'`, `totalArea`, and `rates.setupFraction`; `rawProductionHrs` uses `equivalentUnits`.

**Paint Removal:**
- Uses striping crew + grinder rental per production day
- Grinder rental: `matPaintRemoval × tier.std.days`

### 7.6 Post-Calculation Pipeline

After all 12 work type blocks, `calculateAll()` runs:

1. **Render Estimate Summary Table**: Builds HTML rows from `hbRows` array with three-tier data, inserts into `#hbBody`. Includes totals row.

2. **Calculate Cost Totals**: Sum labor and material across all work types. Calculate direct cost, markup amount, and bid price. Update all DOM elements.

3. **Unit Cost Reasonableness Check**: For each entry in `unitChecks`:
   - Calculate: `unitCost = totalCost / qty`
   - Classify status:
     - `unitCost < p25 × 0.50` → VERY LOW
     - `unitCost < p25` → LOW
     - `unitCost > p75 × 2.00` → VERY HIGH
     - `unitCost > p75` → HIGH
     - Otherwise → IN RANGE
   - Render table rows with status badges into `#unitCheckBody`

4. **Crew Clustering**: Call `clusterize(snapshot)` if clustering is on. When clustering produces multi-activity results:
   - **Cluster-aware unit cost recalculation**: For each unit check in a multi-activity cluster, recalculate the unit cost using apportioned hours instead of standalone shift minimums. This produces more accurate unit costs that reflect shared mobilization.
   - Store `standaloneUnitCost` and mark as `clustered: true` on affected checks

5. **Render Unit Cost Column**: Call `renderUnitCostColumn(unitChecks)` — shows $/unit with color-coded status badges in the cost summary's third column.

6. **Render Cluster Summary**: Call `renderClusterSummary(clusterResults)` — builds cluster deployment cards.

7. **Calculate and Render Confidence**: Call `calculateConfidence(snapshot)` → `renderConfidence(result)`. See Section 8.

8. **Calculate and Render Calendar**: Call `calculateCalendarDuration(snapshot)` → `renderCalendar(calendar)`. See Section 9.

9. **Render Job Analysis**: Call `renderAnalysis()` which reads `window.lastCalcSnapshot` and calls `generateAnalysis()`. See Section 10.

10. **Check Asphalt Prices**: Call `checkAsphaltPrices()` — shows warning banner if asphalt/DGA quantities exist but prices are empty.

### 7.7 Snapshot Architecture

All calculation results are stored in `window.lastCalcSnapshot`, which serves as the canonical data source for all four export functions. The snapshot contains:

```
{
    meta: { projectName, version, date },
    settings: { stdShift, maxShift, asphaltPrice, baseAsphaltPrice, dgaPrice },
    activities: {
        [key]: {
            enabled: true,
            rawProductionHrs: number,
            inputs: { ... },          // All user inputs for this activity
            rates: { ... },           // Crew rate, production rate, crew size
            tiers: { cons, std, agg },// Three-tier results
            costs: { ... },           // Labor, material, total costs
            // Activity-specific:
            tonnage: { ... },         // Asphalt/speed humps
            boxCalc: { ... },         // Mastic
            lineItems: [ ... ],       // Striping
            concurrency: { ... },     // Striping
            blendedRate: number,      // Wheel stops
            crewType: string,         // Asphalt (small/large)
        }
    },
    hbRows: [ { name, tier, travel } ],
    unitChecks: [ { name, qty, unit, unitCost, p25, med, p75, status, benchKey, totalCost, clustered, standaloneUnitCost } ],
    clustering: { ... },           // Cluster results (or null)
    confidence: { ... },           // Confidence scores
    calendar: { ... },             // Calendar timeline
    summary: { totalLabor, totalMat, directCost, markupPercent, markupAmount, bidPrice, laborByType, materialByType },
    scopeAssumptions: { included, excluded, na },
    notes: { ... },
    analysis: [ ... ]              // Added by JSON export
}
```

---

## 8. Estimate Confidence System

### 8.1 Overview

A composite confidence score built from four sub-scores, each with explanatory drivers. The score answers: "How reliable is this estimate?" with transparency about what drives the score up or down.

### 8.2 Sub-Score Algorithms

**Production Reliability (weight: 35%)**

Measures how predictable the production rates are for the active work types.

Formula: Weighted average of `BAND_SCORE[band]` values across active activities, weighted by each activity's direct cost (labor + material).

- For each active activity, look up its `RATE_CONFIDENCE` band
- Convert band to score via `BAND_SCORE` mapping (±10% → 0.90, ±40% → 0.60)
- Weight by that activity's share of total direct cost
- Drivers sorted by cost share descending, showing band, activity name, cost percentage, and reliability description

**Benchmark Alignment (weight: 30%)**

Measures what percentage of calculated unit costs fall within the P25-P75 historical range.

Formula: `inRange / totalChecks` where `inRange` = count of unit checks with status "IN RANGE".

- Outliers listed with status, calculated unit cost, and benchmark range
- If all are in range, shows confirmation message

**Scope Definition (weight: 20%)**

Measures whether entered quantities fall within typical job-size ranges from `QTY_RANGES`.

Formula: `scopeInRange / scopeChecked` where `scopeInRange` = count of quantities within normal band.

- For each active activity, looks up its benchmark keys and checks quantity against `QTY_RANGES[key].low` through `QTY_RANGES[key].high`
- Out-of-range items shown with direction (ABOVE/BELOW), actual quantity, and typical range

**Data Quality (weight: 15%)**

Measures the robustness of the benchmark data behind each unit cost check, weighted by cost share.

Formula: Weighted average of sample-size scores across unit checks.

Sample size → score mapping:
- n ≥ 30: 1.00 (strong)
- n ≥ 15: 0.80 (good)
- n ≥ 5: 0.60 (limited)
- n > 0: 0.40 (sparse)
- n = 0: 0.20 (derived — no field data)

Drivers sorted by cost share descending, showing sample size, tier, and cost percentage.

### 8.3 Composite Score

```
composite = prodReliability × 0.35 + benchAlignment × 0.30 + scopeDefinition × 0.20 + dataQuality × 0.15
```

Descriptor mapping:
- ≥ 80%: HIGH (green)
- ≥ 65%: MODERATE-HIGH (cyan)
- ≥ 50%: MODERATE (yellow)
- < 50%: LOW (red)

### 8.4 Visual Rendering

Each sub-score rendered as a horizontal bar with:
- Label with weight percentage
- Progress bar (color-coded: green ≥80%, cyan ≥65%, yellow ≥50%, red <50%)
- Percentage value
- Expandable explanation section with:
  - Definition (italic, what this score measures)
  - Driver items with color-coded tags showing the specific factors

Composite shown as large score value with descriptor and summary counts.

---

## 9. Calendar Duration System

### 9.1 Algorithm

**`calculateCalendarDuration(snapshot)`**

Builds a working-day timeline from active activities:

1. **Group activities by cluster**: If clustering is active, use cluster data. Otherwise, treat each activity as standalone.

2. **Sort by work sequence**: Order clusters/activities by the earliest `WORK_SEQUENCE` position of their activities.

3. **Build timeline with cure windows**: For each cluster entry (in sequence order):
   a. **Scan ALL prior entries** (not just the immediately preceding one) for cure window dependencies. A dependent activity (e.g., sealcoat) may be separated from its prerequisite (e.g., crackFill) by an unrelated cluster (e.g., mastic).
   b. For each prior entry, check `CURE_WINDOWS` for matching `before_after` patterns
   c. If cure days needed, insert cure window entry with `maxCure` days
   d. Insert work entry with cluster's standard-tier days and hours

4. **Add weather contingency**: If `weatherDays > 0`, append weather entry.

5. **Return**: `{ timeline, totalDays, workDays, cureDays, weatherDays }`

### 9.2 Timeline Entry Types

| Type | Fields | Rendering |
|------|--------|-----------|
| `work` | startDay, endDay, days, name, crew, hours, icon | Standard row with day range, activity name, crew size, hours |
| `cure` | startDay, endDay, days, name | Styled row with orange left border, "⏳ Cure Window" |
| `weather` | startDay, endDay, days, name | Styled row with "🌧️ Weather Contingency" |

### 9.3 Dependencies

```
Asphalt Repair → (1 day cure) → Striping
Crack Fill → (1 day cure) → Sealcoat
Sealcoat → (1 day cure) → Striping
```

---

## 10. Job Analysis Engine

### 10.1 Overview

**`generateAnalysis(snapshot)`** — A deterministic analysis function (~420 lines) that examines every flagged unit cost check and produces specific, reasoned explanations for why that item is outside the historical range. The analysis does not guess. It traces the flag back to observable inputs and known field dynamics from the 26-question Field Operations Questionnaire.

### 10.2 Per-Activity Analysis Rules

For each unit check with status ≠ "IN RANGE", the engine checks (in order):

1. **Quantity vs. typical range** — Is this a small job where crew mobilization dominates per-unit cost, or a large job where mobilization is amortized? Enhanced with Q1 crew-sizing logic: when quantity is under 50% of daily crew capacity, flags that a reduced crew may be appropriate.

2. **Minimum shift utilization** — Is the crew being paid for a 4-hour minimum when actual production work is under 3.5 hours? Identifies the utilization gap between raw production hours and snapped shift hours.

3. **Setup/breakdown overhead** (Q15, Q26) — On small-scope jobs, detects when non-productive time (equipment unloading, material heating, barricading, breakdown) represents a significant percentage of the shift. Triggers when raw production hours ≤ 4 and overhead ratio > 20%.

4. **Phase count** (Q13) — Multiple phases mean multiple mobilizations with setup/breakdown each time. Phase 2+ typically runs 10-15% faster as crew knows the site.

5. **Travel ratio** (Q8) — When travel time exceeds 25% of production hours, it is a significant per-unit cost driver. Jobs over 45-60 minutes one-way should consider pre-staging equipment.

6. **Crack fill quantity reliability** (Q18, Q25) — Warns that scope quantities are the least reliable number in maintenance estimating, with field quantities routinely 30-60% higher than scope descriptions.

7. **Sealcoat crew sizing** (Q3) — 4-person crew on under 35,000 SF may be oversized; 3-person crew is often sufficient below that threshold.

8. **Asphalt-specific reasoning** (Q9, Q17):
   - Multi-layer depth configs increase material tonnage
   - Crew type escalation at 4 tons (hot box limit, triaxle access considerations)
   - Material cost ratio analysis (low asphalt pricing as a flag driver)
   - Rate confidence warning (±35%, widest variance of any work type)

9. **Mastic-specific reasoning** (Q20):
   - Large crack cross-section reduces box coverage
   - Wide cracks (2"+) slow machine speed and consume 2-3× material per LF

10. **Striping concurrency reasoning** (Q4, Q17):
    - Concurrency savings when machine and hand work overlap
    - Hand-work dominance driving crew shift beyond machine hours
    - Rate confidence note (±10%, most reliable rate)

11. **Wheel stop analysis** (Q21):
    - Mixed operation types create blended rate effects
    - Compares user's differentiated rates against field benchmarks (install 80, reset 155, removal 220/day)
    - Flags when rates differ >15% from field benchmarks

12. **Inlet repair escalation** (Q22) — 20-30% of repair-scoped jobs escalate to reconstruction. Recommends pricing 75% repair / 25% reconstruction as a hedge.

13. **Bollard context** (Q23) — Small quantities (≤4) can use a 3-person crew. Concrete surfaces are 20-25% slower than asphalt. Remove-and-replace is ~1.5× slower than new install.

14. **Signs with bollard mounts** — Notes slower production rate for bollard-mounted signs vs. post-mounted.

### 10.3 Cross-Activity Observations

Generated when multiple activities are present:

- **Standalone Rate Context** — Notes that benchmarks are from standalone-bid rates. Identifies potential tack-on activities (under 25% of daily capacity per Q14) that could be absorbed by the primary crew.

- **Work Sequencing** (Q12) — When the job includes the standard progression (patch → crack fill → sealcoat → stripe), surfaces required cure windows.

- **Overtime Alert** (Q5) — Flags any single activity estimated at over 10 hours on one day.

- **Job Scale** — Large jobs (over 40 standard hours) get a scheduling context note.

- **Pattern Detection** — When a majority of checked activities are flagged in the same direction (mostly HIGH or mostly LOW), notes the systemic pattern and likely causes.

- **Clustering Observations** — When clustering is active:
  - Per-cluster: shared mobilization details, hours saved, travel savings
  - Tack-on detection within clusters (activities < 25% of cluster production)

- **Clustering Suggestion** — When clustering is OFF but multiple activities share a cluster, suggests enabling clustering.

- **All-OK Message** — When all unit costs are in range, confirms consistency and notes field confidence variation by work type.

### 10.4 Rendering

**`renderAnalysis()`** — Reads `window.lastCalcSnapshot`, calls `generateAnalysis()`, renders analysis cards into `#analysisBody`. Each card shows:
- Activity name and flag badge (color-coded by severity)
- Benchmark line: calculated $/unit | P25 - Median - P75
- Bulleted reasons list

Card border-left colors:
- HIGH: orange (`--accent-orange`)
- LOW: blue (`--accent-blue`)
- VERY HIGH / VERY LOW: red (`--accent-red`)
- INFO: cyan (`--accent-cyan`)
- OK: green (`--accent-green`)

---

## 11. Export Functions

### 11.1 Quick Export (`exportResults()`)

Copies a summary to clipboard containing:
1. Header: project name, date, shift settings, version
2. Estimate Summary table (three-tier hours, crew sizes, travel)
3. Cost Summary (labor, materials, direct cost, markup, bid price)
4. Estimate Confidence composite score
5. Scope Exclusions & Assumptions
6. Reviewer Notes

### 11.2 Full Export (`exportComprehensiveText()`)

Copies a comprehensive plain-text report to clipboard. Structured to lead with crew/duration data (the primary deliverable), followed by analysis, then costs (labeled as reference).

**Report sections:**
1. **Crew & Duration Summary** — Three-tier hours table with shift settings
2. **Crew Deployment (Clustered)** — Per-cluster activity apportioning, travel, savings
3. **Estimate Confidence** — All four sub-scores with full explanatory drivers and composite
4. **Calendar Duration** — Day-by-day timeline with cure windows
5. **Activity Details** — Per work type: crew, rates, three-tier duration, scope inputs, tonnage/box calculations, striping line items with concurrency, cost detail (labeled as calculator estimate)
6. **Unit Cost Reasonableness Check** — Formatted table with benchmark comparisons, cluster-adjusted notation
7. **Job Analysis** — All observations with flag status and bulleted reasons
8. **Cost Summary** — Labeled "Reference only — final cost buildup, overhead, and bid pricing handled elsewhere." Labor, materials, direct cost, markup, calculator total, material pricing assumptions.
9. **Scope Exclusions & Assumptions** — Per ASPE Standard Estimating Practice
10. **Reviewer Notes** — All non-empty notes by section

### 11.3 JSON Export (`exportJSON()`)

Downloads the complete calculation snapshot as a JSON file. Includes all intermediate calculation data: inputs, rates, tiers, costs, tonnage breakdowns, box calculations, striping line items, concurrency data, unit checks, clustering results, confidence scores, calendar timeline, scope assumptions, notes, and analysis observations.

File naming: `{projectName}_{date}.json`

### 11.4 Print/PDF Export (`printEstimate()`)

Opens a new browser window with a clean white-background HTML document built from the snapshot, then triggers the browser's print dialog after a 500ms delay.

**Print document structure:**
- Own CSS (white background, IBM Plex Sans / JetBrains Mono via Google Fonts link, print-optimized styles with page break hints)
- Header: project name, date, version
- Crew & Duration Summary table
- Calendar Duration timeline
- Estimate Confidence with all four sub-scores, explanatory drivers, and composite
- Unit Cost Reasonableness Check table with status badges
- Cost Summary (3-column grid: labor, materials, unit costs) with totals
- Job Analysis observations
- Scope Exclusions & Assumptions
- Reviewer Notes
- Footer: version and timestamp

Uses the new-window approach rather than @media print CSS on the main page, ensuring the print layout is completely independent of the dark-theme application UI.

---

## 12. Save / Load / Reset

### 12.1 Save Rates (`saveRates()`)

Persists all editable configuration to `localStorage` under key `'maintCalcRates'`:
- 70 rate/setting input values (crew rates, material costs, production rates, crew sizes, waste factors, global settings, cluster mode, weather days)
- Scope checklist radio states (with `scope_` prefix)
- Scope checklist notes (with `scope_note_` prefix)
- Version tag (`_version: CALC_VERSION`)

### 12.2 Load Rates (`loadRates()`)

Reads from `localStorage`, restores all values including scope radio states and notes. Triggers `calculateAll()` after loading.

### 12.3 Clear Saved Rates (`clearSavedRates()`)

Removes `'maintCalcRates'` from `localStorage`.

### 12.4 Reset Form (`resetForm()`)

Clears all quantity inputs, resets phases to 1, travel to 0, project name to empty, depth config to first option, mastic dimensions to defaults, all reviewer notes, weather days to 0, scope checklist to defaults. Triggers `calculateAll()`.

### 12.5 Version Migration

On `DOMContentLoaded`, if saved rates exist but `_version` doesn't match `CALC_VERSION`, the saved rates are cleared and a toast notifies the user. This prevents stale configurations from causing errors when the calculator is updated.

---

## 13. Initialization

On `DOMContentLoaded`:
1. Call `renderScopeChecklist()` — build scope checklist from `SCOPE_ITEMS`
2. Check localStorage for saved rates:
   - If version mismatch: clear and notify
   - If version matches: restore all values including scope states
3. Create asphalt price warning div if not present (dynamically appended to settings panel)
4. Call `calculateAll()` — initial calculation with default or restored values

---

## 14. Data Flow

```
Scope Inputs (quantities, phases, travel)
    │
Rate Configuration (crew rates, material costs, production rates, crew sizes, waste factors)
    │
calculateAll()
    ├── Per-activity calculation (12 work types)
    │   ├── Raw production hours = (quantity / production rate) × standard shift hours
    │   ├── Phase adjustment (hours × phases via minDays)
    │   ├── Three-tier: Conservative (÷ 0.8), Standard (÷ 1.0), Aggressive (÷ 1.2)
    │   ├── Shift optimization (snap to 4/6/8/10/12h increments, hustle detection)
    │   ├── Cost calculation (labor = hours × crew rate, material = qty × unit cost × waste)
    │   └── Snapshot capture → window.lastCalcSnapshot.activities
    │
    ├── Estimate Summary Table (crew, hours, days per tier)
    ├── Cost Totals (labor + material + markup)
    │
    ├── Unit Cost Reasonableness Check (calculated $/unit vs P25-P75 benchmarks)
    │   └── Status classification: IN RANGE | HIGH | LOW | VERY HIGH | VERY LOW
    │
    ├── Crew Clustering (shared mobilization, per-cluster optimization)
    │   └── Cluster-aware unit cost recalculation (apportioned hours)
    │
    ├── Unit Cost Column (third column in cost summary with status badges)
    ├── Cluster Deployment Summary
    │
    ├── Estimate Confidence (4 sub-scores with explanatory drivers)
    │   ├── Production Reliability (35%) — RATE_CONFIDENCE × BAND_SCORE weighted by cost
    │   ├── Benchmark Alignment (30%) — % of unit checks IN RANGE
    │   ├── Scope Definition (20%) — % of quantities in QTY_RANGES normal band
    │   └── Data Quality (15%) — BENCHMARKS sample sizes weighted by cost
    │
    ├── Calendar Duration (sequencing + cure windows + weather contingency)
    │
    ├── Job Analysis Engine (deterministic flag reasoning from 26-question questionnaire)
    │
    └── Asphalt Price Warnings
            │
    window.lastCalcSnapshot (canonical data source)
            │
    Exports read snapshot:
    ├── Quick Export → clipboard (summary)
    ├── Full Export → clipboard (comprehensive text)
    ├── JSON Export → file download (raw data)
    └── Print/PDF → new window → browser print dialog
```

---

## 15. Key Design Decisions

**Why single-file?** The tool is used internally, hosted as a static page, and needs to work anywhere a browser exists. No build toolchain, no deployment pipeline, no server. Open the file and it works.

**Why three tiers instead of one number?** A single duration estimate implies false precision. Three tiers give the estimator a range that reflects real variability in field conditions, crew capability, and site complexity. The estimator picks the tier that matches their read of the job.

**Why snap to shift increments?** You do not send a crew for 5.3 hours. You send them for a half day (4 hours) or a full day (8 hours). The shift optimizer reflects how work is actually scheduled and billed.

**Why is the analysis deterministic?** The analysis engine does not use machine learning, statistical models, or probabilistic reasoning. It applies explicit rules derived from field experience and historical data. Every observation traces to a specific input condition. This makes the output auditable and predictable — the same inputs always produce the same analysis.

**Why are costs secondary to crew/hours?** The calculator's primary output is crew sizes and durations. Cost summaries exist to sanity-check whether the sizing seems reasonable, not to produce bid pricing. Exports label them accordingly.

**Why are benchmarks from standalone rates?** The 347-job dataset represents individual activity bids priced with Darrell's rates. Multi-activity jobs, small tack-on scopes, and jobs with unusual complexity will naturally differ from these benchmarks. The analysis engine accounts for this by noting standalone rate context on multi-activity jobs.

**Why confidence with explanations?** Bare confidence scores are useless without knowing why. Each component shows its definition and lists every driver sorted by cost impact with severity tags. This makes the score actionable — you can see exactly which factors are dragging confidence down and decide whether to address them.

**Why differentiated wheel stop rates?** Field data (Q21) shows installs at 80/day, resets at 155/day, and removals at 220/day. A single blended rate of 80/day overstates duration for reset-heavy and removal-heavy jobs. The differentiated rates produce more accurate crew sizing and better unit cost alignment with benchmarks.

**Why cure windows in the calendar?** Work sequencing dependencies are real: you cannot sealcoat over uncured crack fill, and you cannot stripe over uncured sealcoat. The calendar surfaces these dependencies so the estimator accounts for them in scheduling.

---

## 16. Standards Alignment

The calculator's methodology aligns with practices described in:

| Standard | Alignment |
|----------|-----------|
| **AACE RP 17R-97** — Cost Estimate Classification System | Three-tier output provides Class 3-5 range estimate capability |
| **AACE RP 18R-97** — Cost Estimate Classification (EPC) | Scope definition scoring reflects estimate maturity assessment |
| **AACE RP 42R-08** — Risk Analysis and Contingency Determination | Estimate Confidence system with four risk-weighted sub-scores |
| **AACE RP 34R-05** — Basis of Estimate | Scope Exclusions & Assumptions checklist documents estimate basis |
| **AACE RP 40R-08** — Estimate Accuracy | Production rate confidence bands (±10% to ±40%) quantify accuracy expectations |
| **ASPE Standard Estimating Practice** | Scope definition, exclusions/assumptions documentation, reviewer notes |

---

## 17. Version History

| Version | Changes |
|---------|---------|
| **4.0** | Differentiated wheel stop production rates (install/reset/removal). Scope Exclusions & Assumptions checklist. Risk-Weighted Estimate Confidence with explanatory drivers. Per-activity unit cost column with status badges. Calendar Duration Estimate with cure windows and weather contingency. Print/PDF export. BENCHMARKS sample sizes. RATE_CONFIDENCE at module scope. |
| 3.5 | Sealcoat rate recalibrated to 52,000 SF/day. Crew clustering engine (heavy, paint, sealcoat, crack fill, mastic). Per-cluster shift optimization. Cluster deployment summary. |
| 3.4 | Field Operations Questionnaire integration (26 questions). Production rate confidence bands. Setup/breakdown detection. Crew-sizing thresholds. Cure window sequencing. Tack-on activity detection. |
| 3.3 | Job Analysis Engine. Full Export and JSON Export. Snapshot architecture. |
| 3.2 | Asphalt price warnings. Shift duration clamping. Unit Cost Reasonableness Check (347-job benchmarks). |
| 3.1 | Base calculator: 12 work types, three-tier output, shift optimizer, cost summary, quick export. |

---

## 18. Source Documents

| Document | Role |
|----------|------|
| Darrell's Production Rates | Baseline crew rates, material costs, and daily production rates (all defaults in Rate Configuration) |
| 347-Job Historical Dataset (Dec 2024 – Dec 2025) | P25/median/P75 unit cost benchmarks, typical quantity ranges, and sample sizes per activity |
| Field Operations Questionnaire — Working Answers (Feb 2026) | 26 questions on crew sizing, site conditions, phasing, judgment calls, work type specifics, and field wisdom. Integrated into the analysis engine as deterministic rules. |
| MnDOT Asphalt Pavement Maintenance Field Handbook | Specifications for sealcoat application windows, HMA temperatures, crack sealing sequencing, and material behavior |

---

*Maintenance Division Estimating Calculator v4.0 — Internal estimating tool. Not client-facing.*
