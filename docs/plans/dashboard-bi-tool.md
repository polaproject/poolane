# Plan: Dashboard BI Tool (mini-Metabase) — Phase 17

> Document phạm vi đầy đủ feature trước khi build. Build monolithic (không phase A/B/C). Commit nhiều lần trong quá trình build, release khi tất cả module xong.

---

## Context

Owner cần 1 tool BI tích hợp trong `/admin/dashboard` (tab "Báo cáo tuỳ chỉnh") để tự build pivot/chart như data analyst, mà không cần dev support. Hiện tại `/admin/reports` chỉ có Excel export cố định + reconciliation — không đủ linh hoạt khi owner muốn cắt data theo nhiều chiều.

**Thay thế gì:** Không thay thế `/admin/reports` — giữ song song.
**Phục vụ ai:** Chỉ admin (owner). Staff không thấy tab.

---

## 24 quyết định scope (đã chốt với owner)

| # | Quyết định | Lựa chọn |
|---|---|---|
| 1 | Mức tuỳ biến | Pivot builder linh hoạt |
| 2 | Output types | Cross-tab + Chart + Heatmap + KPI card |
| 3 | Real-time / cache | Real-time mỗi lần load |
| 4 | Persistence | Lưu DB cá nhân |
| 5 | Data source | Tất cả 44 bảng — data dictionary đầy đủ |
| 6 | Join policy | Free join + cảnh báo nếu 3+ bảng / không có FK |
| 7 | Calculated fields | Formula tự viết (parser) |
| 8 | Time | Range + compare period (MoM/YoY) |
| 9 | Approach | Build từ đầu trong app |
| 10 | Perf limit | Max 10s timeout |
| 11 | Drill-down | Full list + export Excel |
| 12 | Cross-filter | Yes (Tableau-style) |
| 13 | Export | Excel + PDF + CSV (no PNG) |
| 14 | Permission | Admin only |
| 15 | Quota | 10 dashboards/user |
| 16 | Format | Auto-detect + override per cell |
| 17 | Data dict | Mô tả + value examples (cho enum) |
| 18 | Schedule email | Không cần |
| 19 | Migration | Giữ `/admin/reports` song song |
| 20 | Live preview | Debounce 500ms |
| 21 | SQL editor | Không — chỉ visual builder |
| 22 | Slicer | Pivot-fixed + slicer top bar |
| 23 | Default | Home dashboard cố định |
| 24 | Seed | Trống — owner tự build |

---

## Database Schema (3 bảng mới)

```prisma
model Dashboard {
  id          String   @id @default(cuid())
  ownerId     String                          // FK users.id
  name        String                          // "Doanh thu Q1"
  description String?
  isHome      Boolean  @default(false)        // ⭐ home cho owner
  layout      Json                            // { widgets: [{id, x, y, w, h, widgetId}] }
  slicers     Json                            // [{ field, op, values }] — top bar filters
  timeRange   Json                            // { preset: '30d' | 'custom', from?, to?, compare? }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  widgets     DashboardWidget[]

  @@index([ownerId])
  @@unique([ownerId, name])
  @@map("dashboards")
}

model DashboardWidget {
  id          String   @id @default(cuid())
  dashboardId String
  dashboard   Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  title       String                          // "Doanh thu theo khoá"
  type        WidgetType                      // pivot/chart/heatmap/kpi
  config      Json                            // toàn bộ pivot config (xem WidgetConfig below)
  position    Json                            // { x, y, w, h } trong grid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([dashboardId])
  @@map("dashboard_widgets")
}

enum WidgetType {
  pivot    // bảng cross-tab
  chart    // bar/line/pie/area
  heatmap  // grid màu
  kpi      // số lớn + delta
}
```

**Lý do tách `Dashboard` + `DashboardWidget`:**
- Dashboard = container (layout + global slicers + time range)
- Widget = unit chứa pivot config riêng + position
- Cross-filter: 1 widget click → emit event → các widget cùng dashboard apply filter mới

---

## File Structure

