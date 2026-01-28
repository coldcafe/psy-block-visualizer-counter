export interface Env {
  COUNTER_DURABLE_OBJECT: DurableObjectNamespace;
}

export class CounterDurableObject {
  private state: DurableObjectState;
  private env: Env;
  private count: number = 0;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    state.blockConcurrencyWhile(async () => {
      const stored = await state.storage.get<number>("count");
      this.count = stored || 0;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "POST" && path === "/increment") {
      const previousCount = this.count;
      this.count++;
      await this.state.storage.put("count", this.count);
      return new Response(previousCount.toString());
    } else if (request.method === "GET" && path === "/get") {
      return new Response(this.count.toString());
    } else if (request.method === "GET" && path === "/reset") {
      this.count = 0;
      await this.state.storage.put("count", this.count);
      return new Response(this.count.toString());
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
  }
}
