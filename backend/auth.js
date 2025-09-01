const jwt = require("jsonwebtoken");

const SECRET_KEY = "your_secret_key"; // Use a strong secret key in production

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

// GraphQL context function to add user to context
const createContext = ({ req, res }) => {
  let user = null;

  const token = req.cookies.token;
  if (token) {
    try {
      user = jwt.verify(token, SECRET_KEY);
    } catch (error) {
      // Token is invalid, but we don't throw here
      // Let individual resolvers handle authentication
    }
  }

  return {
    req,
    res,
    user,
  };
};

module.exports = {
  authenticateToken,
  createContext,
};
