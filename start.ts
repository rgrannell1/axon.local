
import {
  axonLocalApp,
  axonLocalServices,
  startApp
} from "./app.ts";

const config = {
  port: 8080
};

const services = axonLocalServices(config);
const app = axonLocalApp(config, services);

startApp(app, config);
