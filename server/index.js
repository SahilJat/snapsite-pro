const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const app = express();
const PORT = 5000;
const SECRET_KEY = "civil_engineer_secret_key";

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'Sahiljaat',
  host: 'localhost',
  database: 'tasks_db',
  password: 'Dontknow543',
  port: 5432,
});


const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
       id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL

);
`);

    await pool.query(`
   CREATE TABLE IF NOT EXISTS tasks(
   id SERIAL PRIMARY KEY,
   user_id INTEGER REFERENCES users(id),
   text VARCHAR(255) NOT NULL,
priority VARCHAR(50) DEFAULT 'Normal'

);
`);
    console.log("✅ Database Tables Ready");
  }
  catch (err) {
    console.error("❌ DB Init Failed:", err);
  }
};
initDB();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
// REGISTER
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1. Hash the password (Scramble it)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Insert into DB
    const newUser = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "User already exists or server error" });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).send("User not found");

    const user = result.rows[0];

    // 2. Check Password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(403).send("Invalid Password");

    // 3. Generate ID Card (Token)
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
    res.json({ token, email: user.email });

  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// --- TASK ROUTES (Protected) ---

// server/index.js (Inside the GET /tasks route)

// GET (Read tasks with SEARCH and FILTER)
app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    // 1. Extract Query Params from the URL
    // Example URL: /tasks?search=cement&priority=High
    const { search, priority } = req.query;
    const userId = req.user.id;

    // 2. Start building the SQL query
    // We always filter by User ID first for security
    let sql = 'SELECT * FROM tasks WHERE user_id = $1';
    let params = [userId];
    let paramIndex = 2; // Next variable will be $2

    // 3. Add Search Logic (if user typed something)
    if (search) {
      // ILIKE means "Case-Insensitive Search" (cement = Cement)
      // % means "anything before or after" (e.g., "Buy Cement Now")
      sql += ` AND text ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 4. Add Priority Logic (if user selected a filter)
    if (priority && priority !== 'All') {
      sql += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    // 5. Finish with sorting
    sql += ' ORDER BY id DESC'; // Newest first

    // 6. Execute
    const result = await pool.query(sql, params);
    res.json(result.rows);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
// POST (Create for ME)
app.post('/tasks', authenticateToken, async (req, res) => {
  try {// REGISTER
    app.post('/register', async (req, res) => {
      try {
        const { email, password } = req.body;
        // 1. Hash the password (Scramble it)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insert into DB
        const newUser = await pool.query(
          "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
          [email, hashedPassword]
        );
        res.json(newUser.rows[0]);
      } catch (err) {
        res.status(500).json({ error: "User already exists or server error" });
      }
    });

    // LOGIN
    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        // 1. Find user
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) return res.status(400).send("User not found");

        const user = result.rows[0];

        // 2. Check Password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(403).send("Invalid Password");

        // 3. Generate ID Card (Token)
        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY);
        res.json({ token, email: user.email });

      } catch (err) {
        res.status(500).send("Server Error");
      }
    });

    // --- TASK ROUTES (Protected) ---

    // GET (Only MY tasks)
    app.get('/tasks', authenticateToken, async (req, res) => {
      try {
        // We use req.user.id (from the token) to filter
        const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC', [req.user.id]);
        res.json(result.rows);
      } catch (err) { res.status(500).send(err.message); }
    });

    // POST (Create for ME)
    app.post('/tasks', authenticateToken, async (req, res) => {
      try {
        const { text } = req.body;
        const result = await pool.query(
          "INSERT INTO tasks (text, priority, user_id) VALUES ($1, 'Normal', $2) RETURNING *",
          [text, req.user.id]
        );
        res.json(result.rows[0]);
      } catch (err) { res.status(500).send(err.message); }
    });



    // PUT (Update Task - Priority OR Text)
    app.put('/tasks/:id', authenticateToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { priority, text } = req.body;
        const userId = req.user.id;


        const check = await pool.query("SELECT * FROM tasks WHERE id = $1 AND user_id = $2", [id, userId]);
        if (check.rows.length === 0) return res.status(404).json("Task not found or unauthorized");


        let fields = [];
        let params = [];
        let paramIndex = 1;

        if (priority) {
          fields.push(`priority = $${paramIndex}`);
          params.push(priority);
          paramIndex++;
        }
        if (text) {
          fields.push(`text = $${paramIndex}`);
          params.push(text);
          paramIndex++;
        }


        params.push(id);

        const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

        await pool.query(sql, params);
        res.json("Updated Successfully");

      } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
      }
    });

    app.delete('/tasks/:id', authenticateToken, async (req, res) => {
      try {
        await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
        res.json("Deleted");
      } catch (err) { res.status(500).send(err.message); }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Secure Server running on Port ${PORT}`);
    });
    const { text } = req.body;
    const result = await pool.query(
      "INSERT INTO tasks (text, priority, user_id) VALUES ($1, 'Normal', $2) RETURNING *",
      [text, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).send(err.message); }
});

// PUT & DELETE (Same as before, just needs protection if you want strict security)
app.put('/tasks/:id', authenticateToken, async (req, res) => {
  /* Logic remains same, usually you add "AND user_id = $1" to ensure you don't edit others' tasks */
  try {
    const { priority } = req.body;
    await pool.query("UPDATE tasks SET priority = $1 WHERE id = $2", [priority, req.params.id]);
    res.json("Updated");
  } catch (err) { res.status(500).send(err.message); }
});

app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
    res.json("Deleted");
  } catch (err) { res.status(500).send(err.message); }
});

app.listen(PORT, () => {
  console.log(`🚀 Secure Server running on Port ${PORT}`);
});

