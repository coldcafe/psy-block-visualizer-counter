import { CounterDurableObject } from "./counter";

export interface Env {
  COUNTER_DURABLE_OBJECT: DurableObjectNamespace;
}

export { CounterDurableObject };

const COUNTER_ID = "counter";
const ALLOWED_ORIGINS = [
  'https://psy-block-isualizer.vercel.app',
  'http://localhost:3000', // 开发用
];

function setCorsHeaders(request: Request, response: Response) {
  const origin = request.headers.get('Origin');

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (request.headers.get('Access-Control-Request-Headers')) {
      response.headers.set('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers') || '');
    } else {
      response.headers.set('Access-Control-Allow-Headers', '*');
    }
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    try {
      const counterId = env.COUNTER_DURABLE_OBJECT.idFromName(COUNTER_ID);
      const counterStub = env.COUNTER_DURABLE_OBJECT.get(counterId);

      // 预检请求直接返回 204
      if (request.method === 'OPTIONS') {
        const response = new Response(null, {
          status: 204,
        });
        setCorsHeaders(request, response);
        return response;
      }

      if (request.method === "POST") {
        const response = await counterStub.fetch(
          new Request("http://do/increment", { method: "POST" })
        );
        setCorsHeaders(request, response);
        return response;
      } else if (request.method === "GET") {
        const response = await counterStub.fetch(
          new Request("http://do/get", { method: "GET" })
        );
        setCorsHeaders(request, response);
        return response;
      } else {
        const response = new Response("Method not allowed", { status: 405 });
        setCorsHeaders(request, response);
        return response;
      }
    } catch (err) {
      console.error(`Durable Object returned error:`, err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred when accessing Durable Object";
      const response = new Response(errorMessage, {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
      setCorsHeaders(request, response);
      return response;
    }
  },
} satisfies ExportedHandler<Env>;
