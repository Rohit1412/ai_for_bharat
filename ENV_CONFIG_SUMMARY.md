# Environment Configuration & Auth Bypass Changes

## Summary

This document summarizes the changes made to support:
1. Environment-based configuration for all secrets
2. Optional authentication (skip auth feature)
3. Database service abstraction layer

---

## Files Changed

### 1. Environment Variables (`.env`)

**New variables:**
```bash
# PostgreSQL Database Connection (Direct)
VITE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.cjbzcsccdfhjzinyejez.supabase.co:5432/postgres

# AI API Keys
VITE_GEMINI_API_KEY=

# Optional: Database provider configuration
# VITE_DB_PROVIDER=supabase  # Options: 'supabase', 'api', 'mock'
# VITE_API_BASE_URL=         # When using 'api' provider
```

**Legacy variables (kept commented for reference but not used):**
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

---

### 2. Type Declarations (`src/vite-env.d.ts`)

Added TypeScript declarations for environment variables:
- `VITE_DATABASE_URL`
- `VITE_DB_PROVIDER`
- `VITE_API_BASE_URL`
- `VITE_GEMINI_API_KEY`

---

### 3. Authentication Context (`src/contexts/AuthContext.tsx`)

**Changes:**
- Added `skipAuth()` function to bypass authentication
- Added `isSkippedAuth` boolean to track demo mode
- Mock user/session created for demo mode
- Demo mode persisted in `localStorage` with key `climateai_skip_auth`

**New exports:**
- `isAuthSkipped()` - Helper to check if auth was skipped
- `skipAuth()` - Function to enter demo mode
- `isSkippedAuth` - Boolean state in context

---

### 4. Login Page (`src/pages/Login.tsx`)

**Changes:**
- Added "Continue without Login" button
- Displays demo mode indicator
- Shows informational text about limitations

---

### 5. Protected Route (`src/components/ProtectedRoute.tsx`)

**Changes:**
- Now allows access when `isAuthSkipped()` returns true
- Checks both session and skip auth flag

---

### 6. App Layout (`src/components/AppLayout.tsx`)

**Changes:**
- Shows "Demo Mode" badge in sidebar when auth is skipped
- Sign Out button changes to "Exit Demo" in demo mode
- Uses `isSkippedAuth` from auth context

---

### 7. User Profile Hook (`src/hooks/useProfile.ts`)

**Changes:**
- Returns mock profile when in demo mode
- Mock profile: `{ full_name: "Demo User", organization: "ClimateAI Demo" }`

---

### 8. User Role Hook (`src/hooks/useUserRole.ts`)

**Changes:**
- Returns all roles `["admin", "analyst", "viewer"]` in demo mode
- Provides full access to all features when auth is skipped

---

### 9. Audit Log Hook (`src/hooks/useAuditLog.ts`)

**Changes:**
- `logAuditEvent()` - Skips logging in demo mode
- `useAuditLogs()` - Returns empty array in demo mode

---

### 10. Comments Hook (`src/hooks/useComments.ts`)

**Changes:**
- Returns empty array in demo mode
- Disabled query when in demo mode

---

### 11. New Database Service (`src/lib/db.ts`)

**Purpose:** Configurable database abstraction layer

**Features:**
- Reads configuration from environment variables
- Can switch between providers: `supabase`, `api`, `mock`
- Provides `getGeminiApiKey()` for AI functions
- Provides `isDemoMode()` helper

**Configuration:**
```typescript
const DB_CONFIG = {
  provider: import.meta.env.VITE_DB_PROVIDER || 'supabase',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
};
```

---

## Important Notes

### Browser Limitations

**Direct PostgreSQL connection from browser is not possible.** Browsers cannot connect directly to PostgreSQL databases. The current implementation:

1. Keeps Supabase client for data operations (it provides the API layer)
2. Makes authentication optional (users can skip)
3. Provides a configurable database service for future backend replacement

### Future Backend Migration

To use a custom backend instead of Supabase:

1. Set `VITE_DB_PROVIDER=api` in `.env`
2. Set `VITE_API_BASE_URL` to your API endpoint
3. Implement the API endpoints matching the expected interface in `src/lib/db.ts`

### Environment Variables in Supabase Functions

The Supabase Edge Functions already use environment variables:
- `GEMINI_API_KEY` - For AI features
- `SUPABASE_URL` - For database connection
- `SUPABASE_SERVICE_ROLE_KEY` - For service access

These are configured in the Supabase dashboard, not in the frontend `.env` file.

---

## How to Use

### 1. Configure Environment Variables

Edit `.env` file:
```bash
# Required: Add your Gemini API key
VITE_GEMINI_API_KEY=your-api-key-here

# Optional: Add database URL for reference
VITE_DATABASE_URL=postgresql://...
```

### 2. Run the Application

```bash
npm run dev
```

### 3. Skip Authentication

On the login page:
1. Click "Continue without Login" button
2. You'll enter demo mode with full access
3. A "Demo Mode" badge appears in the sidebar

### 4. Exit Demo Mode

Click "Exit Demo" in the sidebar or clear browser localStorage.

---

## Security Considerations

1. **Frontend env variables are exposed** - Never put sensitive secrets that should be server-only
2. **Demo mode grants admin access** - All features are accessible
3. **Database URL in env** - For reference only; actual connection happens server-side
4. **Gemini API key** - If used client-side, it will be exposed. Consider proxying through backend.

---

## Next Steps for Production

1. Create a backend API that proxies to PostgreSQL
2. Move Gemini API calls to backend to protect the key
3. Implement proper session management
4. Add rate limiting and security headers
5. Remove skip auth option for production builds
