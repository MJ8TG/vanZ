# 🛡️ VanZ Development & Integration Notes

This document tracks all temporary bypasses, test credentials, and critical configurations used during the Supabase integration phase.

## 🔑 Access & Environment

### Dev Mode
- **Variable**: `DEV_AUTH_BYPASS=1`
- **Note**: Can be set on the server environment for local dev but is ignored entirely in Client Components for security. Supabase auth is still required for the admin dashboard.

---

## 🏗️ Core Infrastructure Reminders

### 📍 Localization
- **Currency**: Always use **Tunisian Dinar (TND)**.
- **Language**: UI supports **French (Primary)** and **Arabic**.
- **Phone Validation**: Tunisian format (+216 XX XXX XXX).

### 🗄️ Database & Storage
- **Soft Delete**: Never drop the `Auctions` table. Use `is_deleted = true`.
- **Storage Buckets**: 
  - `driver-documents` (Private, RLS managed)
  - `job-photos` (Private, RLS managed)
- **RLS Policies**: Managed in `supabase/002_rls_policies.sql`.

### 🚀 Recent Migrations
- **003_add_missing_driver_columns.sql**: Added `cin_front_url`, `cin_back_url`, and `vehicle_photo_url` to the `drivers` table.

---

## 🛠️ Tech Stack Constraints
- **Styling**: NativeWind (Tailwind for React Native) / Tailwind CSS (Web).
- **Data Layer**: All queries use the `datasql` client from `@/lib/datasql`.
