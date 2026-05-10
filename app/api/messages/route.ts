import { NextResponse } from "next/server";
import { getAuthenticatedUser, getServiceClient } from "@/lib/api-auth";

const PHONE_REGEX = /(\+216|00216|0[2-9]\d{7})/;
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

export async function POST(req: Request) {
  // 🔒 Auth Gate
  const { user, error: authError } = await getAuthenticatedUser(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { conversation_id, sender_id, sender_type, type, content, media_url, media_duration, location_lat, location_lng, location_label } = body;

    // 🔒 Authorization: caller must be the sender
    if (user!.id !== sender_id) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const supabaseAdmin = getServiceClient();

    // 1. Fetch conversation to check phase
    const { data: conv, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('phase, violation_count')
      .eq('id', conversation_id)
      .single();

    if (convError || !conv) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    // 2. Anti-abuse filter logic (No phone/URLs in pre-bid)
    const isSensitive = PHONE_REGEX.test(content) || URL_REGEX.test(content);
    if (conv.phase === 'pre_bid' && isSensitive && type === 'text') {
      await supabaseAdmin
        .from('conversations')
        .update({ violation_count: (conv.violation_count || 0) + 1 })
        .eq('id', conversation_id);

      return NextResponse.json(
        { error: "CONTENU BLOQUÉ: Partage de coordonnées non autorisé avant l'acceptation de l'offre." }, 
        { status: 400 }
      );
    }

    // 3. Phase check for media
    const canSendMedia = conv.phase === 'post_acceptance';
    if (!canSendMedia && type !== 'text' && type !== 'system') {
      return NextResponse.json(
        { error: "Media strictly forbidden in pre_bid phase." },
        { status: 403 }
      );
    }

    // 4. Safe to insert!
    const { data: insertedMsg, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({ conversation_id, sender_id, sender_type, type, content, media_url, media_duration, location_lat, location_lng, location_label })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: insertedMsg });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Server Error", details: err.message }, { status: 500 });
  }
}