```
src/
├── app/
│   ├── (dashboard)/admin/dashboard/
│   │   ├── page.tsx                    # Tab gốc — list dashboards + Home
│   │   ├── [id]/page.tsx               # View 1 dashboard
│   │   ├── [id]/edit/page.tsx          # Edit layout
│   │   └── new/page.tsx                # Tạo mới
│   └── api/admin/dashboards/
│       ├── route.ts                    # GET list / POST create
│       ├── [id]/route.ts               # GET / PATCH / DELETE
│       ├── [id]/widgets/route.ts       # POST add widget
│       ├── [id]/widgets/[wid]/route.ts # PATCH / DELETE
│       ├── query/route.ts              # POST { config } → execute pivot
│       └── export/route.ts             # POST → Excel/PDF/CSV blob
├── components/dashboard/
│   ├── DashboardGrid.tsx               # react-grid-layout wrapper
│   ├── DashboardSlicerBar.tsx          # Top bar filters
│   ├── DashboardTimeControl.tsx        # Preset + custom range + compare
│   ├── widgets/
│   │   ├── PivotTableWidget.tsx
│   │   ├── ChartWidget.tsx             # Recharts bar/line/pie/area
│   │   ├── HeatmapWidget.tsx
│   │   └── KpiCardWidget.tsx
│   ├── builder/
│   │   ├── WidgetBuilder.tsx           # Modal mở khi click "Thêm widget"
│   │   ├── FieldPicker.tsx             # Tree 44 bảng × cột
│   │   ├── JoinSelector.tsx            # Add joined tables + warn
│   │   ├── FilterBuilder.tsx           # WHERE clauses (operator + value)
│   │   ├── FormulaEditor.tsx           # Calculated field input
│   │   ├── AggregationPicker.tsx       # SUM/COUNT/AVG/...
│   │   └── PreviewPane.tsx             # Live preview với debounce 500ms
│   └── drilldown/
│       ├── DrilldownPanel.tsx          # Right slide panel khi click cell
│       └── DrilldownExport.tsx         # Export records ra Excel
└── lib/dashboard/
    ├── schema-registry.ts              # Liệt kê 44 bảng + cột + relation map
    ├── data-dictionary.ts              # Mô tả VN + value examples cho từng cột
    ├── query-builder.ts                # Build Prisma query từ pivot config
    ├── formula-parser.ts               # Parse calculated field (expr-eval wrapper)
    ├── safety.ts                       # Timeout, row limit, join warning
    ├── format.ts                       # Auto-format số (VND/percent/decimal)
    └── types.ts                        # WidgetConfig type
```

---

## Core Types

```typescript
// src/lib/dashboard/types.ts
export type AggregationOp = 'sum' | 'count' | 'count_distinct' | 'avg' | 'min' | 'max'
export type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between' | 'contains' | 'is_null' | 'not_null'
export type ChartSubtype = 'bar' | 'line' | 'pie' | 'area' | 'stacked_bar'

export interface PivotField {
  table: string                          // 'students'
  column: string                         // 'status'
  alias?: string                         // display name override
  dateGranularity?: 'day' | 'week' | 'month' | 'quarter' | 'year'  // chỉ nếu column là date
}

export interface PivotValue extends PivotField {
  agg: AggregationOp
  formatOverride?: ColumnFormat          // null = auto
}

export interface PivotFilter {
  field: PivotField
  op: FilterOp
  value: string | number | string[] | number[] | null
}

export interface PivotJoin {
  fromTable: string
  toTable: string
  type: 'inner' | 'left'
  on: Array<{ from: string; to: string }>  // [{ from: 'student_id', to: 'id' }]
}

export interface CalculatedField {
  alias: string
  formula: string                        // '(revenue - refund) / count_students'
}

export interface WidgetConfig {
  rootTable: string
  joins: PivotJoin[]
  rows: PivotField[]                     // dimensions ở row
  columns: PivotField[]                  // dimensions ở column
  values: PivotValue[]
  calculatedFields: CalculatedField[]
  filters: PivotFilter[]
  sort: Array<{ field: string; dir: 'asc' | 'desc' }>
  topN?: number                          // limit rows
  visualization: {
    type: 'pivot' | 'chart' | 'heatmap' | 'kpi'
    chartSubtype?: ChartSubtype
    kpiCompare?: 'mom' | 'yoy' | 'prev_period'
  }
}

export interface ColumnFormat {
  type: 'number' | 'currency' | 'percent' | 'date' | 'text'
  decimals?: number
  prefix?: string
  suffix?: string
  thousandSeparator?: '.' | ','
}
```

