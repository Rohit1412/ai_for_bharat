

## Implementation Plan — Easy First, Hard Later

Based on the requirements document and current project state, here's the prioritized roadmap in 4 phases, ordered from easiest to hardest.

---

### Phase 1: Cleanup & Quick Wins (Easy)

1. **Remove legacy files** — Delete `Index.tsx` and `DashboardSidebar.tsx`, clean up any references
2. **Connect Dashboard metrics to DB** — Replace hardcoded metric cards with data from `climate_metrics` table (hooks already exist)
3. **Connect Analytics charts to DB** — Replace hardcoded chart data with `regional_data` and `climate_metrics` queries
4. **Admin role assignment UI** — Add role management dropdown in Settings so admins can assign roles without SQL
5. **Data export (CSV/JSON)** — Add export buttons to Action Plans, Stakeholders, Alerts, and Reports tables

---

### Phase 2: Core Feature Gaps (Medium)

6. **Stakeholder ↔ Action Plan linking** — Add a junction table and UI to associate stakeholders with action plans (R4 coordination)
7. **Audit logging** — Create an `audit_logs` table and trigger to track admin actions like plan edits, alert resolves, role changes (R7 transparency)
8. **Real-time dashboard updates** — Enable Realtime on `alerts` and `climate_metrics` tables for live-updating dashboard (R4, R5)
9. **Threshold-based alert automation** — Create a backend function that checks climate metrics against thresholds and auto-generates alerts with recommended actions (R6)
10. **Report PDF generation** — Edge function to compile current metrics/plans into a downloadable PDF report (R10 export)

---

### Phase 3: AI-Powered Features (Hard)

11. **Climate Scenario Modeling page** — New `/scenarios` page where users input interventions and get AI-generated impact projections using Lovable AI (R2)
12. **AI Strategy Generation** — Enhance Action Plans with an "AI Suggest" button that generates optimized intervention strategies with trade-off explanations (R3, R7)
13. **Natural language data queries** — Add an AI chat interface for querying climate data in plain English (R5)

---

### Phase 4: Advanced / Integration (Hardest)

14. **Interactive world map** — Add a map visualization to Global Overview with clickable regions and layered data (R5)
15. **REST API endpoints** — Edge functions exposing public API for external systems to push/pull climate data (R10)
16. **Multi-factor authentication** — Add MFA support for stakeholder accounts (R8)
17. **Collaboration features** — Comments and plan sharing between stakeholders (R5)

---

### Suggested Starting Point

I recommend starting with **Phase 1** (items 1–5) in a single implementation pass. These are all straightforward changes using existing infrastructure — no new tables, no AI, no complex logic. Shall I proceed?

