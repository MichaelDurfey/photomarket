const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const USERS_FILE_LEGACY = path.join(__dirname, "users.json");

function loadUsers() {
  try {
    const usersPath = fs.existsSync(USERS_FILE)
      ? USERS_FILE
      : fs.existsSync(USERS_FILE_LEGACY)
        ? USERS_FILE_LEGACY
        : null;
    if (!usersPath) return [];
    return JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  } catch {
    return [];
  }
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function saveUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function nextUserId(users) {
  if (users.length === 0) return 1;
  return Math.max(...users.map((u) => u.id)) + 1;
}

/**
 * @param {Record<string, unknown>} claims OIDC id_token claims (must include `sub`)
 * @returns {{ id: number, username: string }}
 */
function findOrCreateOidcUser(claims) {
  const sub = claims.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("OIDC id_token missing sub claim");
  }

  const username =
    (typeof claims.email === "string" && claims.email) ||
    (typeof claims.preferred_username === "string" &&
      claims.preferred_username) ||
    (typeof claims.name === "string" && claims.name) ||
    `user_${sub.slice(0, 12)}`;

  const users = loadUsers();
  let user = users.find((u) => u.oidcSub === sub);
  if (user) {
    if (user.username !== username) {
      user.username = username;
      saveUsers(users);
    }
    return { id: user.id, username: user.username };
  }

  const newUser = {
    id: nextUserId(users),
    username,
    oidcSub: sub,
  };
  users.push(newUser);
  saveUsers(users);
  return { id: newUser.id, username: newUser.username };
}

module.exports = {
  loadUsers,
  saveUsers,
  findOrCreateOidcUser,
};
