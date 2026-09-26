import { createApp } from './infrastructure/adapters/inbound/http/app.js';
import { config } from './infrastructure/config/env.js';

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Servidor backend ejecutándose en el puerto ${config.port}`);
});