---

## Schema Registry & Data Dictionary

`schema-registry.ts` xuất 1 const tổng hợp 44 bảng + relations. Auto-generate từ Prisma schema (script `scripts/gen-schema-registry.mjs`):

```typescript
export interface TableMeta {
  name: string                  // 'students'
  vietnameseName: string        // 'Học viên'
  category: 'core' | 'finance' | 'content' | 'ops'
  columns: ColumnMeta[]
  relations: RelationMeta[]
  rowCountEstimate?: number     // gen lúc deploy, dùng để cảnh báo big-table joins
}

export interface ColumnMeta {
  name: string                  // 'status'
  vietnameseName: string        // 'Trạng thái'
  type: 'string' | 'number' | 'date' | 'enum' | 'boolean' | 'json'
  enumValues?: Array<{ value: string; label: string }>  // cho status field
  description: string           // 'Trạng thái học viên: prospect (tiềm năng), enrolled (đã đặt cọc)...'
  isPII?: boolean               // ẩn cho non-admin (giờ admin-only nên không quan trọng)
  defaultAggregation?: AggregationOp  // 'amount' → sum, 'id' → count
  defaultFormat?: ColumnFormat
}
```

`data-dictionary.ts` chứa file `.json` ~400 entries (~40 bảng × ~10 cột). Owner edit qua UI sau (Phase 18) hoặc PR.

**Effort:** ~2 ngày seed data dictionary VN (manual).

---

## Query Builder Strategy

`query-builder.ts` không sinh raw SQL — dùng Prisma `$queryRaw` an toàn với template literals **HOẶC** dùng Prisma model client cho 1-table queries.

**Quy trình build query:**
1. Validate config (zod) — reject malformed
2. Resolve join graph (BFS từ rootTable, max depth 3)
3. Build WHERE clause từ filters + slicer + time range
4. Build SELECT (columns = rows + columns + values), GROUP BY (rows + columns)
5. Apply ORDER BY + LIMIT (default 10000 rows)
6. Execute với `SET statement_timeout = 10000` (Postgres-level timeout)
7. Trả về cube data → frontend xoay thành pivot

```sql
-- Ví dụ output cho config { rows: [course.code], columns: [time_month], values: [SUM(amount)] }
SET statement_timeout = 10000;
SELECT
  c.code AS row_0,
  date_trunc('month', p.recorded_at) AS col_0,
  SUM(p.amount) AS val_0
FROM payments p
INNER JOIN enrollments e ON e.id = p.reference_id  -- pre-defined join graph
INNER JOIN courses c ON c.id = e.course_id
WHERE p.type = 'course_fee'
  AND p.recorded_at >= $1
  AND p.recorded_at < $2
GROUP BY 1, 2
ORDER BY 1, 2
LIMIT 10000;
```

**Safety:**
- `safety.ts` enforce: max 3 joins, max 10k rows, statement_timeout 10s, parameterized values (zero raw SQL injection)
- Warn UI nếu config sẽ vượt limits (estimate trước khi run)
- Cancel button cho user huỷ query đang chạy

---

## Formula Parser

