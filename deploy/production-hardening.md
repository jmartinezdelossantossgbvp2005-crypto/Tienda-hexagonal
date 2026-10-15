# 🚀 Guía de Despliegue y Hardening en Producción
### Tienda Hexagonal: Imágenes en la Nube y Notificaciones Asíncronas

Esta guía documenta los estándares operativos y configuraciones críticas requeridas para desplegar en servidores de producción (AWS, DigitalOcean, VPS o Kubernetes) asegurando alta disponibilidad, entregabilidad de correo y protección de memoria.

---

## 1. 🧠 Gestión de Memoria y Limpieza en Redis (BullMQ)

### Riesgo Operativo
BullMQ guarda el estado de cada trabajo (`completed`, `failed`, `delayed`) en Redis. En una tienda con cientos de órdenes diarias, estos registros pueden saturar la memoria RAM del servidor si no se acotan.

### Soluciones Implementadas y Recomendadas:
1. **Límite de memoria en Redis:**
   En `docker-compose.yml`, el servicio Redis está configurado con:
   ```bash
   redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru --appendonly yes
   ```
   - `--maxmemory 256mb`: Evita que Redis exceda el consumo asignado de la máquina.
   - `--maxmemory-policy allkeys-lru`: Cuando la memoria se llena, Redis desaloja automáticamente las claves menos utilizadas recientemente en lugar de colapsar o rechazar nuevas tareas.
   - `--appendonly yes`: Persistencia continua en disco para evitar pérdida de colas en caso de reinicio forzado.

2. **Políticas de auto-limpieza en BullMQ (`QueueNotificationAdapter.js`):**
   Todos los trabajos encolados incluyen:
   ```javascript
   removeOnComplete: {
     age: 3600,       // Limpia trabajos completados mayores a 1 hora
     count: 100       // Mantiene máximo 100 registros recientes
   },
   removeOnFail: {
     age: 86400 * 7,  // Conserva trabajos fallidos por 7 días para auditoría
     count: 500       // Máximo 500 registros
   }
   ```

---

## 2. 📧 Entregabilidad de Correos (DNS: SPF, DKIM, DMARC)

Al enviar correos transaccionales desde un dominio propio (ej. `@tienda.com`), los servidores de destino (Gmail, Outlook, Yahoo) rechazan o envían a SPAM cualquier correo que no valide la autenticidad del remitente.

### Registros DNS Requeridos en tu Proveedor de Dominio:

| Tipo | Host / Nombre | Valor de Ejemplo | Propósito |
|---|---|---|---|
| **TXT (SPF)** | `@` (o tu dominio) | `v=spf1 include:_spf.google.com ~all` *(si usas Google Workspace)* o `v=spf1 include:mailgun.org ~all` | Declara qué IPs y servidores tienen permiso de enviar correos a nombre de tu dominio. |
| **TXT (DKIM)** | `default._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKB...` | Llave pública para verificar la firma criptográfica incluida en los encabezados del correo. |
| **TXT (DMARC)** | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@tudominio.com; pct=100; sp=quarantine` | Define qué deben hacer los servidores si fallan SPF o DKIM (`p=none`, `quarantine` o `reject`). |

### Soporte DKIM en el Backend
El backend ya incluye soporte nativo en `EmailWorker.js` configurando las siguientes variables en `.env`:
```env
DKIM_DOMAIN_NAME=tudominio.com
DKIM_KEY_SELECTOR=default
DKIM_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA..."
```

---

## 3. ☁️ Permisos y Seguridad en la Nube (Cloudinary / AWS S3)

### Requisito de Lectura Pública
Para que el navegador de los clientes, las plantillas HTML de correo (Gmail) y Telegram puedan visualizar la imagen a partir de la URL, el archivo debe ser públicamente accesible.

1. **Configuración en el Backend:**
   En `CloudinaryAdapter.js`, cada subida declara explícitamente:
   ```javascript
   {
     folder: 'ecommerce_products',
     resource_type: 'image',
     type: 'upload',
     access_mode: 'public'
   }
   ```
2. **Restricción de Subidas (IP & Allowed Origins):**
   - **Cloudinary:** En el panel de control (*Settings > Security*), restringe el acceso a la API mediante API Key y Secret exclusivamente desde tu servidor backend. Desactiva *Unsigned uploads* para evitar que terceros suban archivos sin autorización.
   - **AWS S3 (Alternativa):** Si se migra a S3, el Bucket Policy debe permitir `s3:GetObject` público para `ecommerce_products/*`, pero `s3:PutObject` y `s3:DeleteObject` deben restringirse exclusivamente al IAM Role o IAM User asignado al backend.

---

## 4. 🤖 Telegram: Webhooks Pasivos HTTPS vs Polling

En desarrollo es habitual utilizar *long-polling*, pero en producción es ineficiente porque mantiene conexiones TCP abiertas continuamente consultando cambios a los servidores de Telegram.

### Arquitectura de Webhook Pasivo Implementada:
1. **Endpoint Seguro:**
   Se ha creado la ruta `POST /api/webhooks/telegram` protegida por el encabezado `x-telegram-bot-api-secret-token`.
2. **Comandos Administrativos en Tiempo Real:**
   El controlador (`TelegramWebhookController.js`) permite al administrador interactuar con la tienda desde su chat:
   - `/stock` o `/inventario`: Consulta el catálogo y reporta artículos en umbral crítico.
   - `/resumen` o `/reporte`: Ejecuta en demanda el caso de uso `GenerateWeeklySummary` y responde con ingresos y métricas.
   - `/id`: Confirma el Chat ID del administrador.
3. **Registro del Webhook:**
   Ejecuta el script incluido para enlazar tu dominio HTTPS con Telegram:
   ```bash
   # En el directorio backend:
   npm run telegram:webhook:set https://api.tudominio.com/api/webhooks/telegram
   
   # Para verificar el estado:
   npm run telegram:webhook:info
   ```

---

## 5. 🐳 Separación de Contenedores en Docker (API vs Workers)

Para evitar que el envío de correos, transacciones en segundo plano o reintentos saturen el CPU del servidor web (impactando la experiencia de compra de los clientes), los procesos se ejecutan en contenedores independientes.

### Arquitectura de Contenedores en `docker-compose.yml`:

```
               [ Internet / Nginx Proxy ]
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
     ┌───────────────┐           ┌───────────────┐
     │   frontend    │           │    backend    │ (HTTP API Express)
     │  (Nginx/Vite) │           │ (Puerto 3000) │ [RUN_BACKGROUND_WORKERS=false]
     └───────────────┘           └───────┬───────┘
                                         │ Encola trabajos
                                         ▼
                                 ┌───────────────┐
                                 │     redis     │ (BullMQ Queues)
                                 │ (maxmemory:   │
                                 │    256mb)     │
                                 └───────▲───────┘
                                         │
                                         │ Consume trabajos
                                 ┌───────┴───────┐
                                 │backend_workers│ (Proceso Node Dedicado)
                                 │ (node workers)│ [EmailWorker + TelegramWorker + Cron]
                                 └───────────────┘
```

- **`backend`**: Ejecuta `npm start` (`server.js`). Solo atiende peticiones REST HTTP.
- **`backend_workers`**: Ejecuta `npm run start:workers` (`workers.js`). No abre puertos HTTP externos; consume de Redis, envía correos por SMTP, gestiona el bot de Telegram y ejecuta el Cron semanal.
- **Escalabilidad:** Si en temporadas de alta demanda la cola de notificaciones crece, puedes escalar los workers sin modificar el servidor web:
  ```bash
  docker compose up -d --scale backend_workers=2
  ```
