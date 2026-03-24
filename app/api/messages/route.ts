import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Next.js Backend Route to act as a secure proxy to Supabase
// Helps enforce the Anti-abuse PHONE_REGEX rule locally!

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const PHONE_REGEX = /(\+216|00216|0[2-9]\d{7})/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversation_id, sender_id, sender_type, type, content, media_url, media_duration, location_lat, location_lng, location_label } = body;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch conversation to check phase
    const { data: conv, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('phase, violation_count')
      .eq('id', conversation_id)
      .single();

    if (convError || !conv) {
      return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
    }

    // 2. Anti-abuse filter logic
    if (conv.phase === 'pre_bid' && PHONE_REGEX.test(content)) {
      // Increment violation count directly in DB
      await supabaseAdmin
        .from('conversations')
        .update({ violation_count: (conv.violation_count || 0) + 1 })
        .eq('id', conversation_id);

      return NextResponse.json(
        { error: "BLOCKED: phone number sharing not allowed before acceptance" }, 
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
      .insert({
        conversation_id,
        sender_id,
        sender_type,
        type,
        content,
        media_url,
        media_duration,
        location_lat,
        location_lng,
        location_label
      })
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
