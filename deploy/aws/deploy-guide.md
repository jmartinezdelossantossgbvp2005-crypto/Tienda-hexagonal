# Guía de Despliegue en Amazon Web Services (AWS)

Esta guía detalla los pasos para desplegar la arquitectura completa (**Backend**, **Frontend** y **Base de Datos PostgreSQL**) en AWS.

---

## 🏛️ Arquitectura Recomendada en AWS

```
               [ Cliente / Navegador ]
                  │            │
                  │ HTTPS      │ HTTPS /api
                  ▼            ▼
     ┌──────────────────┐  ┌────────────────────────────────┐
     │  AWS CloudFront  │  │   AWS App Runner / ECS ALB    │
     │        +         │  │   (Backend Node.js Hexagonal)  │
     │      AWS S3      │  └────────────────────────────────┘
     │ (Frontend React) │                  │
     └──────────────────┘                  ▼ (VPC / SSL)
                           ┌────────────────────────────────┐
                           │      AWS RDS PostgreSQL        │
                           └────────────────────────────────┘
```

| Componente | Servicio AWS Recomendado | Alternativa |
|---|---|---|
| **Base de Datos** | **Amazon RDS PostgreSQL** (Multi-AZ opcional) | Aurora Serverless PostgreSQL |
| **Backend** | **AWS App Runner** (Fácil, autoescalable, HTTPS integrado) | AWS ECS (Fargate) con Application Load Balancer |
| **Frontend** | **AWS S3 + CloudFront** (Rápido, económico, CDN global) | AWS Amplify / Contenedor ECS con Nginx |

---

## 1. Base de Datos: Amazon RDS PostgreSQL

1. Crear instancia RDS:
   - **Motor**: PostgreSQL 15 o 16.
   - **Plantilla**: Capa Gratuita (Free Tier) o Producción (`db.t4g.micro` o superior).
   - **DB Identifier**: `ecommerce-postgres`
   - **Master Username**: `postgres` (o tu usuario preferido)
   - **Master Password**: Genera una contraseña segura en AWS Secrets Manager.
   - **Nombre de base de datos inicial**: `ecommerce_hexagonal`
   - **Security Group**: Permitir entrada en el puerto `5432` únicamente desde la VPC o Security Group del Backend.

2. Obtener el endpoint de conexión:
   - Ejemplo: `ecommerce-postgres.c123456789.us-east-1.rds.amazonaws.com`

---

## 2. Backend: Despliegue con AWS App Runner / Amazon ECR

### Paso 2.1: Subir imagen Docker a Amazon ECR
```bash
# Iniciar sesión en ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Crear repositorio para el backend si no existe
aws ecr create-repository --repository-name tienda-backend --region us-east-1

# Construir y etiquetar imagen
docker build -t tienda-backend ./backend
docker tag tienda-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/tienda-backend:latest

# Subir imagen
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/tienda-backend:latest
```

### Paso 2.2: Crear el servicio en AWS App Runner
1. Seleccionar la imagen de ECR subida.
2. Puerto del contenedor: `3000`.
3. Variables de Entorno en App Runner:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `DB_HOST`: `<RDS_ENDPOINT>` (ej: `ecommerce-postgres.xxxx.us-east-1.rds.amazonaws.com`)
   - `DB_PORT`: `5432`
   - `DB_USER`: `postgres`
   - `DB_PASSWORD`: `<TU_PASSWORD_RDS>`
   - `DB_NAME`: `ecommerce_hexagonal`
   - `DB_SSL`: `true`
   - `JWT_SECRET`: `<CLAVE_SECRETA_JWT_ALEATORIA>`
   - `JWT_EXPIRES_IN`: `24h`
   - `CORS_ORIGIN`: `https://tu-dominio-frontend.cloudfront.net` (o la URL de tu CloudFront/S3)
4. Healthcheck: `/api/health`

---

## 3. Frontend: Despliegue en AWS S3 + CloudFront

### Paso 3.1: Compilar el Frontend con la URL del Backend de AWS
Crea o pasa la variable de entorno `VITE_API_URL` apuntando a tu URL de App Runner:
```bash
cd frontend
VITE_API_URL=https://<apprunner-domain>.us-east-1.awsapprunner.com/api npm run build
```
Esto genera la carpeta `frontend/dist/`.

### Paso 3.2: Subir a Bucket de S3
```bash
aws s3 sync ./frontend/dist s3://<tu-bucket-frontend> --delete
```

### Paso 3.3: Configurar Distribución CloudFront
1. Origen: Bucket S3.
2. Comportamiento (Origin Access Control - OAC activado para seguridad).
3. **Página de error personalizada (SPA Routing)**:
   - HTTP Error Code: `403` y `404`
   - Response Page Path: `/index.html`
   - HTTP Response Code: `200`
4. Redirección HTTP a HTTPS activada.

---

## 4. Inicialización de la Base de Datos en AWS RDS

Para ejecutar la migración inicial e insertar datos de producción en AWS RDS:
```bash
# Configura temporalmente las variables de conexión a RDS
DB_HOST=<RDS_ENDPOINT> \
DB_PORT=5432 \
DB_USER=postgres \
DB_PASSWORD=<RDS_PASSWORD> \
DB_NAME=ecommerce_hexagonal \
DB_SSL=true \
ADMIN_NAME="Admin Producción" \
ADMIN_EMAIL="admin@tuempresa.com" \
ADMIN_PASSWORD="<PasswordSeguroProduccion>" \
npm --prefix backend run db:init
```

---

## 5. Resumen de Variables de Entorno para Producción

| Variable | Descripción | Ejemplo Producción |
|---|---|---|
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto de escucha | `3000` |
| `DB_HOST` | Host de AWS RDS | `mydb.xxx.us-east-1.rds.amazonaws.com` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario RDS | `postgres` |
| `DB_PASSWORD` | Contraseña RDS | *(Almacenar en AWS Secrets Manager)* |
| `DB_NAME` | Nombre de base de datos | `ecommerce_hexagonal` |
| `DB_SSL` | Habilita SSL en conexión a RDS | `true` |
| `JWT_SECRET` | Firma de tokens JWT | *(Clave criptográfica segura)* |
| `CORS_ORIGIN` | Origen permitido para requests | `https://tienda.tudominio.com` |
| `VITE_API_URL` | Endpoint API en Frontend | `https://api.tudominio.com/api` |
