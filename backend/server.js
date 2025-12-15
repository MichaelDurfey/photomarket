require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const { createContext } = require("./auth");
const adobeLightroom = require("./services/adobe-lightroom");

const app = express();
const PORT = 3000;
const allowedOrigins = [
  "http://localhost",
  "http://localhost:3001",
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
  })
);

app.use(cookieParser());
app.use(express.json());

// Adobe Lightroom OAuth routes
app.get("/auth/adobe", (req, res) => {
  const authUrl = adobeLightroom.getAuthorizationUrl();
  res.redirect(authUrl);
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
      "seconds"
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
          // Log successful operations
          if (response.data) {
            console.log("GraphQL Operation", response.data);
          }
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

  app.listen(PORT, () => {
    console.log(
      `🚀 Apollo Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(
      `📊 GraphQL Playground available at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

startServer().catch(console.error);
