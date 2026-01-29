import { CounterDurableObject } from "./counter";
import seedrandom from 'seedrandom';

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

const circuitTypeSpendTimeMap = {
  '54': 219,
  '48': 219,
  '7': 200,
  '57': 200,
  '10': 310,
  '40': 608,
  '32': 870,
  '55': 310,
  '59': 300,
  '56': 540,
} as any;

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
        
        const circuitTypeStr = jobId?.slice(18,20) || '0';
        const circuitType = parseInt(circuitTypeStr, 16);
        let spendTime = circuitTypeSpendTimeMap[String(circuitType)] || 0;
        // const seed = jobId?.slice(38, 44) || '0';
        const randomNum = seedrandom(jobId || '0')() * 30;
        if (spendTime) {
          spendTime += randomNum
        }
        return new Response(JSON.stringify({
          jobId,
          realmId,
          spendTime: Math.round(spendTime),
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
