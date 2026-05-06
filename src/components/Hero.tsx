import { Play, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../App";

export default function Hero({ movie }: { movie: any }) {
  const navigate = useNavigate();
  const { appSettings } = useAuth();

  if (!movie) return <div className="h-[95vh] bg-netflix-dark" />;

  const siteName = appSettings?.siteName || "RBFLIX";

  return (
    <div className="relative h-[95vh] w-full">
      <img 
        src={movie.thumbnailUrl} 
        alt={movie.title} 
        className="w-full h-full object-cover brightness-[0.7]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-dark via-transparent to-transparent" />
      
      <div className="absolute bottom-[25%] left-4 md:left-12 max-w-xl z-20">
        {/* Removed duplicate site name */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-4"
        >
          {(movie.type === 'series' || movie.isSeries) && (
            <span className="text-zinc-400 font-bold text-sm uppercase tracking-widest bg-zinc-800/80 px-2 py-0.5 rounded">Série</span>
          )}
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl md:text-7xl font-bold mb-4 drop-shadow-2xl"
        >
          {movie.title}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-lg mb-6 line-clamp-3 text-zinc-300 drop-shadow"
        >
          {movie.description}
        </motion.p>
        
        <div className="flex gap-3 mt-8">
          <button 
            onClick={() => navigate(`/watch/${movie.id}`)}
            className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded font-bold hover:bg-white/80 transition shadow-lg shrink-0"
          >
            <Play className="w-6 h-6 fill-current" />
            Assistir
          </button>
          <button 
            onClick={() => {
              if (movie.type === 'series' || movie.isSeries) {
                navigate(`/series/${movie.id}`);
              } else {
                navigate(`/watch/${movie.id}`);
              }
            }}
            className="flex items-center gap-2 bg-zinc-500/50 text-white px-6 md:px-8 py-2 md:py-3 rounded font-bold hover:bg-zinc-500/30 transition backdrop-blur-md shadow-lg shrink-0"
          >
            <Info className="w-6 h-6" />
            Mais Informações
          </button>
        </div>
      </div>
    </div>
  );
}
