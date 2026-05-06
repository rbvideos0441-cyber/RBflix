import { useState, useEffect } from "react";
import MovieRow from "../components/MovieRow";
import axios from "axios";

export default function MyList() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await axios.get("/api/movies");
        setMovies(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMovies();
  }, []);

  return (
    <div className="pt-32 px-4 md:px-12 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Minha Lista</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-12 gap-x-4">
        {movies.map((movie: any) => (
          <div key={movie.id} className="cursor-pointer group relative">
             <img src={movie.thumbnailUrl} alt={movie.title} className="rounded aspect-video object-cover group-hover:brightness-50 transition" />
             <p className="mt-2 text-sm font-medium">{movie.title}</p>
          </div>
        ))}
      </div>
      {movies.length === 0 && (
         <div className="text-zinc-500 text-center mt-20">
            Você ainda não adicionou nada à sua lista.
         </div>
      )}
    </div>
  );
}
