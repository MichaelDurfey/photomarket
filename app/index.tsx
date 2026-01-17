import { useQuery } from "@apollo/client";
import { GET_PHOTOS } from "./lib/graphql";
import type { Route } from ".react-router/types/app/+types/index";
import AdobeConnect from "./components/AdobeConnect";

interface Photo {
  id: number;
  title: string;
  url: string;
  price: number;
}

interface PhotosData {
  photos: Photo[];
}

// Loader function for SSR data fetching
export async function loader(args: Route.LoaderArgs) {
  console.log("🔍 Loader called in index.tsx");
  console.log("   args.context keys:", Object.keys(args.context || {}));

  // React Router 7 passes loadContext as context in loader args
  const apolloClient = (args.context as any)?.apolloClient;
  console.log(
    "   apolloClient in loader:",
    apolloClient ? "found ✅" : "MISSING ❌"
  );

  if (apolloClient) {
    console.log("   → Using Apollo Client to fetch photos");
    try {
      const result = await apolloClient.query({
        query: GET_PHOTOS,
        fetchPolicy: "network-only", // Always fetch fresh data on server
      });
      const data = result.data as PhotosData;
      return { photos: data.photos };
    } catch (error) {
      console.error("Error fetching photos:", error);
      return { photos: [] };
    }
  }

  return { photos: [] };
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
                className="max-w-sm rounded overflow-hidden shadow-lg m-4"
              >
                <img className="w-full" src={photo.url} alt={photo.title} />
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
