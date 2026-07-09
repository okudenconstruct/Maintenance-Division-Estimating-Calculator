# Regression Tests

Golden-master tests for the calculation engine. The runner extracts the
`<script>` block from the **shipped** `index.html`, executes it in a sandboxed
Node context with a stub DOM (input defaults parsed from the same HTML), drives
`calculateAll()` through 21 scenarios covering all 12 work types, and compares
tier hours/days, activity totals, and summary costs against `golden.json`.

No dependencies, no build step, and the app stays a single file.

## Usage

```
node tests/run-tests.js            # verify — exits 1 if any output drifted
node tests/run-tests.js --update   # re-baseline golden.json after an INTENTIONAL change
```

Run before every commit that touches `index.html`.

## When a test fails

- **Unintentional change** (refactor, bug fix that shouldn't move numbers):
  the diff printed is the regression — fix the code.
- **Intentional recalibration** (production rates, material prices, formula
  change): run `--update` and commit the `golden.json` diff alongside the code
  change. That diff is the audit trail of exactly how estimates moved.

## Hard assertions

Two scenarios carry hard-coded expectations independent of the baseline,
locked to the worked examples from the 7/9/2026 sign-installation rate email
(Darrell Bishop): 6 bollards = 8.0h, 6 bollards + 6 signs = 10.0h. These fail
even under `--update` if violated — they are calibration ground truth, not
baseline data.
