import { CounterDurableObject } from "./counter";

export interface Env {
  COUNTER_DURABLE_OBJECT: DurableObjectNamespace;
}

export { CounterDurableObject };

const COUNTER_ID = "counter";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      const counterId = env.COUNTER_DURABLE_OBJECT.idFromName(COUNTER_ID);
      const counterStub = env.COUNTER_DURABLE_OBJECT.get(counterId);

      if (request.method === "POST") {
        const response = await counterStub.fetch(
          new Request("http://do/increment", { method: "POST" })
        );
        return response;
      } else if (request.method === "GET") {
        const response = await counterStub.fetch(
          new Request("http://do/get", { method: "GET" })
        );
        return response;
      } else {
        return new Response("Method not allowed", { status: 405 });
      }
    } catch (err) {
      console.error(`Durable Object returned error:`, err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred when accessing Durable Object";
      return new Response(errorMessage, {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  },
} satisfies ExportedHandler<Env>;
