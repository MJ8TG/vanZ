import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function generateReferralCode(supabase: any, firstName: string): Promise<string> {
  const base = firstName
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 6)
    .toUpperCase();
  const finalBase = base.length > 0 ? base : "VANZ";
  const suffix = Math.floor(10 + Math.random() * 90).toString();
  const code = finalBase + suffix;
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', code)
    .single();
  if (existing) {
    return generateReferralCode(supabase, firstName);
  }
  return code;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const supabase = getServiceClient();
    const data = await req.json();

    const {
      userId, // The existing authenticated user ID
      firstName, lastName, email, phone, city,
      cin, dob, cinExpiry,
      vehicleType, brand, model, year, color, plate, capacity,
      cinFrontUrl, cinBackUrl, docCarteGrise, docAssurance, docPermis, docVisite, docVehicle,
      appliedReferralCode
    } = data;

    if (!userId) {
      return NextResponse.json({ error: "Session utilisateur manquante." }, { status: 401 });
    }

    // Generate referral code since we are about to upsert the user profile
    // We check if it already exists to avoid regenerating on subsequent runs of this endpoint
    const { data: existingUser } = await supabase.from('users').select('referral_code').eq('id', userId).single();
    let referralCode = existingUser?.referral_code;
    if (!referralCode) {
        // Fallback to first name or empty if missing
        referralCode = await generateReferralCode(supabase, firstName || "CHAUFFEUR");
    }

    // 1. Update or Insert the User Profile (Core Info)
    const { error: userUpdateError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        phone: phone, // Assuming phone comes from the form, but auth already has it. We need phone from body.
        first_name: firstName,
        last_name: lastName,
        email: email,
        city: city,
        role: 'driver', // Elevate their role to driver (still pending approval)
        referral_code: referralCode
      });

    if (userUpdateError) throw userUpdateError;

    // 2. Create or Update the Driver sub-profile
    const { error: driverError } = await supabase
      .from('drivers')
      .upsert({
        id: userId,
        cin_number: cin,
        cin_expiry: cinExpiry,
        date_of_birth: dob,
        
        // Vehicle Info
        vehicle_type: vehicleType,
        vehicle_brand: brand,
        vehicle_model: model,
        vehicle_year: parseInt(year),
        vehicle_color: color,
        vehicle_plate: plate,
        vehicle_capacity: parseFloat(capacity),
        
        // Document URLs
        cin_front_url: cinFrontUrl,
        cin_back_url: cinBackUrl,
        vehicle_photo_url: docVehicle,
        doc_carte_grise: docCarteGrise,
        doc_assurance: docAssurance,
        doc_permis: docPermis,
        doc_visite_technique: docVisite,
        
        // Initial Status
        status: 'pending' 
      });

    if (driverError) {
       // Check for unique constraint (plate or cin already existing)
       if (driverError.code === '23505') {
          return NextResponse.json({ error: "Un véhicule avec cette plaque ou ce CIN est déjà enregistré." }, { status: 409 });
       }
       throw driverError;
    }

    // 3. Record Referral Link if provided
    if (appliedReferralCode) {
      const { data: referrer, error: refLookupError } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', appliedReferralCode.toUpperCase())
        .single();
      
      if (referrer && !refLookupError) {
        await supabase.from('referrals').insert({
          referrer_id: referrer.id,
          referred_id: userId,
          status: 'pending'
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API_DRIVER_SIGNUP]', err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'inscription." }, { status: 500 });
  }
}
