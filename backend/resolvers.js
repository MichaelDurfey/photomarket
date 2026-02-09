const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const adobeLightroom = require("./services/adobe-lightroom");

const SECRET_KEY = "your_secret_key"; // Use a strong secret key in production

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });
};

// Helper function to get current user from context
const getCurrentUser = (context) => {
  const token = context.req.cookies.token;
  if (!token) return null;

  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};

// Load data from JSON files
const loadData = () => {
  const photos = JSON.parse(fs.readFileSync("photos.json", "utf-8"));
  const users = JSON.parse(fs.readFileSync("users.json", "utf-8"));
  return { photos, users };
};

// Save users to JSON file
const saveUsers = (users) => {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
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
      console.log("🔍 GraphQL photos query called");
      const options = {
        ...(args.minRating != null && { minRating: args.minRating }),
        ...(args.albumId && { albumId: args.albumId }),
        ...(args.albumName && { albumName: args.albumName }),
        ...(args.subtype && { subtype: args.subtype }),
        ...(args.limit != null && { limit: args.limit }),
        ...(args.offset && { offset: args.offset }),
      };

      // Check if Adobe is connected
      if (!adobeLightroom.isConnected()) {
        return [];
      }

      try {
        console.log("  → Attempting to fetch from Adobe Lightroom...");
        const adobePhotos = await adobeLightroom.getPhotos(options);
        console.log(`  → Adobe returned ${adobePhotos?.length || 0} photos`);

        if (adobePhotos && adobePhotos.length > 0) {
          console.log("  ✅ Returning Adobe photos");
          return adobePhotos;
        } else {
          console.log(
            "  ⚠️  Adobe returned empty array, falling back to local photos"
          );
        }
      } catch (error) {
        console.error("  ❌ Error fetching from Adobe:", error.message);
        console.error("  ❌ Error stack:", error.stack);
        console.warn(
          "Adobe Lightroom API not available, falling back to local photos:",
          error.message
        );
      }

      // Fallback to local JSON file if Adobe API is not configured or fails
      console.log("  → Loading local photos from photos.json");
      const { photos } = loadData();
      return photos;
    },

    photo: async (_, { id }) => {
      try {
        const adobePhotos = await adobeLightroom.getPhotos();
        const photo = adobePhotos.find((p) => p.id.toString() === id);
        if (photo) {
          return photo;
        }
      } catch (error) {
        console.warn(
          "Adobe Lightroom API not available, falling back to local photos:",
          error.message
        );
      }

      // Fallback to local JSON file
      const { photos } = loadData();
      return photos.find((photo) => photo.id.toString() === id);
    },

    me: (_, __, context) => {
      return getCurrentUser(context);
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

      // Hash password and create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: users.length + 1,
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
