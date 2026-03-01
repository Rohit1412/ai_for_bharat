# ClimateAI Global Coordinator — Project Guide

## System Prompt / Project Identity

You are working on **ClimateAI Global Coordinator**, an AI-powered climate action coordination platform. It is a full-stack web app built with React + Vite + TypeScript on the frontend and Supabase on the backend. The app provides a command-center dashboard for monitoring global climate data, managing action plans, tracking alerts, coordinating stakeholders, and generating reports.

**Design aesthetic:** Dark theme, "command center" feel — emerald/teal primary palette, glass-morphism cards, JetBrains Mono for data, subtle glow effects. All colors use HSL CSS variables defined in `src/index.css` and referenced via Tailwind semantic tokens.

---

## Tech Stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Framework    | React 18 + TypeScript                                   |
| Build        | Vite                                                    |
| Styling      | Tailwind CSS + shadcn/ui + custom design tokens         |
| Routing      | react-router-dom v6                                     |
| State/Data   | TanStack React Query                                    |
| Charts       | Recharts                                                |
| Forms        | react-hook-form + zod                                   |
| Backend      | Supabase (PostgreSQL, Auth, Edge Functions)              |
| Auth         | Supabase Auth (email + password)                        |

---

## File Structure

```
├── public/                       # Static assets (favicon, robots.txt)
├── src/
│   ├── assets/                   # Generated/imported images (ES6 imports)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (button, card, dialog, etc.)
│   │   ├── AppLayout.tsx         # Shared layout: sidebar + header + <Outlet />
│   │   ├── ProtectedRoute.tsx    # Auth guard wrapper
│   │   ├── NavLink.tsx           # Active-aware NavLink wrapper
│   │   ├── MetricCard.tsx        # Dashboard metric display card
│   │   ├── EmissionsChart.tsx    # Area chart: emissions vs Paris target
│   │   ├── RegionalOverview.tsx  # Regional emissions bar breakdown
│   │   ├── ActionPlansTable.tsx  # Dashboard action plans summary table
│   │   ├── AlertsPanel.tsx       # Dashboard alerts summary panel
│   │   └── DashboardSidebar.tsx  # (Legacy — replaced by AppLayout sidebar)
│   ├── contexts/
│   │   └── AuthContext.tsx       # Auth provider: session, user, signOut
│   ├── hooks/
│   │   ├── useClimateData.ts    # All data hooks: metrics, plans, alerts, stakeholders, reports
│   │   ├── useProfile.ts        # User profile CRUD
│   │   ├── useUserRole.ts       # Role checking (admin/analyst/viewer)
│   │   ├── use-mobile.tsx       # Responsive breakpoint hook
│   │   └── use-toast.ts         # Toast notification hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts        # ⚠️ AUTO-GENERATED — never edit
│   │       └── types.ts         # ⚠️ AUTO-GENERATED — never edit
│   ├── lib/
│   │   └── utils.ts             # cn() classname merge utility
│   ├── pages/
│   │   ├── Dashboard.tsx        # Main dashboard (/)
│   │   ├── GlobalOverview.tsx   # Regional deep-dive (/global-overview)
│   │   ├── Analytics.tsx        # Charts & analysis (/analytics)
│   │   ├── ActionPlans.tsx      # CRUD action plans (/action-plans)
│   │   ├── Alerts.tsx           # Alert center (/alerts)
│   │   ├── Stakeholders.tsx     # Stakeholder directory (/stakeholders)
│   │   ├── Reports.tsx          # Report hub (/reports)
│   │   ├── SettingsPage.tsx     # Profile + admin panel (/settings)
│   │   ├── Login.tsx            # Auth page (/login)
│   │   ├── ResetPassword.tsx    # Password reset (/reset-password)
│   │   ├── Index.tsx            # (Legacy — replaced by Dashboard.tsx)
│   │   └── NotFound.tsx         # 404 page
│   ├── App.tsx                  # Root: providers, router, routes
│   ├── main.tsx                 # Entry point
│   └── index.css                # Design tokens, custom utilities, fonts
├── supabase/
│   ├── migrations/              # SQL migration files
│   └── config.toml              # ⚠️ AUTO-GENERATED — never edit
├── .project/
│   └── plan.md                  # Build plan / roadmap
├── claude.md                    # ← THIS FILE — project guide
├── status.md                    # Project status tracker
└── tailwind.config.ts           # Tailwind theme config with custom tokens
```

