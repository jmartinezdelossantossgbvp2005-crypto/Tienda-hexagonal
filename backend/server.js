const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let usuarios = [
  { id: 1, nombre: 'Josias Santos', email: 'josias@mail.com', rol: 'admin' },
  { id: 2, nombre: 'Cliente Uno', email: 'cliente@mail.com', rol: 'cliente' }
];

let productos = [
  { id: 1, nombre: 'Laptop Gamer', precio: 15000, stock: 5 },
  { id: 2, nombre: 'Mouse Inalámbrico', precio: 350, stock: 20 }
];

let pedidos = [
  { id: 1, usuarioId: 2, productoId: 1, cantidad: 1, estado: 'pendiente' }
];

// MÓDULO USUARIOS
app.get('/usuarios', (req, res) => res.json(usuarios));
app.post('/usuarios', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const hashedPassword = password ? await bcrypt.hash(password, 10) : 'hash_dummy';
  const nuevo = {
    id: usuarios.length ? Math.max(...usuarios.map(u => u.id)) + 1 : 1,
    nombre: nombre || 'Sin nombre',
    email: email || 'sin-correo@mail.com',
    password: hashedPassword,
    rol: rol || 'cliente'
  };
  usuarios.push(nuevo);
  res.status(201).json({ id: nuevo.id, nombre: nuevo.nombre, email: nuevo.email, rol: nuevo.rol });
});
app.put('/usuarios/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = usuarios.findIndex(u => u.id === id);
  if (index === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
  usuarios[index] = { ...usuarios[index], ...req.body };
  res.json(usuarios[index]);
});
app.delete('/usuarios/:id', (req, res) => {
  const id = parseInt(req.params.id);
  usuarios = usuarios.filter(u => u.id !== id);
  res.json({ mensaje: 'Usuario eliminado' });
});

// MÓDULO PRODUCTOS
app.get('/productos', (req, res) => res.json(productos));
app.post('/productos', (req, res) => {
  const { nombre, precio, stock } = req.body;
  const nuevo = {
    id: productos.length ? Math.max(...productos.map(p => p.id)) + 1 : 1,
    nombre: nombre || 'Producto',
    precio: parseFloat(precio) || 0,
    stock: parseInt(stock) || 0
  };
  productos.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = productos.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  productos[index] = { ...productos[index], ...req.body };
  res.json(productos[index]);
});
app.delete('/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  productos = productos.filter(p => p.id !== id);
  res.json({ mensaje: 'Producto eliminado' });
});

// MÓDULO PEDIDOS
app.get('/pedidos', (req, res) => {
  const detalle = pedidos.map(ped => {
    const user = usuarios.find(u => u.id === ped.usuarioId);
    const prod = productos.find(p => p.id === ped.productoId);
    return {
      ...ped,
      usuarioNombre: user ? user.nombre : 'Desconocido',
      productoNombre: prod ? prod.nombre : 'Desconocido'
    };
  });
  res.json(detalle);
});
app.post('/pedidos', (req, res) => {
  const { usuarioId, productoId, cantidad, estado } = req.body;
  const prod = productos.find(p => p.id === parseInt(productoId));
  const cant = parseInt(cantidad) || 1;

  if (prod && prod.stock < cant) {
    return res.status(400).json({ error: 'Stock insuficiente para este producto' });
  }
  if (prod) prod.stock -= cant;

  const nuevo = {
    id: pedidos.length ? Math.max(...pedidos.map(p => p.id)) + 1 : 1,
    usuarioId: parseInt(usuarioId),
    productoId: parseInt(productoId),
    cantidad: cant,
    estado: estado || 'pendiente'
  };
  pedidos.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/pedidos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = pedidos.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Pedido no encontrado' });
  pedidos[index] = { ...pedidos[index], ...req.body };
  res.json(pedidos[index]);
});
app.delete('/pedidos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  pedidos = pedidos.filter(p => p.id !== id);
  res.json({ mensaje: 'Pedido eliminado' });
});

app.listen(PORT, () => console.log(`Servidor activo en http://localhost:${PORT}`));
