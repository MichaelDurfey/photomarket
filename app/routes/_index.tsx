import { useEffect, useState } from "react";
import { gql } from "graphql-request";
import { graphqlClient } from "../lib/graphql-server";

interface Photo {
  id: number;
  title: string;
  url: string;
  price: number;
}

interface PhotosResponse {
  photos: Photo[];
}

// Main page component
export default function Index() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const query = gql`
          query GetPhotos {
            photos {
              id
              title
              url
              price
            }
          }
        `;

        const data = await graphqlClient.request<PhotosResponse>(query);
        setPhotos(data.photos);
      } catch (err) {
        setError("Failed to fetch photos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Photos for Sale
        </h2>

        {loading && <div className="text-center">Loading photos...</div>}

        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="flex flex-wrap justify-center">
            {photos.map((photo) => (
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
