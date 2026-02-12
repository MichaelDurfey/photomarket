import { type RouteConfigEntry, route, index } from "@react-router/dev/routes";

export default [
  index("./index.tsx"),
  route("login", "./login.tsx"),
  route("register", "./register.tsx"),
] satisfies RouteConfigEntry[];
