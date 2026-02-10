# Maintenance Division Estimating Calculator

A single-file, browser-based estimating tool purpose-built for asphalt maintenance operations. Designed for estimators and cost analysts who need to quickly price multi-trade parking lot and pavement maintenance work using real crew compositions, in-house production rates, and current material costs.

![Version](https://img.shields.io/badge/version-2.0-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

## Overview

This calculator handles 12 distinct asphalt maintenance work types in a single unified interface, allowing estimators to build combined estimates with automatic cost rollups and markup calculations. Every crew rate, material unit cost, and production benchmark is fully configurable — no hardcoded assumptions you can't override.

**v2.0** introduces data-calibrated production rates derived from statistical analysis of 347 historical job records, a built-in benchmarking reference panel showing actual all-in unit cost percentiles, and small/large sign differentiation.

The tool runs entirely in the browser with zero dependencies, zero build steps, and zero server requirements. Open the HTML file and start estimating.

## Work Types

| Work Type | Input Unit | Key Features |
|-----------|-----------|--------------|
| **Crack Filling** | LF | Hot rubberized sealant, configurable crew rate |
| **Seal Coating** | SF | Spray application, 2-coat system with sand |
| **Striping** | LF / EA | 8 line items (4"/6"/12"/24" lines, HC stalls, arrows, stencils, curbing) with per-item production rates |
| **Asphalt Repairs** | SF | Depth configuration dropdown (2" surface through full-depth with DGA), auto-selects hot box vs. triaxle crew at 4-ton threshold, rounds tonnage up |
| **Mastic Crack Filling** | LF | Machine rental per day, includes 1 full day labor for pickup/dropoff |
| **Wheel Stops** | EA | Three operations: new install, reset/re-pin, remove & dispose — each with separate crew and material costs |
| **Signs** | EA | Small and large signs, post-mounted or bollard-mounted, with separate material costs and production rates |
| **Bollard Replacement** | EA | Full replacement including footing and pavement restoration |
| **Rubber Speed Bumps** | EA | 6' sections with end caps, includes hardware |
| **Asphalt Speed Humps** | EA | Sinusoidal profile (16'×13'×2.64"), 2.13 tons per hump, supports existing asphalt or mill & pave context |
| **Inlet Repair / Reconstruction** | EA | Separate hour estimates for repair (4 hrs) vs. full reconstruction (8 hrs), optional castings |
| **Paint Striping Removal** | LF | Shot blaster/grinder rental per day on top of striping crew |

## Key Features

- **4-hour minimum charge** enforced across all crew types
- **Configurable work day** — 6, 8, or 10 hour days
- **Enable/disable any work type** via checkbox toggles without losing entered data
- **Combined cost summary** rolls up all active work types into labor/equipment and material subtotals
- **Markup percentage** applied to direct cost total for bid pricing
- **Export to clipboard** — generates a formatted text summary of the full estimate
- **Save/load rates** to browser local storage so your pricing persists between sessions
- **Fully editable rates panel** — every crew hourly rate, material unit cost, and daily production benchmark can be adjusted
- **Historical benchmarking panel** — built-in reference showing percentile unit costs from actual job data with job-size tier breakdowns

## Data Calibration (v2.0)

Production rates were calibrated against 347 historical job records (Dec 2024 – Dec 2025) using weighted-average Unit/MH productivity analysis across crew compositions.

### Production Rate Changes (v1.0 → v2.0)

| Item | v1.0 | v2.0 | Basis |
|------|:----:|:----:|-------|
| Crack Fill | 5,000 LF/day | 3,500 LF/day | Implied 3,236 from wtd avg 134.8 LF/MH × 3-man × 8hr |
| Seal Coat | 50,000 SF/day | 60,000 SF/day | Implied 65,545 from wtd avg 2,048 SF/MH × 4-man × 8hr |
| Stencils | 80 EA/day | 100 EA/day | Implied 102 from wtd avg 4.27 EA/MH × 3-man × 8hr |
| Asphalt Repair | 500 SF/day | 600 SF/day | Implied 609 from wtd avg 19.0 SF/MH × 4-man × 8hr |

Rates confirmed as accurate (no change): 4" Lines (8,000), Arrows (80), HC Symbols (80).

### Key Statistical Finding

Every dataset exhibits a strong inverse power-law relationship between job quantity and all-in unit cost. This is primarily driven by the 4-hour crew minimum — small jobs absorb the full mobilization cost across fewer production units. The calculator's existing minimum-hours mechanic naturally reproduces this behavior without needing tiered pricing.

Best-fit power law regressions (R² values): Asphalt Repair 0.77, 4" Lines 0.63, HC Symbols 0.43, Arrows 0.31, Sealcoat 0.28.

### Historical Benchmarking Reference

The calculator includes a built-in collapsible panel showing actual all-in unit cost percentiles (25th, median, 75th, weighted average) for each work type, plus job-size tier breakdowns for high-volume items. This allows estimators to gut-check calculator outputs against real field performance.

## Calculation Logic

### Asphalt Repairs (Tonnage)

Asphalt tonnage uses the industry-standard formula:

```
Tons = (SF / 9) × Depth(in) × 0.0575
```

DGA tonnage:

```
CY = SF × Depth(in) / 324
Tons = CY × 1.9
```

All tonnage is **rounded up to the next whole ton**. If total asphalt tonnage exceeds 4 tons, the calculator automatically switches from the hot box crew composition to the triaxle dump truck crew.

### Production Hours

For each work type:

```
Raw Hours = (Quantity / Daily Production Rate) × Hours Per Day
Applied Hours = max(Raw Hours, 4.0)   ← 4-hour minimum
Days = ceil(Applied Hours / Hours Per Day)
```

### Cost Buildup

```
Labor & Equipment = Applied Hours × Crew Hourly Rate
Material = Quantity × Unit Cost
Direct Cost = Σ(Labor & Equipment) + Σ(Material)
Bid Price = Direct Cost × (1 + Markup%)
```

## Getting Started

1. Download `maintenance-calc.html`
2. Open it in any modern browser
3. Set your current asphalt pricing in the global settings bar
4. Expand the rate configuration panel to verify or adjust crew rates, material costs, and production benchmarks
5. Enable the work types you need, enter quantities, and the calculator runs automatically
6. Expand the Historical Benchmarking Reference panel to compare your estimate against actual job data

No installation, no dependencies, no internet connection required.

## Customization

### Crew Rates

The rate configuration panel contains pre-loaded crew hourly rates that represent the combined cost of all labor and equipment for each crew type. These are calculated from detailed crew compositions (foremen, laborers, equipment pieces) and can be updated whenever wage rates or equipment costs change.

### Production Rates

Daily production benchmarks are calibrated from actual field performance data (v2.0). They represent what a full crew can accomplish in a standard work day under typical conditions. All rates are editable to account for site-specific conditions.

### Material Costs

Material unit costs include all-in pricing (material + tax + delivery where applicable). Asphalt pricing is set globally since it fluctuates on 15-day intervals.

## Changelog

### v2.0 — Data-Calibrated Release
- Calibrated production rates from 347 historical job records
- Added historical benchmarking reference panel with percentile unit costs
- Added job-size tier breakdowns for high-volume work types
- Split signs into small and large categories with separate material costs and production rates
- Updated default production rates: Crack Fill 3,500, Sealcoat 60,000, Stencils 100, Asphalt Repair 600

### v1.0 — Initial Release
- 12 work types with full crew composition and material cost modeling
- 4-hour minimum charge enforcement
- Configurable work day, markup, and rate persistence

## Roadmap

- **Future** — Android app conversion (Capacitor), PDF export, project save/recall, 6" line data integration

## Technical Details

- **Single HTML file** — all CSS and JavaScript inline, no external dependencies
- **~1,700 lines** of code including styles, markup, and calculation logic
- **Local storage** for rate persistence (browser-based, no server)
- **Responsive layout** — works on desktop, tablet, and mobile
- **Dark theme** optimized for extended use

## License

MIT License — see [LICENSE](LICENSE) for details.
