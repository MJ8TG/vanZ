# 🛡️ VanZ Development & Integration Notes

This document tracks all temporary bypasses, test credentials, and critical configurations used during the Supabase integration phase.

## 🔑 Access & Bypasses (DEVELOPMENT ONLY)

> [!WARNING]
> Please REMOVE these bypasses before deploying to a production environment.

### 1. Driver Signup Wizard (OTP Bypass)
- **File**: `components/drivers/Step1Phone.tsx`
- **Link**: [Step1Phone.tsx](file:///c:/Users/user/Desktop/vanZ/components/drivers/Step1Phone.tsx)
- **Test Phone**: `22222222`
- **Test OTP**: `123456`
- **Note**: This bypass only skips the UI step. It does **not** create a real Supabase Auth session, so document uploads (Step 2/4) will fail due to RLS policies. To test full uploads, use a real phone number.

### 2. Admin Dashboard (Auth Bypass)
- **File**: `.env.local`
- **Variable**: `NEXT_PUBLIC_DEV_MODE=true`
- **Note**: When active, the Admin layout (`app/[locale]/admin/layout.tsx`) skips the authentication check and allows access to `/admin` pages without logging in.

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
