const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { ApolloServer } = require("apollo-server-express");
const typeDefs = require("./schema");
const resolvers = require("./resolvers");
const { createContext } = require("./auth");

const app = express();
const PORT = 3000;
const siteOrigin = "http://localhost";

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (origin.indexOf(siteOrigin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());

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
