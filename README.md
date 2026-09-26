# Tienda-hexagonal

Aplicación fullstack de e-commerce construida con **Arquitectura Hexagonal (Ports & Adapters)**.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Auth | JWT + bcrypt |
| Frontend | React 18 + Vite 5 |
| Arquitectura | Hexagonal (Clean Architecture) |

## Estructura

```
Tienda-hexagonal/
├── backend/   # Servidor Node.js con arquitectura hexagonal
└── frontend/  # Aplicación React + Vite
```

## Instalación

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend (nueva terminal)
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Entidades

- **Usuarios** — gestión de cuentas con roles (admin / cliente)
- **Productos** — catálogo con stock
- **Pedidos** — carrito y órdenes de compra

## Autor

**Josias Martínez de los Santos**
