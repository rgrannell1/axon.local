
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { CoppermindDatabase } from "./shared/coppermind-database.ts";

import { atDate } from "./api/location/at-date.ts";

type Config = {
  port: Number
}

type Services = {
  db: any;
}

export function axonLocalRouter(config: Config, services: Services) {
  const router = new Router();

  router.get('/location/at-date', atDate(config, services));

  return router
}

export function axonLocalServices(cfg: Config): Services {
  const db = CoppermindDatabase.client("/home/rg/coppermind.sqlite");

  CoppermindDatabase.dropTables(db);
  CoppermindDatabase.recreateTables(db);

  return { db }
}

export function axonLocalApp(config: Config, services: Services) {
  const router = axonLocalRouter(config, services);
  const app = new Application();

  app
    .use(router.routes())
    .use(router.allowedMethods());

  return app;
}

export async function startApp(app: Application, config: Config) {
  const controller = new AbortController();

  app.listen({
    port: config.port,
    signal: controller.signal,
  });

  return controller;
}
