import { createContext } from "react-router";
import type { ApolloClient } from "@apollo/client";

export const apolloContext = createContext<ApolloClient | null>(null);
