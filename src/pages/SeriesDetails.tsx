import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Play, Info } from "lucide-react";
import { movieService } from "../services/movieService";

export default function SeriesDetails() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const [series, setSeries] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (seriesId) {
        try {
          const s = await movieService.getSeriesById(seriesId);
          const eps = await movieService.getEpisodesBySeries(seriesId);
          setSeries(s);
          setEpisodes(eps || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [seriesId]);

  if (loading) return <div className="min-h-screen bg-netflix-dark flex items-center justify-center">Carregando...</div>;
  if (!series) return <div className="min-h-screen bg-netflix-dark flex items-center justify-center">Série não encontrada.</div>;

  return (
    <div className="min-h-screen bg-netflix-dark pb-20">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full">
        <img 
          src={series.thumbnailUrl} 
          alt={series.title} 
          className="w-full h-full object-cover brightness-[0.4]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-dark via-transparent to-transparent" />
        
        <div className="absolute top-24 left-4 md:left-12 space-y-6 max-w-2xl">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition mb-4">
             <ArrowLeft className="w-6 h-6" /> Voltar
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{series.title}</h1>
          <p className="text-lg text-zinc-300 leading-relaxed line-clamp-3">{series.description}</p>
          
          <div className="flex items-center gap-4 pt-4">
             {episodes.length > 0 && (
               <button 
                 onClick={() => navigate(`/watch/${episodes[0].id}`)}
                 className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-bold hover:bg-white/90 transition"
               >
                 <Play className="w-6 h-6 fill-black" /> Assistir T1:E1
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="px-4 md:px-12 mt-12">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
           Episódios <span className="text-zinc-500 text-sm font-normal">({episodes.length})</span>
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          {episodes.sort((a, b) => (a.season - b.season) || (a.episode - b.episode)).map((ep) => (
            <div 
              key={ep.id}
              onClick={() => navigate(`/watch/${ep.id}`)}
              className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition cursor-pointer group"
            >
              <div className="w-12 text-center text-xl font-bold text-zinc-500 group-hover:text-white transition">
                {ep.episode}
              </div>
              <div className="relative w-40 aspect-video rounded overflow-hidden flex-shrink-0">
                 <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white" />
                 </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                   <h3 className="font-bold text-lg">{ep.title}</h3>
                   <span className="text-zinc-500 text-xs">Temporada {ep.season}</span>
                </div>
                <p className="text-zinc-400 text-sm line-clamp-2">{ep.description}</p>
              </div>
            </div>
          ))}
          {episodes.length === 0 && (
            <div className="text-center py-20 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
               <p className="text-zinc-500">Nenhum episódio cadastrado para esta série ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
