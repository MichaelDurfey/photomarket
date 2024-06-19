import React, { useEffect, useState } from "react";
import axios from "axios";

// Define a type for the photo object to improve type safety
interface Photo {
  id: number;
  url: string;
  title: string;
  price: number;
}

const PhotoList: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await axios.get<Photo[]>(
          "http://localhost:3000/api/photos",
          { withCredentials: true }
        );
        setPhotos(response.data);
      } catch (err) {
        setError("There was an error fetching the photos!");
        console.error(err);
      }
    };

    fetchPhotos();
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold text-center my-8">Photos for Sale</h1>
      <div className="flex flex-wrap justify-center">
        {photos.map((photo) => (
          <div className="max-w-sm rounded overflow-hidden shadow-lg m-4">
            <img className="w-full" src={photo.url} alt={photo.title} />
            <div className="px-6 py-4">
              <div className="font-bold text-xl mb-2">{photo.title}</div>
              <p className="text-gray-700 text-base">${photo.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoList;
