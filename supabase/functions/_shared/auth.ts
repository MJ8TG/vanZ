export function verifyWebhookSecret(req: Request): boolean {
  const provided = req.headers.get('x-edge-secret');
  const expected = Deno.env.get('EDGE_WEBHOOK_SECRET');
  return !!provided && !!expected && provided === expected;
}
