export const dynamic = "force-dynamic";

export async function GET() {
  const sequence = 1048 + Math.floor(Date.now() / 4_500);
  const event = {
    id: `evt-${sequence}`,
    sequence,
    type:
      sequence % 5 === 0
        ? "Validator effectiveness updated"
        : sequence % 3 === 0
          ? "Withdrawal request queued"
          : "Attestation batch finalized",
    at: new Date().toISOString(),
  };
  const body = `retry: 4500\ndata: ${JSON.stringify(event)}\n\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Content-Encoding": "identity",
      "X-Accel-Buffering": "no",
    },
  });
}
