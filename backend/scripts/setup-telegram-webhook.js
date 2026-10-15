import { config } from '../src/infrastructure/config/env.js';

const action = process.argv[2] || 'info'; // 'set', 'delete', 'info'
const webhookUrlArg = process.argv[3] || config.telegram?.webhookUrl;
const secretToken = config.telegram?.webhookSecret;

const token = config.telegram?.botToken;

if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN no está definido en el archivo .env');
  process.exit(1);
}

const telegramApiBase = `https://api.telegram.org/bot${token}`;

async function getWebhookInfo() {
  const res = await fetch(`${telegramApiBase}/getWebhookInfo`);
  const data = await res.json();
  console.log('📋 Estado actual del Webhook de Telegram:');
  console.log(JSON.stringify(data, null, 2));
}

async function setWebhook(url) {
  if (!url || !url.startsWith('https://')) {
    console.error('❌ Error: El Webhook de Telegram requiere obligatoriamente una URL pública HTTPS válida.');
    console.log('Uso: node scripts/setup-telegram-webhook.js set https://tu-dominio.com/api/webhooks/telegram');
    process.exit(1);
  }

  const payload = {
    url,
    allowed_updates: ['message', 'callback_query']
  };

  if (secretToken) {
    payload.secret_token = secretToken;
  }

  console.log(`📡 Registrando Webhook en Telegram: ${url}...`);
  const res = await fetch(`${telegramApiBase}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.ok) {
    console.log('✅ Webhook registrado exitosamente en Telegram:', data.description);
  } else {
    console.error('❌ Fallo al registrar Webhook:', data);
  }
}

async function deleteWebhook() {
  console.log('🗑️ Eliminando Webhook de Telegram...');
  const res = await fetch(`${telegramApiBase}/deleteWebhook`);
  const data = await res.json();
  if (data.ok) {
    console.log('✅ Webhook eliminado exitosamente:', data.description);
  } else {
    console.error('❌ Fallo al eliminar Webhook:', data);
  }
}

async function main() {
  try {
    if (action === 'set') {
      await setWebhook(webhookUrlArg);
    } else if (action === 'delete') {
      await deleteWebhook();
    } else {
      await getWebhookInfo();
    }
  } catch (err) {
    console.error('❌ Error de conexión con la API de Telegram:', err.message);
  }
}

main();
