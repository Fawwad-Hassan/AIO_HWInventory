# Purchasing → Recurring Cost Tracking & Budget Planner

Reference plan for using InvenTree's Purchasing module to track recurring
consumable purchases and build toward a monthly budget tracker/planner.

## Goal

Replace the current "new spreadsheet every month" habit with structured Purchase
Orders in InvenTree that remember prices, build a per-item cost history, and feed
a custom monthly **budget tracker/planner**.

## What InvenTree Purchasing gives us out of the box

**Building blocks (one-time setup):**
1. **Suppliers** — each vendor becomes a *Supplier* (a company marked "is supplier").
2. **Supplier Parts** — each recurring consumable (tape, degreaser, PCB alcohol,
   tweezers, …) is a *Part*, linked to a *Supplier Part* that holds its **SKU and
   price** (plus optional quantity price-breaks). Set the price once, reuse it.
3. **Purchase Orders (POs)** — each ordering cycle is a *Purchase Order*: choose the
   supplier, add items + quantities, and it **auto-totals the cost** (with currency
   handling).

**Monthly workflow:**
- Keep one **"template" PO** with the standard recurring list, parked in
  Pending/On-Hold.
- Each cycle: **Duplicate** it (copies the whole list) → adjust quantities → place →
  receive. This replaces making a new file, with prices pre-filled.
- The **Low Stock tab** (already built) shows which consumables are below their
  minimum, i.e. what to reorder.

**Cost tracking we get for free:**
- **Total cost per order**, auto-calculated.
- **Per-item purchase price history** with a built-in **unit-price-over-time chart**
  (Part → Pricing → Purchase History) — see how each item's cost drifts.
- A **calendar view** of POs, plus filterable tables of orders / suppliers /
  supplier parts.

## The gap → custom Budget Tracker (to be built)

InvenTree has **no** budget concept, **no** monthly spend rollups, and **no**
spend-by-supplier/category dashboard. To reach the goal we'll build a custom
**Purchasing / Budget** page (same approach as the Low Stock tab) that adds:
- **Spend this month vs. budget**, with a visual gauge and over-budget highlighting.
- **Spend by month** (trend), **by supplier**, and **by category**
  (e.g. PCB consumables vs. general lab).
- A **recurring-order planner**: standard list × expected quantities × current
  prices = projected monthly cost, to plan before ordering.
- Optional **budget targets** (overall monthly cap and/or per-category caps).

## Historical data → trends + budgets

When the past purchase data is provided, the plan is to:
1. **Load / analyze** it to establish the real **baseline monthly spend**.
2. **Identify trends**: recurring items, average/rising costs, seasonal spikes, and
   which few items drive most of the spend.
3. **Set sensible budget targets** for the tracker (data-driven, not guessed).

## Phased plan

1. **Setup (can start now):** create suppliers + supplier-parts for the top
   recurring consumables, and a "template" PO. Begin logging real orders.
2. **Analyze:** user provides historical purchase data → trend analysis + proposed
   budget targets.
3. **Build:** custom Budget/Purchasing dashboard, informed by the analysis.

## Open decisions (deferred — the data will help answer)

- Budget granularity: one overall monthly number, per **category** (PCB vs lab),
  per **supplier**, or a mix?
- Period: monthly only, or also quarterly/annual?

## Where this sits in the overall project

- Comes after the current round of modifications.
- The **full UI overhaul** (modernised, cleaner visual redesign) happens **after all
  functional modifications** and **before the final data migration**.
- The budget tracker is a functional feature; it can be built before the UI overhaul
  and then restyled as part of it.

---

## Historical purchase analysis (Feb–May 2026, from `Book 3.xlsx`)

Source: 4 sheets — an initial setup sheet ("Sheet1", ~Feb 2026, four vendor blocks
side-by-side) plus monthly sheets for March, April, May 2026 (each in a different
ad-hoc format — the "new file every month" problem). No history before Feb 2026.
Currency: mostly PKR, some RMB (rate used: **1 RMB = 40.98 PKR**).

### Spend by period (PKR)
| Period | Spend | Nature |
|---|---|---|
| Feb (setup) | **~446,000** (≈139k local PKR + ~7,500 RMB ≈ 307k imported tools) | One-time capital |
| March 2026 | ~18,000 | Small repair consumables |
| April 2026 | ~82,000 | Heavy Mechanical-Lab tooling + a resin/filament price list (not actual buys) |
| May 2026 | ~62,000 | Consumable-heavy (batteries, degreaser, alcohol) + ID/PCB materials |

**Key insight:** spend to date is dominated by **one-time lab setup** (imported tools,
power supplies, drills/press/clamps, instruments, 3D-printer materials). The **recurring
consumables** are a smaller, steady core underneath — these are what the monthly
budget should target. Capital is lumpy and better handled as a project/quarterly pool.

### Recurring consumables identified (the budget targets)
Alcohol / IPA / contact cleaner / flux (every period), **batteries (AA/AAA/9V — big
line)**, degreasers, precision blades / exacto knives, tweezers, antistatic gloves,
glue sticks, jumper wire, PCB etchant (FeCl3), storage boxes (semi-recurring).
The Sheet1 **"Digi Log" block is effectively a recurring-consumables order** and is a
good basis for the recurring "template" PO.

### Cost trends (Feb → May)
| Item | Feb unit | May unit | Change |
|---|---|---|---|
| AA cell | 35 | 60 | +71% |
| 9V battery | 300 | 500 | +67% |
| AAA cell | 30 | 40 | +33% |
| Universal Degreaser | 750 | 750 | flat |

Batteries are both a large recurring line and rising fast — a prime watch item
(candidate for bulk buying).

### Data cleanup needed before load
- Standardise **item names** (many wording variants for the same thing).
- Standardise **department tags** (`LAB`/`Lab`/`lab`, `Mechanical Lab`, `ID`, combos)
  into a clean set → InvenTree **project codes**.
- Drop **quantity-0 price-list rows** (April resins/filaments) → these become supplier
  part prices, not spend.
- Separate **recurring consumables** from **one-time capital** (part categories).
- Handle **PKR vs RMB** (base = PKR; RMB orders convert at 40.98).

### Rough budget baseline
- **Recurring consumables:** ~25,000–35,000 PKR/month (batteries the main swing).
- **Capital/setup:** highly variable (Feb ~446k, April ~60k tooling) → budget as a
  quarterly/project pool, not a flat monthly line.
