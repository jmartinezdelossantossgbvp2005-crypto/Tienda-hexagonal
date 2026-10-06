# Guia de Instalacion y Ejecucion (Rama AWS)

Instrucciones para clonar o actualizar el proyecto en la rama **`aws`** y ejecutarlo localmente.

---

## Requisitos Previos

- **Node.js** (v18 o superior)
- **Git**
- **PostgreSQL** (o Docker si prefieres contenedores)

---

## 1. Descargar o Actualizar el Repositorio

### Si es la primera vez que clonas:
```bash
git clone -b aws https://github.com/jmartinezdelossantossgbvp2005-crypto/Tienda-hexagonal.git
cd Tienda-hexagonal
```

### Si ya tenias el repositorio descargado previamente:
```bash
cd Tienda-hexagonal
git fetch origin
git checkout aws
git pull origin aws
```

---

## 2. Configurar Variables de Entorno

Copia los archivos de configuracion de ejemplo:

### En Windows (PowerShell):
```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

### En Linux / Mac / Git Bash:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

> **Nota:** Abre el archivo `backend/.env` y ajusta las credenciales de tu PostgreSQL local (`DB_USER`, `DB_PASSWORD`, `DB_PORT`, `DB_NAME`).

---

## 3. Instalar Dependencias

Desde la raiz del proyecto:

```bash
npm run install:all
```

---

## 4. Inicializar la Base de Datos

Ejecuta el script para crear tablas y sembrar datos iniciales:

```bash
npm run db:init
```

---

## 5. Iniciar la Aplicacion

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api

---

## Opcion con Docker Compose

```bash
docker compose up --build
```
