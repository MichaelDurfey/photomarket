import { useQuery } from "@apollo/client";
import { GET_PHOTOS } from "./lib/graphql";
import type { Route } from ".react-router/types/app/+types/index";
import AdobeConnect from "./components/AdobeConnect";
import https from "node:https";

interface Photo {
  id: number;
  title: string;
  url: string;
  price: number;
}

interface PhotosData {
  photos: Photo[];
}

interface NodeFetchRequestInit extends RequestInit {
  agent?: https.Agent;
}

const allowInsecureSsl =
  typeof process !== "undefined" && process.env.ALLOW_INSECURE_SSL === "true";

if (allowInsecureSsl && typeof process !== "undefined") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Loader function for SSR data fetching
export async function loader(args: Route.LoaderArgs) {
  console.log("🔍 Loader called in index.tsx");

  // Fetch directly from GraphQL API for SSR (loadContext is populated after loaders run)
  // For SSR, we'll fetch directly from the backend GraphQL endpoint
  const graphqlUrl =
    process.env.GRAPHQL_URL || "https://localhost:3000/graphql";

  console.log(`  → Fetching from GraphQL endpoint: ${graphqlUrl}`);

  const agent =
    allowInsecureSsl && typeof window === "undefined"
      ? new https.Agent({
          rejectUnauthorized: false,
        })
      : undefined;

  try {
    const fetchOptions: NodeFetchRequestInit = {
      method: "POST",
      ...(agent ? { agent } : {}),
      headers: {
        "Content-Type": "application/json",
        // Pass cookies for authentication if available
        ...(args.request?.headers?.get("cookie") && {
          Cookie: args.request.headers.get("cookie")!,
        }),
      },
      body: JSON.stringify({
        query: `
          query GetPhotos {
            photos(albumName: "Europe 2025") {
              id
              title
              url
              price
            }
          }
        `,
      }),
    };

    const response = await fetch(graphqlUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return { photos: [] };
    }

    const data = result.data as PhotosData;
    console.log(
      `✅ Loader fetched ${data.photos?.length || 0} photos from GraphQL`,
    );
    return { photos: data.photos || [] };
  } catch (error) {
    console.error("❌ Error fetching photos in loader:", error);
    return { photos: [] };
  }
}

export default function Index(props: Route.ComponentProps) {
  const loaderData = props.loaderData as { photos?: Photo[] } | undefined;

  // Use loader data if available (SSR), otherwise fall back to client-side query
  const {
    data: queryData,
    loading,
    error,
  } = useQuery<PhotosData>(GET_PHOTOS, {
    skip: !!loaderData?.photos, // Skip if we have SSR data
  });

  // Prefer SSR data, fall back to client query
  const photos = (loaderData?.photos || queryData?.photos || []) as Photo[];
  const isLoading = !loaderData && loading;
  const hasError = error;

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <AdobeConnect />
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Photos for Sale
        </h2>

        {isLoading && <div className="text-center">Loading photos...</div>}

        {hasError && (
          <div className="text-red-600">
            {error?.message || "Failed to fetch photos"}
          </div>
        )}

        {photos.length > 0 && !isLoading && !hasError && (
          <div className="flex flex-wrap justify-center">
            {photos.map((photo: Photo) => (
              <div
                key={photo.id}
                className="w-[250px] rounded overflow-hidden shadow-lg m-4"
              >
                <img
                  className="w-full max-w-[250px] h-auto"
                  src={photo.url}
                  alt={photo.title}
                />
                <div className="px-6 py-4">
                  <div className="font-bold text-xl mb-2">{photo.title}</div>
                  <p className="text-gray-700 text-base">${photo.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
