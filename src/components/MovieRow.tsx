import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

interface Movie {
  id: string;
  title: string;
  thumbnailUrl: string;
  isSeries?: boolean; // Individual episode
  type?: 'series'; // Series container
  progress?: number;
  duration?: string; // e.g. "1h 30m" or seconds
}

export default function MovieRow({ title, movies }: { title: string, movies: Movie[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isMoved, setIsMoved] = useState(false);

  const handleClick = (direction: "left" | "right") => {
    setIsMoved(true);
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-2 group/row px-4 md:px-0">
      <h2 className="text-xl font-bold transition-colors cursor-pointer hover:text-zinc-400 inline-block">
        {title}
      </h2>
      
      <div className="relative group">
        <ChevronLeft 
          className={cn(
            "absolute top-0 bottom-0 left-0 z-40 m-auto h-full w-12 cursor-pointer opacity-0 transition hover:scale-125 group-hover/row:opacity-100 bg-black/60 p-2",
            !isMoved && "hidden"
          )}
          onClick={() => handleClick("left")}
        />
        
        <div 
          ref={rowRef}
          className="flex items-center gap-2 overflow-x-scroll no-scrollbar scroll-smooth p-2"
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
        
        <ChevronRight 
          className="absolute top-0 bottom-0 right-0 z-40 m-auto h-full w-12 cursor-pointer opacity-0 transition hover:scale-125 group-hover/row:opacity-100 bg-black/60 p-2"
          onClick={() => handleClick("right")}
        />
      </div>
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  const navigate = useNavigate();

  const handlePlay = () => {
    if (movie.type === 'series') {
      navigate(`/series/${movie.id}`);
    } else {
      navigate(`/watch/${movie.id}`);
    }
  };

  return (
    <div 
      onClick={handlePlay}
      className="relative min-w-[200px] h-[120px] md:min-w-[240px] md:h-[140px] cursor-pointer transition duration-300 transform ease-out hover:scale-110 hover:z-50 bg-zinc-900 rounded overflow-hidden"
    >
      <img 
        src={movie.thumbnailUrl} 
        alt={movie.title} 
        className="w-full h-full object-cover"
      />
      
      {movie.progress !== undefined && movie.progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-600">
          <div 
            className="h-full bg-netflix-red" 
            style={{ width: `${Math.min(100, (movie.progress / 5400) * 100)}%` }} // 1.5h fallback
          />
        </div>
      )}

      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
        <div className="flex gap-2 mb-2">
          <div 
            className="p-2 bg-white rounded-full hover:bg-zinc-200 transition"
          >
            <Play className="w-4 h-4 fill-black text-black" />
          </div>
          <div className="p-2 border border-zinc-500 rounded-full hover:border-white transition">
            <Plus className="w-4 h-4" />
          </div>
          <div className="p-2 border border-zinc-500 rounded-full hover:border-white transition">
            <ThumbsUp className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs font-bold truncate">{movie.title}</p>
        {movie.type === 'series' && <p className="text-[10px] text-netflix-red font-bold uppercase mt-1">Série</p>}
      </div>
    </div>
  );
}
