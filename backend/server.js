const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3000;
const SECRET_KEY = "your_secret_key"; // Use a strong secret key in production

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Mock database
const photos = JSON.parse(fs.readFileSync("photos.json", "utf-8"));
const users = JSON.parse(fs.readFileSync("users.json", "utf-8"));

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });
};

// Register endpoint
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, username, password: hashedPassword };
  users.push(newUser);
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
  res.status(201).json({ message: "User registered successfully" });
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = generateToken(user);
    res.cookie("token", token, {
      httpOnly: true, // only accessible via http request and not javascript
      secure: process.env.NODE_ENV === "production", // Cookie is only sent over HTTPS connections. Should be set to true in production environments
      sameSite: "Strict", // mitigate CSRF attacks. Send cookie only for same origin (first party contexts)
    });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Protected route example
app.get("/api/photos", authenticateToken, (req, res) => {
  res.json(photos);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
