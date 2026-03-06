// api/index.ts - Vercel Serverless Function entry point
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../server/app";

let app: any;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!app) {
    app = await createApp();
  }
  return app(req, res);
}