Sử dụng [`expr-eval`](https://github.com/silentmatt/expr-eval) — đã được audit, 60kb gzipped.

```typescript
import { Parser } from 'expr-eval'

const parser = new Parser({
  operators: { add: true, subtract: true, multiply: true, divide: true }
})

// Whitelist: chỉ cho phép alias của PivotValue + literal số
const expr = parser.parse('(revenue - refund) / count_students')
const result = expr.evaluate({ revenue: 100000, refund: 5000, count_students: 50 })
// → 1900
```

**Safety:** Reject formula có function call ngoại trừ basic Math (abs, round, etc.).

---

## Frontend Build Flow

### Tab `/admin/dashboard` (sub-route hoặc tab cùng page)

```
┌──────────────────────────────────────────────────┐
│  Bảng điều khiển  AI  Heatmap kỹ năng  …        │
│  ───────────────────────────────────────         │
│  [Tab: Tổng quan] [Tab: Báo cáo tuỳ chỉnh ⭐]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  📊 Home Dashboard "Doanh thu Q1"                │
│  ┌─────────────────────────────────────────┐    │
│  │ Slicer: [Khoá: tất cả] [Status: active] │    │
│  │ Time:   [30 ngày qua ▼] [So sánh: MoM]  │    │
│  └─────────────────────────────────────────┘    │
│  ┌────────────┐ ┌──────────────────────────┐    │
│  │ KPI lớn    │ │ Bar chart doanh thu/khoá │    │
│  │ 142M VND   │ │ ▇▇▇▇▆▅▄▃                 │    │
│  │ +12% MoM   │ │                          │    │
│  └────────────┘ └──────────────────────────┘    │
│  ┌──────────────────────────────────────────┐   │
│  │ Pivot table (HV × Tháng × Doanh thu)     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  [+ Thêm widget]  [Lưu]  [Đặt làm Home]         │
└──────────────────────────────────────────────────┘
```

### Builder Modal (khi bấm "Thêm widget")

```
┌──────────────────────────────────────────────────┐
│  Cấu hình widget                            [X]  │
├──────────────────────────────────────────────────┤
│  TÊN:    [Doanh thu theo khoá           ]        │
│  LOẠI:   [Pivot ▼] [Chart] [Heatmap] [KPI]      │
│                                                  │
│  ┌─────────────────┬────────────────────────┐   │
│  │ FIELD PICKER    │  CẤU HÌNH PIVOT         │   │
│  │ ─────────────── │  ─────────────────────  │   │
│  │ 🔍 Tìm field    │  ROWS:                  │   │
│  │                 │   • courses.code  [×]   │   │
│  │ ▼ 📋 Học viên   │                         │   │
│  │   • full_name   │  COLUMNS:               │   │
│  │   • status      │   • [+ Thêm]            │   │
│  │   • dob         │                         │   │
│  │ ▼ 💰 Tài chính  │  VALUES:                │   │
│  │   • amount      │   • SUM(amount) [×]     │   │
│  │   • type        │                         │   │
│  │ ...             │  FILTERS:               │   │
│  │                 │   • type = course_fee   │   │
│  │ (kéo-thả        │                         │   │
│  │  vào pane phải) │  FORMULA: [...]         │   │
│  └─────────────────┴────────────────────────┘   │
│                                                  │
│  ┌──────────────── PREVIEW ──────────────────┐  │
│  │  (live render với debounce 500ms)         │  │
│  │  ECH | 32.000.000đ                        │  │
│  │  SAI | 41.000.000đ                        │  │
│  │  BUOM| 69.000.000đ                        │  │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [Huỷ]                  [Lưu widget]            │
└──────────────────────────────────────────────────┘
```

---

## Cross-Filter Implementation

1. Mỗi widget render với `onCellClick(cellContext)` callback
2. Cell click → emit `{ field, value }` qua React Context provider `<DashboardCrossFilter>`
3. Provider state: `activeFilter: { field, value } | null`
4. Tất cả widget subscribe → khi `activeFilter` thay đổi, refetch với extra WHERE
5. UI: highlight cell đang là filter source + nút clear ở top bar

---

## Drill-down

1. Click cell value số → `onValueClick(rowFilter, colFilter, valueField)`
2. Right slide panel mở (Sheet component) — query records thực:
   ```sql
   SELECT * FROM <table>
   WHERE <rowFilter> AND <colFilter> AND <originalFilters>
   ORDER BY <pk> DESC
   LIMIT 1000;
   ```
3. Table render danh sách + button "Export Excel" → `/api/admin/dashboards/export` với mode `drilldown`

---

## Export Strategy

**Excel:** library [`exceljs`](https://github.com/exceljs/exceljs) (đã có sẵn trong project). Format giữ formatting (VND symbol, %, etc.).

**CSV:** built-in — Buffer + escape.

**PDF:** library [`jspdf`](https://github.com/parallax/jsPDF) + `html2canvas` cho dashboard snapshot. Build dashboard PDF = capture DOM thành image rồi paste vào PDF page. Bao gồm title + slicer state + timestamp.

---

## Performance Plan

| Issue | Mitigation |
|---|---|
| Free join risk runaway query | Pre-defined join graph (~30 connections). Owner pick from list. Warn nếu 3+ tables. |
| Big tables (audit_log có thể 100k+ rows) | Time range filter bắt buộc nếu join audit/notification/error_logs. Default 30 days. |
| Concurrent dashboards mỗi load 5 widgets | Parallel `Promise.all` queries trong 1 dashboard. Mỗi widget timeout độc lập. |
| Slow first load với 44 bảng dictionary | Pre-compute schema-registry.json lúc build (deploy time), không query Prisma metadata realtime. |
| Owner type formula sai → server crash | Client validate trước khi send (expr-eval parse). Server re-validate. |
| Cross-filter trigger 5 widgets refetch | Debounce 200ms. Cancel pending requests khi filter đổi tiếp. |

---

## Format Settings (global + per-widget)

**Global** — extend `SettingsMap` trong `src/lib/settings.ts`:
```typescript
'format.amount_style':      'vn_full' | 'vn_compact' | 'no_symbol' | 'us'  // default 'vn_full'
'format.percent_decimals':  0 | 1 | 2                                       // default 1
'format.thousand_separator': '.' | ','                                      // default '.'
```

Tab mới `/admin/settings` "Format" hiển thị 3 dropdown.

**Per-widget override** — trong `WidgetConfig.values[].formatOverride` (đã có trong types). Builder modal có expandable "Tuỳ chỉnh định dạng" hiển thị 3 dropdown giống global, với option "Theo mặc định toàn hệ thống" (= null).

`format.ts` helper: `formatValue(value, columnMeta, overrideFormat?, globalSettings)` — apply override > columnMeta default > globalSettings.

## Effort Estimate (monolithic)

| Module | Effort | Notes |
|---|---|---|
| Schema + types + migration | 1 ngày | Prisma model + types.ts |
| Schema registry auto-gen script | 2 ngày | Parse Prisma schema, build registry |
| Data dictionary VN (40 bảng) | 2 ngày | Manual content |
| Format settings tab + global config | 1 ngày | Extend Settings module |
| Query builder + safety | 4 ngày | Complex — join graph, WHERE, GROUP BY |
| Formula parser | 1 ngày | expr-eval wrapper + validation |
| Field picker UI | 2 ngày | Tree, search, drag-drop |
| Filter builder UI | 2 ngày | Operator-aware inputs |
| Widget builder modal | 3 ngày | Tabs (rows/cols/values/filters/formula) |
| 4 widget renderers | 4 ngày | Pivot table + Chart + Heatmap + KPI card |
| Live preview + debounce | 1 ngày | Query state hook |
| Dashboard grid (react-grid-layout) | 2 ngày | Resize/drag widgets |
| Slicer bar + time control | 2 ngày | Top bar UI + state sync |
| Cross-filter provider | 2 ngày | Context + propagate filter |
| Drill-down panel | 2 ngày | Sheet + records query + export |
| Export Excel/CSV | 1 ngày | ExcelJS streaming |
| Export PDF | 2 ngày | html2canvas + jspdf |
| Home dashboard logic | 1 ngày | isHome flag + redirect |
| Save/load/list/delete | 1 ngày | CRUD API + UI |
| Testing + polish | 3 ngày | Edge cases, perf check |
| **TỔNG** | **~39 ngày** | ~5-6 tuần full-time |

---

## Dependencies Cần Cài Thêm

```bash
npm install react-grid-layout react-resizable expr-eval jspdf html2canvas
npm install -D @types/react-grid-layout
```

`exceljs` đã có. `recharts` đã có.

---

## Verification Plan

1. **Schema migration** — `prisma migrate dev --name add_dashboards`
2. **Smoke test data dictionary** — vào `/admin/dashboard` → click "Thêm widget" → field picker hiện đủ 44 bảng + tooltip mô tả VN
3. **Build pivot đơn giản** — Doanh thu × khoá → save → reload → vẫn hiển thị đúng
4. **Build pivot phức tạp** — HV (status) × Tháng × COUNT(DISTINCT student_id) với formula → verify số đúng so với raw SQL
5. **Cross-filter** — Click bar "Tháng 3" → các widget khác filter về tháng 3 → clear filter → reset
6. **Drill-down** — Click cell "ECH × Tháng 3 = 32M" → panel hiện ~10 records payments → export Excel
7. **Performance** — Build pivot full 44 bảng × 3 joins → đo response time → phải < 10s hoặc cancel
8. **Export 3 format** — cùng 1 dashboard → Excel/CSV/PDF đều hợp lệ
9. **Home dashboard** — set 1 dashboard làm Home → vào tab → mặc định load dashboard này
10. **Quota 10 dashboards** — tạo dashboard thứ 11 → reject với error rõ ràng

---

## Risks & Open Questions

| Risk | Probability | Mitigation |
|---|---|---|
| Owner gặp khó khăn UX với free join | High | Phase 1 chỉ enable join cho 5-10 cặp bảng phổ biến, mở rộng dần |
| Query 10s timeout không đủ cho audit_log full scan | Medium | Auto suggest time range narrow nếu query có audit_log |
| Data dictionary VN tốn nhiều thời gian | Medium | Seed 10 bảng quan trọng nhất trước, lazy fill khi user pick field chưa có dict |
| Export PDF chậm với dashboard nhiều widget | Low | Lazy render — chỉ capture sau khi all widgets settled |
| Mobile responsive | Low | Phase 17 chỉ desktop. Mobile placeholder "Vào desktop để xem báo cáo". |

**4 câu hỏi mở đã chốt (2026-05-16):**
1. **Amount format** → configurable. Global default + per-widget override. Options: `1.300.000đ` (Vietnamese full), `1,3M` (compact), `1.300.000` (no symbol), `$1,300,000` (US). Lưu trong `SettingsMap` key `format.amount`.
2. **Percent decimals** → configurable. Global default + per-widget override. Options: 0 / 1 / 2 decimal places. Lưu key `format.percent_decimals`.
3. **Compare period** → configurable. Per-widget chọn: `prev_period` (7 ngày trước đó nếu range = 7 ngày qua), `mom` (cùng tháng trước), `yoy` (cùng năm trước), `custom` (offset N ngày). Default = prev_period.
4. **Filter "in"** → **lai**: field có `enumValues` trong data dictionary → checkbox multi-select dropdown; field text/number → free-text comma input. Auto-detect dựa trên ColumnMeta.

---

## Migration Strategy

`/admin/reports` giữ nguyên. Khi dashboard launch:
- Tab "Báo cáo tuỳ chỉnh" xuất hiện trong `/admin/dashboard`
- Link "Báo cáo cũ" vẫn ở sidebar (`Tài chính > Báo cáo & Đối chiếu`)
- Sau 2-3 tháng: nếu owner không dùng `/admin/reports` nữa → có thể hide

---

## Timeline (commit thường xuyên, release cuối)

| Tuần | Output |
|---|---|
| 1 | Schema + types + registry + data dictionary 10 bảng đầu |
| 2 | Query builder + formula parser + safety |
| 3 | Field picker + filter builder + widget builder UI |
| 4 | 4 widget renderers + live preview |
| 5 | Grid layout + slicer + cross-filter + drill-down |
| 6 | Export Excel/CSV/PDF + Home dashboard + save/load + polish |

---

**Owner duyệt plan này → bắt đầu build.**
