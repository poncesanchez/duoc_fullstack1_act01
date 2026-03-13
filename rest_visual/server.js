const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base de datos SQLite local
const dbPath = path.join(__dirname, 'mascotas.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

// Crear tabla si no existe
db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS mascotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      edad INTEGER NOT NULL,
      imagen TEXT,
      descripcion TEXT,
      ciudad TEXT
    )`,
    (err) => {
      if (err) {
        console.error('Error al crear la tabla mascotas:', err.message);
      }
    }
  );
});

// API REST CRUD
// Obtener todas las mascotas
app.get('/api/mascotas', (req, res) => {
  db.all('SELECT * FROM mascotas', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener mascotas' });
    }
    res.json(rows);
  });
});

// Obtener una mascota por id
app.get('/api/mascotas/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM mascotas WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener la mascota' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.json(row);
  });
});

// Crear una nueva mascota (POST)
app.post('/api/mascotas', (req, res) => {
  const { nombre, edad, imagen, descripcion, ciudad } = req.body;
  if (!nombre || typeof edad === 'undefined') {
    return res
      .status(400)
      .json({ error: 'Los campos nombre y edad son obligatorios' });
  }

  const sql =
    'INSERT INTO mascotas (nombre, edad, imagen, descripcion, ciudad) VALUES (?, ?, ?, ?, ?)';
  const params = [nombre, edad, imagen || '', descripcion || '', ciudad || ''];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al crear la mascota' });
    }
    res.status(201).json({
      id: this.lastID,
      nombre,
      edad,
      imagen: imagen || '',
      descripcion: descripcion || '',
      ciudad: ciudad || ''
    });
  });
});

// Actualizar una mascota completa (PUT)
app.put('/api/mascotas/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, edad, imagen, descripcion, ciudad } = req.body;

  if (!nombre || typeof edad === 'undefined') {
    return res
      .status(400)
      .json({ error: 'Los campos nombre y edad son obligatorios' });
  }

  const sql =
    'UPDATE mascotas SET nombre = ?, edad = ?, imagen = ?, descripcion = ?, ciudad = ? WHERE id = ?';
  const params = [
    nombre,
    edad,
    imagen || '',
    descripcion || '',
    ciudad || '',
    id
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al actualizar la mascota' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.json({
      id: Number(id),
      nombre,
      edad,
      imagen: imagen || '',
      descripcion: descripcion || '',
      ciudad: ciudad || ''
    });
  });
});

// Actualización parcial de una mascota (PATCH)
app.patch('/api/mascotas/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, edad, imagen, descripcion, ciudad } = req.body;

  // Obtener la mascota actual
  db.get('SELECT * FROM mascotas WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: 'Error al obtener la mascota para actualizar' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }

    const updated = {
      nombre: typeof nombre !== 'undefined' ? nombre : row.nombre,
      edad: typeof edad !== 'undefined' ? edad : row.edad,
      imagen: typeof imagen !== 'undefined' ? imagen : row.imagen,
      descripcion:
        typeof descripcion !== 'undefined' ? descripcion : row.descripcion,
      ciudad: typeof ciudad !== 'undefined' ? ciudad : row.ciudad
    };

    const sql =
      'UPDATE mascotas SET nombre = ?, edad = ?, imagen = ?, descripcion = ?, ciudad = ? WHERE id = ?';
    const params = [
      updated.nombre,
      updated.edad,
      updated.imagen,
      updated.descripcion,
      updated.ciudad,
      id
    ];

    db.run(sql, params, function (errUpdate) {
      if (errUpdate) {
        console.error(errUpdate);
        return res
          .status(500)
          .json({ error: 'Error al actualizar parcialmente la mascota' });
      }
      res.json({ id: Number(id), ...updated });
    });
  });
});

// Eliminar una mascota
app.delete('/api/mascotas/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM mascotas WHERE id = ?', [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al eliminar la mascota' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.status(204).send();
  });
});

// Servir frontend estático
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
