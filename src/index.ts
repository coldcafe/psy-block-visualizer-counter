import { CounterDurableObject } from "./counter";

export interface Env {
  COUNTER_DURABLE_OBJECT: DurableObjectNamespace;
}

export { CounterDurableObject };

const COUNTER_ID = "counter";
// const ALLOWED_ORIGINS = [
//   'https://psy-block-isualizer.vercel.app',
//   'https://psy-block-visualizer.psy-protocol.xyz',
//   'http://localhost:3000', // 开发用
// ];

function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin');
  let corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true'
  } as any;

  // if (origin && ALLOWED_ORIGINS.includes(origin)) {
    
  //   corsHeaders = ;
  // }
  return corsHeaders;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    try {
      const counterId = env.COUNTER_DURABLE_OBJECT.idFromName(COUNTER_ID);
      const counterStub = env.COUNTER_DURABLE_OBJECT.get(counterId);

      // 预检请求直接返回 204
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: getCorsHeaders(request),
        });
      }

      if (url.pathname === "/count" && request.method === "POST") {
        const response = await counterStub.fetch(
          new Request("http://do/increment", { method: "POST" })
        );
        return new Response(await response.text(), {
          status: 200,
          headers: getCorsHeaders(request),
        });
      } else if (url.pathname === "/count" && request.method === "GET") {
        const response = await counterStub.fetch(
          new Request("http://do/get", { method: "GET" })
        );
        return new Response(await response.text(), {
          status: 200,
          headers: getCorsHeaders(request),
        });
      } else if (url.pathname === "/spend-time" && request.method === "GET") {
        const jobId = url.searchParams.get('job_id');
        const realmId = url.searchParams.get('realm_id');
        const randomNum = Math.random() * 100;
        return new Response(JSON.stringify({
          jobId,
          realmId,
          spendTime: 580 + randomNum,
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request),
          },
        });
      } else {
        return new Response("Not Found", { status: 404, headers: getCorsHeaders(request) });
      }
    } catch (err) {
      console.error(`Durable Object returned error:`, err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred when accessing Durable Object";
      return new Response(errorMessage, {
        status: 500,
        headers: Object.assign({ "Content-Type": "text/plain" }, getCorsHeaders(request)),
      });
    }
  },
} satisfies ExportedHandler<Env>;
