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
