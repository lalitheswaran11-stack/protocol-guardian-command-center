export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let sequence = 1048;
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        sequence += 1;
        const now = new Date();
        const event = {
          id: `evt-${sequence}`,
          sequence,
          type:
            sequence % 5 === 0
              ? "Validator effectiveness updated"
              : sequence % 3 === 0
                ? "Withdrawal request queued"
                : "Attestation batch finalized",
          at: now.toISOString(),
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };
      send();
      const timer = setInterval(send, 4_500);
      request.signal.addEventListener("abort", () => {
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
