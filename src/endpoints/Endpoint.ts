import { Env } from "../ENV";

export interface Endpoint {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>
}
