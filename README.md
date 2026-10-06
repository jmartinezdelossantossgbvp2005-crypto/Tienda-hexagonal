# Tienda-hexagonal

Aplicacion fullstack de e-commerce construida con **Arquitectura Hexagonal (Ports & Adapters)**.

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Backend | Node.js + Express (ES Modules) |
| Base de datos | PostgreSQL |
| Auth | JWT + bcrypt |
| Frontend | React 18 + Vite 5 |
| Arquitectura | Hexagonal (Domain, Application, Infrastructure) |
| Cloud / Contenedores | Docker, Docker Compose, AWS App Runner / ECS, S3 + CloudFront |

---

## Inicio Rapido en Local

### 1. Variables de Entorno (Local)
Los archivos `.env` se encuentran configurados para el entorno local y estan ignorados en Git por seguridad:
- `backend/.env`
- `frontend/.env`

*(Para nuevos entornos, duplicar `.env.example` en `backend/` y `frontend/`)*.

### 2. Inicializar Base de Datos y Sembrar Tablas
Para crear las tablas en PostgreSQL local y generar los registros iniciales:

```bash
npm run db:init
```

### 3. Ejecutar la Aplicacion

#### Opcion A: Ejecutar con Node
En la raiz del proyecto:
```bash
npm run dev
```

O de forma independiente:
```bash
# Terminal 1 - Backend (http://localhost:3000)
npm run dev:backend

# Terminal 2 - Frontend (http://localhost:5173)
npm run dev:frontend
```

#### Opcion B: Ejecutar con Docker Compose
```bash
docker compose up --build
```

---

## Roles del Sistema

El sistema cuenta con autenticacion basada en JWT y control de acceso segun roles:

| Rol | Vistas y Accesos |
| :--- | :--- |
| **Administrador (`admin`)** | Dashboard con metricas y alertas, Gestion de inventario y productos (CRUD), Gestion global de pedidos y estados, Administracion y roles de usuarios, Perfil. |
| **Cliente (`customer`)** | Catalogo de productos, Carrito de compras, Historial de Mis Pedidos y Perfil personal. |

> *Las credenciales locales se detallan en el archivo local no versionado `CREDENCIALES_LOCALES.md`.*

---

## Despliegue en AWS

El proyecto esta preparado para desplegarse en AWS:
- **Backend**: `backend/Dockerfile` listo para **AWS App Runner** o **AWS ECS Fargate**.
- **Frontend**: `frontend/Dockerfile` con Nginx multi-stage o compilacion estatica `npm run build` para **AWS S3 + CloudFront**.
- **Base de Datos**: Compatible con **Amazon RDS PostgreSQL** (soporte SSL con `DB_SSL=true`).
- **Guia completa de despliegue**: Consulta [deploy/aws/deploy-guide.md](deploy/aws/deploy-guide.md).

---

## Estructura del Proyecto

```
Tienda-hexagonal/
├── backend/
│   ├── src/
│   │   ├── domain/               # Entidades y Puertos (Ports)
│   │   ├── application/          # Casos de Uso (Use Cases)
│   │   └── infrastructure/       # Adaptadores (PostgreSQL, Express, Bcrypt/JWT)
│   ├── scripts/init-db.js        # Script de inicializacion y migracion
│   ├── Dockerfile                # Contenedor backend optimizado para produccion
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── modules/              # Modulos de Auth, Admin, Productos, Pedidos, Perfil
│   │   └── services/             # Adaptadores de API REST
│   ├── nginx.conf                # Servidor Nginx para SPA
│   ├── Dockerfile                # Contenedor frontend multi-stage
│   └── .env.example
├── deploy/
│   └── aws/deploy-guide.md       # Guia paso a paso para AWS
├── docker-compose.yml            # Stack completo local/staging
└── package.json                  # Scripts unificados de raiz
```
