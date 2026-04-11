import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router";
import { createClient } from "./lib/apollo-client";
import { ApolloProvider } from "@apollo/client";
import Root from "./root";
import Index from "./index";
import Login from "./login";
import Register from "./register";

const apolloState = (window as Window & { __APOLLO_STATE__?: Parameters<typeof createClient>[0] }).__APOLLO_STATE__;

// Create Apollo Client with SSR cache state
const apolloClient = createClient(apolloState);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Index {...({ loaderData: undefined } as Parameters<typeof Index>[0])} />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
    ],
  },
]);

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

// Use hydrateRoot for SSR instead of createRoot
hydrateRoot(
  container,
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <RouterProvider router={router} />
    </ApolloProvider>
  </StrictMode>
);
