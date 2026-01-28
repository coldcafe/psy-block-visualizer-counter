export interface Env {
  KV: KVNamespace;
}
const Key = "verification_count";
export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      if (request.method === "POST") {
        const verificationCountStr = await env.KV.get(Key);
        let verificationCount = 0;
        if (!verificationCountStr) {
          verificationCount = 0;
        } else {
          verificationCount = parseInt(verificationCountStr, 10);
        }
        await env.KV.put(Key, (verificationCount + 1).toString());
        return new Response(verificationCountStr);
      } else if (request.method === "GET") {
        let verificationCountStr = await env.KV.get(Key);
        if (!verificationCountStr) {
          verificationCountStr = "0";
        }
        return new Response(verificationCountStr);
      } else {
        return new Response("Method not allowed", { status: 405 });
      }
    } catch (err) {
      console.error(`KV returned error:`, err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred when accessing KV storage";
      return new Response(errorMessage, {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  },
} satisfies ExportedHandler<Env>;
