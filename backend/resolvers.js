const fs = require("fs");
const path = require("path");
const adobeLightroom = require("./services/adobe-lightroom");

const DATA_DIR = path.join(__dirname, "data");
const PHOTOS_FILE = path.join(DATA_DIR, "photos.json");
const PHOTOS_FILE_LEGACY = path.join(__dirname, "photos.json");

const loadPhotos = () => {
  try {
    const photosPath = fs.existsSync(PHOTOS_FILE)
      ? PHOTOS_FILE
      : fs.existsSync(PHOTOS_FILE_LEGACY)
        ? PHOTOS_FILE_LEGACY
        : null;
    if (!photosPath) return [];
    return JSON.parse(fs.readFileSync(photosPath, "utf-8"));
  } catch {
    return [];
  }
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
        return loadPhotos();
      }

      try {
        const adobePhotos = await adobeLightroom.getPhotos(options);
        if (adobePhotos && adobePhotos.length > 0) {
          return adobePhotos;
        }
      } catch (error) {
        console.error("Error fetching from Adobe Lightroom:", error.message);
      }

      return loadPhotos();
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

      const photos = loadPhotos();
      return photos.find((photo) => photo.id.toString() === id);
    },

    me: (_, __, context) => {
      return context.user || null;
    },
  },

  Mutation: {
    logout: (_, __, { res }) => {
      res.clearCookie("token");
      return true;
    },
  },
};

module.exports = resolvers;
