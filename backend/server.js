require("dotenv").config();
const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const { createContext } = require("./auth");
const adobeLightroom = require("./services/adobe-lightroom");

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === "true";
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;
const SSL_PASSPHRASE = process.env.SSL_PASSPHRASE;
const allowedOrigins = [
  "http://localhost",
  "http://localhost:3001",
  "https://localhost",
  "https://localhost:3001",
  "https://studio.apollographql.com",
];

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

// Adobe Lightroom OAuth routes
app.get("/auth/adobe", (req, res) => {
  const authUrl = adobeLightroom.getAuthorizationUrl();
  res.redirect(authUrl);
});

app.get("/api/adobe/albums", async (req, res) => {
  try {
    const albums = await adobeLightroom.getAlbums();
    res.json(albums);
  } catch (error) {
    console.error("Albums error:", error.message);
    res
      .status(error.message?.includes("401") ? 401 : 502)
      .json({ error: error.message });
  }
});

app.get("/api/adobe/photos", async (req, res) => {
  const options = {
    ...(req.query.limit && { limit: parseInt(req.query.limit, 10) }),
    ...(req.query.offset && { offset: req.query.offset }),
    ...(req.query.subtype && { subtype: req.query.subtype }),
    ...(req.query.albumId && { albumId: req.query.albumId }),
    ...(req.query.albumName && { albumName: req.query.albumName }),
    ...(req.query.minRating != null && {
      minRating: parseInt(req.query.minRating, 10),
    }),
  };
  console.log("Get Photo options:", options);
  const photos = await adobeLightroom.getPhotos(options);
  res.json(photos);
});

// Proxy for Adobe rendition images so <img src="..."> works without exposing the OAuth token.
// Frontend uses photo.url (e.g. /api/adobe/rendition/:catalogId/:assetId?type=2048) with this server as origin.
app.get("/api/adobe/rendition/:catalogId/:assetId", async (req, res) => {
  const { catalogId, assetId } = req.params;
  const type = req.query.type || "640";
  try {
    const { buffer, contentType } = await adobeLightroom.getRendition(
      catalogId,
      assetId,
      type,
    );
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "private, max-age=3600");
    res.send(buffer);
  } catch (error) {
    const status =
      error.message && error.message.includes("401")
        ? 401
        : error.message && error.message.includes("404")
          ? 404
          : 502;
    res.status(status).json({ error: error.message });
  }
});

app.get("/auth/adobe/callback", async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`Authentication failed: ${error}`);
  }

  if (!code) {
    return res.status(400).send("No authorization code provided");
  }

  // Validate credentials are configured
  if (!adobeLightroom.clientId || !adobeLightroom.clientSecret) {
    return res.status(500).send(`
      <html>
        <body>
          <h1>Configuration Error</h1>
          <p>Adobe API credentials are not configured.</p>
          <p>Please set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET in your .env file.</p>
          <p>Check backend/README_ADOBE.md for setup instructions.</p>
        </body>
      </html>
    `);
  }

  try {
    const tokenResponse = await adobeLightroom.exchangeCodeForToken(code);

    // Store tokens (in production, save to database)
    // For now, we'll just log them - you should store them securely
    console.log("Adobe authentication successful!");
    console.log(
      "Access token expires in:",
      tokenResponse.expires_in,
      "seconds",
    );

    // In production, save tokens to database associated with user
    // For now, the service instance will hold the token

    res.send(`
      <html>
        <head>
          <title>Adobe Lightroom Connected</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .success-box {
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              text-align: center;
            }
            h1 {
              color: #2d3748;
              margin-bottom: 10px;
            }
            p {
              color: #4a5568;
              line-height: 1.6;
            }
            .checkmark {
              color: #48bb78;
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="success-box">
            <div class="checkmark">✓</div>
            <h1>Adobe Lightroom Connected!</h1>
            <p>Your Adobe Lightroom account has been successfully connected.</p>
            <p>Your photos will now be displayed in the photo store.</p>
            <p style="margin-top: 20px; font-size: 14px; color: #718096;">
              You can close this window and return to the photo store.
            </p>
          </div>
          <script>
            setTimeout(() => {
              if (window.opener) {
                window.close();
              } else {
                window.location.href = 'http://localhost:3001';
              }
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Token exchange error:", error);
    res.status(500).send(`Failed to exchange token: ${error.message}`);
  }
});

// Check Adobe connection status
app.get("/api/adobe/status", (req, res) => {
  res.json({
    connected: adobeLightroom.isConnected(),
    hasClientId: !!process.env.ADOBE_CLIENT_ID,
  });
});

// Disconnect Adobe account (admin only - in production, add authentication)
app.post("/api/adobe/disconnect", (req, res) => {
  adobeLightroom.clearTokens();
  res.json({ success: true, message: "Adobe account disconnected" });
});

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: createContext,
  formatError: (error) => {
    // Log the error for debugging
    console.error("GraphQL Error", error);

    // Return a user-friendly error message
    return {
      message: error.message,
      code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
    };
  },
  plugins: [
    {
      requestDidStart: () => ({
        willSendResponse({ response }) {
          // // Log successful operations
          // if (response.data) {
          //   console.log("GraphQL Operation", response.data);
          // }
        },
      }),
    },
  ],
});

// Start the server
async function startServer() {
  await server.start();

  // Apply Apollo Server middleware to Express
  server.applyMiddleware({
    app,
    cors: false, // We're handling CORS with Express
    path: "/graphql",
  });

  const createListener = () => {
    if (!HTTPS_ENABLED) {
      return http.createServer(app);
    }

    if (!SSL_KEY_PATH || !SSL_CERT_PATH) {
      throw new Error(
        "HTTPS_ENABLED is true but SSL_KEY_PATH or SSL_CERT_PATH is not configured.",
      );
    }

    const httpsOptions = {
      key: fs.readFileSync(SSL_KEY_PATH),
      cert: fs.readFileSync(SSL_CERT_PATH),
      passphrase: SSL_PASSPHRASE,
    };
    return https.createServer(httpsOptions, app);
  };

  const protocol = HTTPS_ENABLED ? "https" : "http";
  const listener = createListener();

  listener.listen(PORT, () => {
    console.log(
      `🚀 Apollo Server ready at ${protocol}://localhost:${PORT}${server.graphqlPath}`,
    );
    console.log(
      `📊 GraphQL Playground available at ${protocol}://localhost:${PORT}${server.graphqlPath}`,
    );
  });
}

startServer().catch(console.error);
