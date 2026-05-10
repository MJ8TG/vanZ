import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // 1. SECURITY GATE — Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 2. Secondary check: require a dev-only secret (defense in depth)
  const devSecret = req.headers.get("x-dev-secret");
  if (process.env.DEV_API_SECRET && devSecret !== process.env.DEV_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { email, password, firstName, lastName, phone, role } = await req.json();

    // 2. Initialize ADMIN client (Service Role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 3. Create User via Admin API (Bypass rate limits & email confirm)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // AUTO-CONFIRM
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone,
        role: role || "client"
      }
    });

    if (authError) throw authError;

    const userId = authData.user?.id;
    if (!userId) throw new Error("Erreur de création du compte Admin.");

    // 4. Manual Profile Sync (Since we bypass the standard signup trigger)
    const formattedPhone = phone.startsWith('+') ? phone : `+216${phone}`;

    // Note: In some setups, clicking Signup might have table triggers. 
    // We manually upsert to be sure.
    const { error: profileError } = await supabaseAdmin.from("users").upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      phone: formattedPhone,
      email: email,
      role: role || "client",
      // Add referral_code generation logic if needed here
    });

    if (profileError) {
      console.warn("Manual user upsert failed/skipped due to trigger:", profileError.message);
    }

    // If it's a driver, we can also auto-approve here if needed
    if (role === 'driver') {
        const dummyPlate = `TEST-${Math.floor(1000 + Math.random() * 9000)}-TN`;
        const dummyCin = `123${Math.floor(10000 + Math.random() * 90000)}`;
        await supabaseAdmin.from('drivers').insert({
            id: userId,
            cin_number: dummyCin,
            cin_expiry: "2030-01-01",
            date_of_birth: "1990-01-01",
            vehicle_type: "van",
            vehicle_plate: dummyPlate,
            status: 'approved'
        });
    }

    return NextResponse.json({ 
        success: true, 
        message: "Compte créé et confirmé (Bypass Admin)",
        userId: userId
    });

  } catch (error: any) {
    console.error("Force Signup Error:", error);
    return NextResponse.json({ 
        error: error.message || "Erreur interne de bypass" 
    }, { status: 500 });
  }
}
