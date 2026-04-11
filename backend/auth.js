const jwt = require("jsonwebtoken");

function getSecretKey() {
  const key = process.env.SECRET_KEY;
  if (!key || key === "your_secret_key" || key === "your_secret_key_change_this_in_production") {
    console.warn(
      "⚠️  SECRET_KEY is not set or is using the default placeholder. " +
      "Set a strong random string in your .env file for production use."
    );
  }
  return key || "your_secret_key";
}

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, getSecretKey(), {
    expiresIn: "1h",
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, getSecretKey());
  } catch {
    return null;
  }
}

function getUserFromRequest(req) {
  const token = req.cookies?.token;
  if (!token) return null;
  return verifyToken(token);
}

const createContext = ({ req, res }) => {
  return {
    req,
    res,
    user: getUserFromRequest(req),
  };
};

module.exports = {
  generateToken,
  verifyToken,
  getUserFromRequest,
  createContext,
};
