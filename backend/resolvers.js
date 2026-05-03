const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const adobeLightroom = require("./services/adobe-lightroom");
const { generateToken, getUserFromRequest } = require("./auth");

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PHOTOS_FILE = path.join(DATA_DIR, "photos.json");
const USERS_FILE_LEGACY = path.join(__dirname, "users.json");
const PHOTOS_FILE_LEGACY = path.join(__dirname, "photos.json");

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const loadData = () => {
  let photos = [];
  let users = [];

  try {
    const usersPath = fs.existsSync(USERS_FILE)
      ? USERS_FILE
      : USERS_FILE_LEGACY;
    users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  } catch {
    users = [];
  }

  try {
    const photosPath = fs.existsSync(PHOTOS_FILE)
      ? PHOTOS_FILE
      : PHOTOS_FILE_LEGACY;
    photos = JSON.parse(fs.readFileSync(photosPath, "utf-8"));
  } catch {
    photos = [];
  }

  return { photos, users };
};

const saveUsers = (users) => {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const nextUserId = (users) => {
  if (users.length === 0) return 1;
  return Math.max(...users.map((u) => u.id)) + 1;
};

const resolvers = {
  Query: {
    albums: async () => {
      if (!adobeLightroom.isConnected()) return [];
      try {
        const res = await adobeLightroom.getAlbums();
        return (res?.resources || []).map((a) => ({
          id: a.id,
          name: a.payload?.name ?? null,
        }));
      } catch (e) {
        console.error("Albums error:", e.message);
        return [];
      }
    },
    photos: async (_, args) => {
      const options = {
        ...(args.minRating != null && { minRating: args.minRating }),
        ...(args.albumId && { albumId: args.albumId }),
        ...(args.albumName && { albumName: args.albumName }),
        ...(args.subtype && { subtype: args.subtype }),
        ...(args.limit != null && { limit: args.limit }),
        ...(args.offset && { offset: args.offset }),
      };

      if (!adobeLightroom.isConnected()) {
        const { photos } = loadData();
        return photos;
      }

      try {
        const adobePhotos = await adobeLightroom.getPhotos(options);
        if (adobePhotos && adobePhotos.length > 0) {
          return adobePhotos;
        }
      } catch (error) {
        console.error("Error fetching from Adobe Lightroom:", error.message);
      }

      const { photos } = loadData();
      return photos;
    },

    photo: async (_, { id }) => {
      if (adobeLightroom.isConnected()) {
        try {
          const adobePhotos = await adobeLightroom.getPhotos();
          const photo = adobePhotos.find((p) => p.id.toString() === id);
          if (photo) return photo;
        } catch (error) {
          console.error("Error fetching photo from Adobe:", error.message);
        }
      }

      const { photos } = loadData();
      return photos.find((photo) => photo.id.toString() === id);
    },

    me: (_, __, context) => {
      return context.user || null;
    },
  },

  Mutation: {
    register: async (_, { username, password }, { res }) => {
      const { users } = loadData();

      // Check if user already exists
      const existingUser = users.find((u) => u.username === username);
      if (existingUser) {
        throw new Error("Username already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: nextUserId(users),
        username,
        password: hashedPassword,
      };

      users.push(newUser);
      saveUsers(users);

      // Generate token and set cookie
      const token = generateToken(newUser);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      return {
        token,
        user: { id: newUser.id, username: newUser.username },
      };
    },

    login: async (_, { username, password }, { res }) => {
      const { users } = loadData();

      const user = users.find((u) => u.username === username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error("Invalid credentials");
      }

      // Generate token and set cookie
      const token = generateToken(user);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
      });

      return {
        token,
        user: { id: user.id, username: user.username },
      };
    },

    logout: (_, __, { res }) => {
      res.clearCookie("token");
      return true;
    },
  },
};

module.exports = resolvers;
