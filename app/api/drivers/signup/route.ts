import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getServiceClient } from '@/lib/api-auth';

async function generateReferralCode(supabase: any, firstName: string): Promise<string> {
  const base = firstName.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase();
  const finalBase = base.length > 0 ? base : "VANZ";
  const suffix = Math.floor(10 + Math.random() * 90).toString();
  const code = finalBase + suffix;
  const { data: existing } = await supabase.from('users').select('id').eq('referral_code', code).single();
  if (existing) return generateReferralCode(supabase, firstName);
  return code;
}

export async function POST(req: Request) {
  // 🔒 Auth Gate
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return authError;

  try {
    const supabase = getServiceClient();
    const data = await req.json();

    const {
      userId, firstName, lastName, email, phone, city,
      cin, dob, cinExpiry,
      vehicleType, brand, model, year, color, plate, capacity,
      cinFrontUrl, cinBackUrl, docCarteGrise, docAssurance, docPermis, docVisite, docVehicle,
      appliedReferralCode
    } = data;

    if (!userId) {
      return NextResponse.json({ error: "Session utilisateur manquante." }, { status: 401 });
    }

    // 🔒 Authorization: caller must be the userId they claim
    if (user!.id !== userId) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const { data: existingUser } = await supabase.from('users').select('referral_code').eq('id', userId).single();
    let referralCode = existingUser?.referral_code;
    if (!referralCode) {
      referralCode = await generateReferralCode(supabase, firstName || "CHAUFFEUR");
    }

    const { error: userUpdateError } = await supabase.from('users').upsert({
      id: userId, phone, first_name: firstName, last_name: lastName,
      email, city, role: 'driver', referral_code: referralCode
    });
    if (userUpdateError) throw userUpdateError;

    const { error: driverError } = await supabase.from('drivers').upsert({
      id: userId, cin_number: cin, cin_expiry: cinExpiry, date_of_birth: dob,
      vehicle_type: vehicleType, vehicle_brand: brand, vehicle_model: model,
      vehicle_year: parseInt(year), vehicle_color: color, vehicle_plate: plate,
      vehicle_capacity: parseFloat(capacity),
      cin_front_url: cinFrontUrl, cin_back_url: cinBackUrl,
      vehicle_photo_url: docVehicle, doc_carte_grise: docCarteGrise,
      doc_assurance: docAssurance, doc_permis: docPermis, doc_visite_technique: docVisite,
      status: 'pending'
    });

    if (driverError) {
      if (driverError.code === '23505') {
        return NextResponse.json({ error: "Un véhicule avec cette plaque ou ce CIN est déjà enregistré." }, { status: 409 });
      }
      throw driverError;
    }

    if (appliedReferralCode) {
      const { data: referrer, error: refLookupError } = await supabase
        .from('users').select('id').eq('referral_code', appliedReferralCode.toUpperCase()).single();
      if (referrer && !refLookupError) {
        await supabase.from('referrals').insert({ referrer_id: referrer.id, referred_id: userId, status: 'pending' });
      }
    }

    return NextResponse.json({ success: true, status: 'approved' });
  } catch (err: any) {
    console.error('[API_DRIVER_SIGNUP]', err);
    return NextResponse.json({ error: err.message || "Erreur lors de l'inscription." }, { status: 500 });
  }
}
