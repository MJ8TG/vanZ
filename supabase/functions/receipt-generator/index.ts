import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import PDFDocument from "npm:pdfkit";
import { Buffer } from "npm:buffer";
import { sendPushNotification } from "../_shared/push.ts";

const twilioSid = Deno.env.get("TWILIO_SID");
const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const twilioFrom = Deno.env.get("TWILIO_PHONE_NUMBER");

async function sendSms(to: string, body: string) {
  if (twilioSid && twilioToken && twilioFrom) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`)
      },
      body: new URLSearchParams({ To: to, From: twilioFrom, Body: body }).toString()
    });
    return res.json();
  } else {
    console.log('[SMS fallback]', to, body);
  }
}

async function createReceiptPDF(jobData: any): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Uint8Array[] = [];
    
    doc.on('data', (chunk: any) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#051E3C').text('VanZ Invoice', { align: 'center' });
    doc.moveDown(2);

    // Job Meta
    doc.fontSize(12).font('Helvetica').fillColor('#333333');
    doc.text(`Job ID: ${jobData.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.text(`Client: ${jobData.client_name}`);
    doc.text(`Chauffeur: ${jobData.driver_name}`);
    doc.moveDown();

    // Line items
    doc.rect(50, doc.y, 500, 1).fill('#DDDDDD');
    doc.moveDown();
    
    doc.text('Service:', { continued: true }).text(`${jobData.service_type}`, { align: 'right' });
    doc.text('Point A:', { continued: true }).text(`${jobData.pickup_address}`, { align: 'right' });
    doc.text('Point B:', { continued: true }).text(`${jobData.dropoff_address}`, { align: 'right' });
    
    if (jobData.stops && jobData.stops.length > 0) {
       doc.text(`Arrêts supplémentaires: ${jobData.stops.length}`, { align: 'right' });
    }

    doc.moveDown();
    doc.rect(50, doc.y, 500, 1).fill('#DDDDDD');
    doc.moveDown();

    // Financials
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('Total Facturé:', { continued: true }).fillColor('#2BBFDF').text(`${jobData.amount} TND`, { align: 'right' });
    doc.fillColor('#333333');
    doc.fontSize(10).font('Helvetica').text(`Méthode de paiement: ${jobData.payment_method.toUpperCase()}`, { align: 'right' });

    doc.moveDown(4);
    doc.fontSize(10).fillColor('#999999').text('Merci d\'avoir utilisé VanZ. Pour toute réclamation, contactez le support.', { align: 'center' });

    doc.end();
  });
}

serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const jobId = payload.body?.job_id || payload.job_id;

    if (!jobId) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch Job and Users data
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        bids ( driver_id, amount ),
        users!jobs_client_id_fkey ( first_name, last_name, phone )
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
       throw new Error(`Job ${jobId} not found`);
    }

    const client = job.users;
    const acceptedBid = job.bids?.find((b: any) => b.driver_id === job.accepted_bid_id) || job.bids?.[0];

    // Fetch driver details natively
    const { data: driver } = await supabaseAdmin.from('users').select('first_name, last_name, id').eq('id', job.accepted_bid_id).single();

    // 2. Generate PDF Buffer
    const pdfData = {
       id: job.id,
       client_name: `${client.first_name} ${client.last_name}`,
       driver_name: driver ? `${driver.first_name} ${driver.last_name}` : 'Chauffeur',
       service_type: job.service_type,
       pickup_address: job.pickup_address,
       dropoff_address: job.dropoff_address,
       stops: job.stops || [],
       amount: acceptedBid?.amount || 0,
       payment_method: job.payment_method || 'cash'
    };

    const pdfBuffer = await createReceiptPDF(pdfData);

    // 3. Upload to Supabase Storage 'receipts'
    const fileName = `job_${job.id}_${Date.now()}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(`receipts/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 4. Update Jobs with Public URL
    const { data: publicUrlData } = supabaseAdmin.storage.from('documents').getPublicUrl(`receipts/${fileName}`);
    const receiptUrl = publicUrlData.publicUrl;

    await supabaseAdmin.from('jobs').update({ receipt_url: receiptUrl }).eq('id', job.id);

    // 5. Send dual SMS + PUSH to Client
    if (client.phone) {
       await sendSms(client.phone, `VanZ: Votre reçu pour la course est disponible ici: ${receiptUrl}`);
       await sendPushNotification(supabaseAdmin, job.client_id, "Reçu VanZ Disponible", `Votre facture a été générée.`, { url: receiptUrl });
    }

    return new Response(JSON.stringify({ ok: true, receipt_url: receiptUrl }), { status: 200 });

  } catch (err: any) {
    console.error('[receipt-generator]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
