import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router";
import Index from "./routes/_index";
import Login from "./routes/login";
import Register from "./routes/register";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    children: [
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
    <RouterProvider router={router} />
  </StrictMode>
);
