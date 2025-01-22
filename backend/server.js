const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const pg = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const db = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "Courses",
  password: "admin",
  port: 5433,
});

// JWT token generation
function generateToken(user) {
  return jwt.sign({ user_id: user.user_id, role: user.role }, 'secretkey', { expiresIn: '1h' });
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

  if (!token) return res.sendStatus(401); // No token

  jwt.verify(token, 'secretkey', (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user;
    next();
  });
}

// User registration
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.query(
    "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *",
    [username, email, hashedPassword, role]
  );

  const user = result.rows[0];
  const token = generateToken(user);

  res.json({ token });
});

// User login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

  if (result.rows.length === 0) {
    return res.status(400).json({ error: "User not found" });
  }

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user);
  res.json({ token, role: user.role });
});

// Get courses
app.get("/courses", authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT c.*, ct.type_name, cat.category_name 
      FROM courses c 
      JOIN course_types ct ON c.type_id = ct.type_id 
      JOIN categories cat ON c.category_id = cat.category_id
      WHERE 1=1
    `;
    const queryParams = [];
    
    if (req.query.category) {
      query += " AND c.category_id = $" + (queryParams.length + 1);
      queryParams.push(req.query.category);
    }
    
    if (req.query.type) {
      query += " AND c.type_id = $" + (queryParams.length + 1);
      queryParams.push(req.query.type);
    }

    if (req.query.search) {
      query += " AND (c.title ILIKE $" + (queryParams.length + 1) + " OR c.description ILIKE $" + (queryParams.length + 1) + ")";
      queryParams.push(`%${req.query.search}%`);
    }

    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add new course (admin only)
app.post("/courses", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Permission denied" });
  }

  const { title, description, type_id, category_id, created_by } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO courses (title, description, type_id, category_id, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, description, type_id, category_id, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Edit course (admin only)
app.put("/courses/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Permission denied" });
  }

  const { id } = req.params;
  const { title, description, type_id, category_id } = req.body;

  try {
    const result = await db.query(
      "UPDATE courses SET title = $1, description = $2, type_id = $3, category_id = $4 WHERE course_id = $5 RETURNING *",
      [title, description, type_id, category_id, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete course (admin only)
app.delete("/courses/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Permission denied" });
  }

  const { id } = req.params;

  try {
    await db.query("DELETE FROM courses WHERE course_id = $1", [id]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Enroll in a course
app.post("/enroll", authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: "Only students can enroll in courses" });
  }

  const { course_id } = req.body;
  const user_id = req.user.user_id;

  try {
    // Check if already enrolled
    const existingEnrollment = await db.query(
      "SELECT * FROM course_enrollments WHERE user_id = $1 AND course_id = $2",
      [user_id, course_id]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    // Enroll student
    const result = await db.query(
      "INSERT INTO course_enrollments (user_id, course_id, completion_status) VALUES ($1, $2, $3) RETURNING *",
      [user_id, course_id, '0']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Unenroll from a course
app.delete("/unenroll/:course_id", authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: "Only students can unenroll from courses" });
  }

  const { course_id } = req.params;
  const user_id = req.user.user_id;

  try {
    const result = await db.query(
      "DELETE FROM course_enrollments WHERE user_id = $1 AND course_id = $2 RETURNING *",
      [user_id, course_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    res.status(200).json({ message: "Successfully unenrolled from the course" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get enrolled courses
app.get("/enrolled-courses", authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: "Only students can view enrolled courses" });
  }

  const user_id = req.user.user_id;

  try {
    let query = `
      SELECT c.*, ct.type_name, cat.category_name 
      FROM courses c 
      JOIN course_enrollments ce ON c.course_id = ce.course_id 
      JOIN course_types ct ON c.type_id = ct.type_id 
      JOIN categories cat ON c.category_id = cat.category_id
      WHERE ce.user_id = $1
    `;
    const queryParams = [user_id];

    if (req.query.search) {
      query += " AND (c.title ILIKE $" + (queryParams.length + 1) + " OR c.description ILIKE $" + (queryParams.length + 1) + ")";
      queryParams.push(`%${req.query.search}%`);
    }

    const result = await db.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all categories
app.get("/categories", authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM categories");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all course types
app.get("/course-types", authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM course_types");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get lessons for a course
app.get("/courses/:courseId/lessons", authenticateToken, async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY lesson_order",
      [courseId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a new lesson (admin only)
app.post("/courses/:courseId/lessons", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Permission denied" });
  }

  const { courseId } = req.params;
  const { title, content, lesson_order } = req.body;

  try {
    const result = await db.query(
      "INSERT INTO course_lessons (course_id, title, content, lesson_order) VALUES ($1, $2, $3, $4) RETURNING *",
      [courseId, title, content, lesson_order]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Edit a lesson (admin only)
app.put("/courses/:courseId/lessons/:lessonId", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Permission denied" });
  }

  const { courseId, lessonId } = req.params;
  const { title, content, lesson_order } = req.body;

  try {
    const result = await db.query(
      "UPDATE course_lessons SET title = $1, content = $2, lesson_order = $3 WHERE lesson_id = $4 AND course_id = $5 RETURNING *",
      [title, content, lesson_order, lessonId, courseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a lesson (admin only)
app.delete("/courses/:courseId/lessons/:lessonId", authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Permission denied" });
  }

  const { courseId, lessonId } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM course_lessons WHERE lesson_id = $1 AND course_id = $2 RETURNING *",
      [lessonId, courseId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get user profile
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT user_id, username, email, role FROM users WHERE user_id = $1",
      [req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update user profile
app.put("/profile", authenticateToken, async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let query = "UPDATE users SET ";
    const queryParams = [];
    let paramCount = 1;

    if (username) {
      query += `username = $${paramCount}, `;
      queryParams.push(username);
      paramCount++;
    }

    if (email) {
      query += `email = $${paramCount}, `;
      queryParams.push(email);
      paramCount++;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `password_hash = $${paramCount}, `;
      queryParams.push(hashedPassword);
      paramCount++;
    }

    query = query.slice(0, -2); // Remove the last comma and space
    query += ` WHERE user_id = $${paramCount} RETURNING user_id, username, email, role`;
    queryParams.push(req.user.user_id);

    const result = await db.query(query, queryParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

