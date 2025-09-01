import { Outlet } from "react-router";
import { ApolloProvider } from "@apollo/client";
import { client } from "./lib/apollo-client";
import { useEffect, useState } from "react";

export default function Root() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const content = (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <a href="/" className="text-xl font-bold text-gray-900">
                  Photo Store
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/login"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </a>
              <a
                href="/register"
                className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Register
              </a>
            </div>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );

  // Only wrap with ApolloProvider on the client side
  if (isClient) {
    return <ApolloProvider client={client}>{content}</ApolloProvider>;
  }

  // Return content without ApolloProvider for SSR
  return content;
}
