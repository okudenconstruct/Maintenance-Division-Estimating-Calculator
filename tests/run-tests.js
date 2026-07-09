#!/usr/bin/env node
/**
 * Golden-master regression tests for the Maintenance Estimating Calculator.
 *
 * Loads the <script> block out of the SHIPPED index.html (no build step, no
 * second file — the app stays single-file), runs it in a sandboxed Node vm
 * with a stub DOM whose input defaults are parsed from the same HTML, then
 * drives calculateAll() through a set of scenarios and compares the snapshot
 * output (tier hours/days, activity totals, summary costs) against
 * tests/golden.json.
 *
 * Usage:
 *   node tests/run-tests.js            # run tests, exit 1 on any mismatch
 *   node tests/run-tests.js --update   # re-baseline golden.json from current code
 *
 * Re-baseline ONLY when an output change is intentional (e.g. a rate
 * recalibration), and review the golden.json diff in the commit — that diff
 * IS the audit trail of what the change did to estimates.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'index.html');
const GOLDEN_PATH = path.join(__dirname, 'golden.json');
const UPDATE = process.argv.includes('--update');

const html = fs.readFileSync(HTML_PATH, 'utf8');

// ---------------------------------------------------------------------------
// Extract the app script and the static input defaults from index.html
// ---------------------------------------------------------------------------
const scriptStart = html.indexOf('<script>') + '<script>'.length;
const scriptEnd = html.lastIndexOf('</script>');
if (scriptStart < 8 || scriptEnd < 0) {
    console.error('FATAL: could not locate <script> block in index.html');
    process.exit(2);
}
const appScript = html.slice(scriptStart, scriptEnd);
const staticHtml = html.slice(0, scriptStart);

function attrOf(tag, name) {
    const m = tag.match(new RegExp(name + '="([^"]*)"'));
    return m ? m[1] : null;
}

// Input defaults: value attribute, checked flag
const INPUT_DEFAULTS = {};
for (const m of staticHtml.matchAll(/<input[^>]*>/g)) {
    const tag = m[0];
    const id = attrOf(tag, 'id');
    if (!id) continue;
    INPUT_DEFAULTS[id] = {
        value: attrOf(tag, 'value') ?? '',
        checked: /\schecked[\s/>]/.test(tag)
    };
}
// Select defaults: selected option, else first option
for (const m of staticHtml.matchAll(/<select[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const [, id, body] = m;
    const options = [...body.matchAll(/<option[^>]*>/g)].map(o => ({
        tag: o[0], value: attrOf(o[0], 'value') ?? ''
    }));
    const sel = options.find(o => /\sselected[\s/>]/.test(o.tag)) || options[0];
    INPUT_DEFAULTS[id] = { value: sel ? sel.value : '', checked: false };
}

// ---------------------------------------------------------------------------
// Stub DOM + sandbox factory (fresh per scenario so module state can't bleed)
// ---------------------------------------------------------------------------
function makeElement(id) {
    const d = INPUT_DEFAULTS[id] || {};
    return {
        id,
        value: d.value ?? '',
        checked: d.checked ?? false,
        textContent: '',
        innerHTML: '',
        innerText: '',
        style: {},
        dataset: {},
        selectedIndex: 0,
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        appendChild() {}, removeChild() {},
        addEventListener() {}, dispatchEvent() {},
        matches() { return false; }
    };
}

function makeContext() {
    const elements = new Map();
    const documentStub = {
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, makeElement(id));
            return elements.get(id);
        },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        addEventListener() {},
        createElement(tag) { return makeElement('__' + tag); },
        body: { appendChild() {}, removeChild() {} }
    };
    const sandbox = {
        document: documentStub,
        window: {},
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
        navigator: { clipboard: { writeText: () => Promise.resolve() } },
        console,
        setTimeout: (fn) => fn,
        URL: { createObjectURL: () => '', revokeObjectURL() {} },
        Blob: function () {}
    };
    const ctx = vm.createContext(sandbox);
    vm.runInContext(appScript, ctx, { filename: 'index.html<script>' });
    return { ctx, sandbox };
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------
// inputs: element values to set before calculateAll(). tier: cost tier toggle.
// assert: hard expectations (independent of golden.json) for externally
// verified reference points — e.g. the 7/9/26 rate-email worked examples.
const SCENARIOS = [
    {
        name: 'signs-bollard-6 (email worked example)',
        inputs: { sg_bollard: 6 },
        assert: s => [
            ['signs std hours', s.activities.signs.tiers.std.hours, 10.0],
            ['signs std days', s.activities.signs.tiers.std.days, 1]
        ]
    },
    {
        name: 'bollards-6 (email worked example)',
        inputs: { bo_qty: 6 },
        assert: s => [
            ['bollards std hours', s.activities.bollards.tiers.std.hours, 8.0],
            ['bollards std days', s.activities.bollards.tiers.std.days, 1]
        ]
    },
    { name: 'signs-post-6', inputs: { sg_post: 6 } },
    { name: 'signs-mixed-10post-4bollard', inputs: { sg_post: 10, sg_bollard: 4 } },
    { name: 'signs-prodSignPost-zero-guard', inputs: { sg_bollard: 6, prodSignPost: 0 },
      assert: s => [
          ['bollard signs not dropped when post rate is 0', s.activities.signs.tiers.std.hours, 10.0]
      ] },
    { name: 'crackfill-4000', inputs: { cf_lf: 4000 } },
    { name: 'crackfill-6000-2phase-travel1h', inputs: { cf_lf: 6000, cf_phases: 2, globalTravel: 1 } },
    { name: 'sealcoat-52000', inputs: { sc_sf: 52000 } },
    { name: 'asphalt-500sf-2s', inputs: { ar_sf: 500, asphaltPrice: 85 } },
    { name: 'asphalt-3000sf-2s4b-multiload', inputs: { ar_sf: 3000, asphaltPrice: 85, baseAsphaltPrice: 80 } },
    { name: 'asphalt-100sf-4s-depthmult', inputs: { ar_sf: 100, ar_depth: '4s', asphaltPrice: 85 } },
    { name: 'striping-mix', inputs: { st_4line: 8000, st_hc: 10, st_arrow: 6 } },
    { name: 'wheelstops-20new-10reset-10remove', inputs: { ws_new: 20, ws_reset: 10, ws_remove: 10 } },
    { name: 'mastic-1000lf', inputs: { ma_lf: 1000 } },
    { name: 'speedbumps-4', inputs: { sb_qty: 4 } },
    { name: 'speedhumps-3', inputs: { sh_qty: 3, asphaltPrice: 85 } },
    { name: 'inlet-2repair-1recon-1casting', inputs: { in_repair: 2, in_recon: 1, in_casting: 1 } },
    { name: 'paintremoval-2000lf', inputs: { pr_lf: 2000 } },
    { name: 'heavy-cluster-multiactivity', inputs: { ar_sf: 400, ws_new: 10, sg_bollard: 3, bo_qty: 2, asphaltPrice: 85 } },
    { name: 'signs-bollard-6-cons-tier', inputs: { sg_bollard: 6 }, tier: 'cons' },
    { name: 'signs-bollard-6-agg-tier', inputs: { sg_bollard: 6 }, tier: 'agg' }
];

// ---------------------------------------------------------------------------
// Snapshot extraction (rounded to domain-meaningful precision)
// ---------------------------------------------------------------------------
function extract(snap) {
    const out = { activities: {}, summary: {} };
    for (const [key, act] of Object.entries(snap.activities)) {
        if (!act || !act.enabled || !act.tiers) continue;
        const tiers = {};
        for (const t of ['cons', 'std', 'agg']) {
            tiers[t] = { hours: +act.tiers[t].hours.toFixed(1), days: act.tiers[t].days };
        }
        out.activities[key] = {
            tiers,
            total: +((act.costs && act.costs.total) || 0).toFixed(2),
            material: +((act.costs && act.costs.material) || 0).toFixed(2)
        };
    }
    const s = snap.summary;
    out.summary = {
        totalLabor: +s.totalLabor.toFixed(2),
        totalMat: +s.totalMat.toFixed(2),
        directCost: +s.directCost.toFixed(2),
        bidPrice: +s.bidPrice.toFixed(2)
    };
    return out;
}

function runScenario(sc) {
    const { ctx, sandbox } = makeContext();
    for (const [id, val] of Object.entries(sc.inputs)) {
        sandbox.document.getElementById(id).value = String(val);
    }
    if (sc.tier) vm.runInContext(`setCostTier('${sc.tier}')`, ctx);
    vm.runInContext('calculateAll()', ctx);
    const snap = sandbox.window.lastCalcSnapshot;
    if (!snap) throw new Error('calculateAll produced no snapshot');
    return extract(snap);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
function diffPaths(a, b, prefix = '') {
    // Returns list of "path: expected X, got Y" strings
    const diffs = [];
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    for (const k of keys) {
        const pa = a ? a[k] : undefined, pb = b ? b[k] : undefined;
        const p = prefix ? prefix + '.' + k : k;
        if (typeof pa === 'object' && pa !== null && typeof pb === 'object' && pb !== null) {
            diffs.push(...diffPaths(pa, pb, p));
        } else if (JSON.stringify(pa) !== JSON.stringify(pb)) {
            diffs.push(`  ${p}: golden ${JSON.stringify(pa)} → got ${JSON.stringify(pb)}`);
        }
    }
    return diffs;
}

const results = {};
let hardFailures = 0;

for (const sc of SCENARIOS) {
    let out;
    try {
        out = runScenario(sc);
    } catch (e) {
        console.error(`✗ ${sc.name} — threw: ${e.message}`);
        hardFailures++;
        continue;
    }
    results[sc.name] = out;

    // Hard assertions (externally verified reference values)
    if (sc.assert) {
        for (const [label, got, expected] of sc.assert(out)) {
            if (got !== expected) {
                console.error(`✗ ${sc.name} — ASSERT ${label}: expected ${expected}, got ${got}`);
                hardFailures++;
            }
        }
    }
}

if (UPDATE) {
    fs.writeFileSync(GOLDEN_PATH, JSON.stringify(results, null, 2) + '\n');
    console.log(`Baseline written: ${SCENARIOS.length} scenarios → tests/golden.json`);
    if (hardFailures > 0) {
        console.error(`\n${hardFailures} HARD ASSERTION FAILURE(S) — baseline written but reference values are wrong. Fix before trusting it.`);
        process.exit(1);
    }
    process.exit(0);
}

if (!fs.existsSync(GOLDEN_PATH)) {
    console.error('No tests/golden.json baseline. Run: node tests/run-tests.js --update');
    process.exit(2);
}
const golden = JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8'));

let pass = 0, fail = 0;
for (const sc of SCENARIOS) {
    if (!results[sc.name]) { fail++; continue; }  // threw above
    const diffs = diffPaths(golden[sc.name], results[sc.name]);
    if (diffs.length === 0) {
        console.log(`✓ ${sc.name}`);
        pass++;
    } else {
        console.error(`✗ ${sc.name} — output drifted from golden baseline:`);
        diffs.forEach(d => console.error(d));
        fail++;
    }
}
// Scenarios present in golden but no longer defined
for (const name of Object.keys(golden)) {
    if (!SCENARIOS.some(s => s.name === name)) {
        console.error(`✗ stale golden entry (scenario removed?): ${name}`);
        fail++;
    }
}

console.log(`\n${pass}/${SCENARIOS.length} scenarios match baseline` +
    (hardFailures ? ` | ${hardFailures} hard assertion failure(s)` : ''));
process.exit(fail + hardFailures > 0 ? 1 : 0);
