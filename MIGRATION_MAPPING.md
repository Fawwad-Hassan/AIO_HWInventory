# InvenTree Customisation & Data Migration Mapping

Living document tracking every change made to this InvenTree copy and how the
**old** exported data maps into the **modified** system. Keep this updated as
each phase lands, so the final data migration is smooth and repeatable.

Branch: `my-customizations`

---

## Reference data

- **Old system export** (source of truth for migration):
  `InvenTree_StockItem_2026-07-01_elTeucn.xlsx` — a single flat sheet, 10 columns.
- **Target shape** (layout reference only, not exact): `Lab Inventory.xlsx` —
  one sheet per asset group, tidy per-group columns.

### Old export columns (10)
`Quantity`, `Serial Number`, `Status`, `Updated`, `Part IPN`, `Part Name`,
`Part Description`, `Location Name`, `Location Path`, `Asset Classification`.

---

## Column mapping (old export → modified InvenTree)

| Old column | Target column | InvenTree source | Status |
|---|---|---|---|
| Part Name | Asset Name | `Part.name` | ✅ exists |
| Part IPN | Asset ID | `Part.IPN` | ✅ exists |
| Serial Number | Serial Number | `StockItem.serial` | ✅ exists |
| Quantity | Quantity | `StockItem.quantity` | ✅ exists |
| Part Description | Part Description | `Part.description` | ✅ exists |
| Status | Status | `StockItem.status` (text) | ✅ exists |
| Location Name | Location Name | `StockLocation.name` | ✅ exists |
| Location Path | Location Path | `StockLocation.pathstring` | ✅ exists |
| Updated | Updated | `StockItem.updated` | ✅ exists |
| Asset Classification | Asset Classification | `Part.asset_classification` (choices High/Medium/Low) | ✅ Phase 2 |
| *(sheet grouping / Asset Type)* | Asset Type / sheet | `Part.category` (`PartCategory`) | ✅ Phase 1 (added to export) |
| *(none)* | Owner | `Part.asset_owner` (free text) | ✅ Phase 2 |
| Assigned To | Assigned To | `Part.responsible_owner` (existing FK, renamed) | ✅ Phase 2 |
| *(none)* | Manufacturer | `Company` (manufacturer) — not populated in old data | ⏳ later / optional |

---

## Phase log

### Phase 1 — Sheet-wise stock exporter ✅ (implemented)

**No database changes.** New export option only.

New/changed code (all on `my-customizations`):
- `src/backend/InvenTree/plugin/builtin/exporter/stock_category_exporter.py` — new
  export plugin `StockCategoryExporter`, slug `inventree-stock-category-exporter`.
  Groups stock into one sheet per `Part.category` and emits a **curated column
  set** (Asset Name, Asset ID, Serial Number/Quantity, Asset Type, Part
  Description, Status, Location Name, Location Path, Updated) instead of every
  internal field.
- `src/backend/InvenTree/stock/exporter_helpers.py` — `build_category_workbook()`,
  builds the multi-sheet xlsx (`tablib.Databook`), prunes Serial-Number vs
  Quantity per sheet, sanitises sheet names.
- `src/backend/InvenTree/stock/serializers.py` — `StockItemSerializer.export_to_file()`
  override; multi-sheet only when this plugin + xlsx, else unchanged single-sheet.
- `src/backend/InvenTree/plugin/builtin/exporter/test_stock_category_exporter.py` — test.

Behaviour: in the app, **Stock → Export → "Stock Category Exporter" + Excel**
produces one worksheet per category. Serialized categories show *Serial Number*;
bulk categories show *Quantity*. Null-category items go to an "Uncategorized" sheet.

### Phase 2 — New fields (Owner, Asset Classification) + rename ✅ (implemented)

All three attributes live on the **Part** model (migration `part/0151_part_asset_classification_part_asset_owner_and_more.py`):

| New/changed field | Model field | Type | Notes |
|---|---|---|---|
| Asset Classification | `Part.asset_classification` | CharField, choices | Fixed dropdown; stored values **`High` / `Medium` / `Low`** (value == label, matches old data exactly). blank/null allowed. |
| Owner | `Part.asset_owner` | CharField (free text, max 100) | Named `asset_owner` to avoid clashing with the built-in `StockItem.owner`. UI label "Owner". |
| Assigned To | `Part.responsible_owner` (existing) | FK → users Owner (user/group) | Renamed label only: verbose_name + serializer field label + UI → **"Assigned To"**. Data/field name unchanged. |

Surfaced in: PartSerializer + PartBriefSerializer (so stock `part_detail` carries them); the Add/Edit Part form (`usePartFields`); Part table; Stock table (via `part_detail.*`); Part detail page; and the stock category exporter columns.

**Migration data notes:** old export's `Asset Classification` (`High`/`Medium`/`Low`/blank) maps 1:1 into `Part.asset_classification`. Owner values load into `Part.asset_owner` as free text.

### Phase 3 — Simplified "Add Part" popup ⏳ (pending)

Record here: which sections/fields were removed or hidden, and which new Phase 2
fields were added to the create/edit form.

---

## Data-load notes (for the final migration)

- **Categories must exist first.** Sheets/grouping rely on `Part.category`; create
  the category tree before importing parts.
- **Serialized vs bulk.** Rows with a Serial Number → serialized `StockItem`
  (quantity 1, part must be trackable). Rows with Quantity only → bulk stock.
- **Status.** Map old text values (`OK`, `Damaged`, `Attention needed`, `Rejected`)
  to InvenTree stock status codes.
- **Asset Classification.** Old values: `High` / `Medium` / `Low` / blank — carry
  into the Phase 2 field.
- **Unmapped in old data:** Owner, Assigned To, Manufacturer are empty in the old
  export; they'll be blank on import unless supplied separately.
- **Purchaseable flag.** Import **all** parts with `Part.purchaseable = False`
  (off). The owner will then manually turn on "Purchaseable" for the select few
  items that are actually re-purchased. Make sure the import does not set
  `purchaseable = true`, and that the `PART_PURCHASEABLE` default setting is off
  while importing so newly-created parts default to not-purchaseable.