---

## Naming Conventions

| What               | Convention                        | Example                        |
| ------------------- | --------------------------------- | ------------------------------ |
| Pages               | PascalCase `.tsx`                 | `ActionPlans.tsx`              |
| Components          | PascalCase `.tsx`                 | `MetricCard.tsx`               |
| Hooks               | camelCase `use*.ts(x)`            | `useClimateData.ts`            |
| Contexts            | PascalCase `*Context.tsx`         | `AuthContext.tsx`              |
| UI primitives       | kebab-case (shadcn convention)    | `ui/alert-dialog.tsx`          |
| Database tables     | snake_case                        | `action_plans`, `user_roles`   |
| Database columns    | snake_case                        | `created_at`, `metric_type`    |
| CSS variables       | kebab-case with `--` prefix       | `--primary`, `--glow-warning`  |
| Routes              | kebab-case                        | `/action-plans`, `/global-overview` |
| Query keys          | kebab-case strings in arrays      | `["action-plans"]`             |

---

## Database Schema

| Table             | Purpose                                    | RLS                        |
| ----------------- | ------------------------------------------ | -------------------------- |
| `profiles`        | User info (name, org, avatar)              | Read: auth, Write: own     |
| `user_roles`      | Role assignments (admin/analyst/viewer)    | Read: auth, Write: admin   |
| `climate_metrics` | Climate measurement data                   | Read: auth, Write: admin   |
| `regional_data`   | Emissions by region                        | Read: auth, Write: admin   |
| `action_plans`    | Climate intervention plans                 | Read: auth, Write: admin   |
| `alerts`          | Early warning alerts                       | Read: auth, Write: admin   |
| `stakeholders`    | Stakeholder directory                      | Read: auth, Write: admin   |
| `reports`         | Generated reports                          | Read: auth, Write: admin   |

**Security function:** `has_role(user_id, role)` — SECURITY DEFINER, prevents RLS recursion.

---

## Route Map

| Route              | Page              | Auth Required | Admin Features |
| ------------------ | ----------------- | ------------- | -------------- |
| `/`                | Dashboard         | ✅            | —              |
| `/global-overview` | GlobalOverview    | ✅            | —              |
| `/analytics`       | Analytics         | ✅            | —              |
| `/action-plans`    | ActionPlans       | ✅            | CRUD           |
| `/alerts`          | Alerts            | ✅            | Resolve        |
| `/stakeholders`    | Stakeholders      | ✅            | Add/Delete     |
| `/reports`         | Reports           | ✅            | —              |
| `/settings`        | SettingsPage      | ✅            | User mgmt      |
| `/login`           | Login             | ❌            | —              |
| `/reset-password`  | ResetPassword     | ❌            | —              |

---

## Key Patterns

1. **Data fetching:** All via React Query hooks in `src/hooks/useClimateData.ts` — with fallback mock data in each page component.
2. **Auth guard:** `<ProtectedRoute>` wraps `<AppLayout>` which uses `<Outlet />` for nested routes.
3. **Admin checks:** `useUserRole().isAdmin` controls UI visibility of CRUD buttons; RLS enforces server-side.
4. **Design tokens:** All colors in `src/index.css` as HSL vars → referenced in Tailwind config → used via semantic classes (`bg-primary`, `text-muted-foreground`, etc.). Never use raw color values in components.
5. **Glass cards:** `.glass-card` utility class for the frosted-glass card effect used throughout.

---

## Files You Should NEVER Edit

- `src/integrations/supabase/client.ts` — auto-generated
- `src/integrations/supabase/types.ts` — auto-generated
- `supabase/config.toml` — auto-generated
- `.env` — auto-generated

---

## Adding New Features Checklist

1. Create page in `src/pages/NewFeature.tsx`
2. Add route in `src/App.tsx` inside the protected layout
3. Add nav item in `src/components/AppLayout.tsx` navItems array
4. If it needs data: add hook in `src/hooks/useClimateData.ts`
5. If it needs a new table: create migration in `supabase/migrations/`
6. If admin-only writes: use `has_role()` in RLS policies
