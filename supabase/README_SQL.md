# 🗳️ Supabase Master Deployment Guide

This directory contains the core infrastructure for the VanZ platform. To ensure your database is in sync with the application, follow this exact order in the **Supabase SQL Editor**.

## 🚀 Order of Operations

### 1. Master Schema
- **File**: `schema.sql`
- **Action**: Run this first to create all tables, functions, and triggers. 
- **Note**: It uses `IF NOT EXISTS` and `CREATE OR REPLACE`, so it's safe to run multiple times. It handles the `Auctions` table rule and the circular dependency between `jobs` and `bids`.

### 2. Security & RLS
- **File**: `002_rls_policies.sql`
- **Action**: Run this second to enable Row Level Security (RLS) and create storage buckets.
- **Note**: This activates the permissions that protect user data and documents. It also creates the `driver-documents` and `job-photos` buckets.

---

## 🏗️ Storage Buckets
The security policies for storage are **path-based**. 
Files MUST be uploaded to a folder named after the user's ID:
`bucket-name / {user_id} / filename.ext`

- `driver-documents`: Stores CIN, License, and Vehicle papers. Private.
- `job-photos`: Photos of items for move requests. Private.
- `chat-media`: Shared images in the bidding chat. Private.

## 🛡️ Admin Setup
To access the admin features, you must manually promote a user to admin in the `admin_users` table:
```sql
INSERT INTO public.admin_users (id, email) 
VALUES ('user-uuid-here', 'admin@email.com');
```

---

## 🔧 Maintenance
- **Never drop the `Auctions` table**. It is protected by project rules.
- **Triggers**: The `on_auth_user_created` trigger is the most critical; it links Supabase Auth to your `public.users` profiles.
