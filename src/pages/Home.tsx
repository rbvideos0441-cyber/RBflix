import { useState, useEffect } from "react";
import Hero from "../components/Hero";
import MovieRow from "../components/MovieRow";
import { movieService } from "../services/movieService";
import { useAuth } from "../App";

export default function Home() {
  const [content, setContent] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const { appSettings } = useAuth();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [moviesData, seriesData] = await Promise.all([
          movieService.getMovies(),
          movieService.getSeries()
        ]);
        
        // Filter out episodes (which are in the movies collection with isSeries: true)
        const standaloneMovies = (moviesData || []).filter((m: any) => !m.isSeries);
        const formatSeries = (seriesData || []).map((s: any) => ({ ...s, type: 'series' }));
        const allContent = [...standaloneMovies, ...formatSeries];
        
        setContent(allContent);

        // Fetch watch history for Continue Watching
        const history = await movieService.getWatchHistory("primary") as any[];
        if (history && history.length > 0) {
          const continueList = history
            .map((h: any) => {
              const matched = allContent.find(c => c.id === h.mediaId);
              return matched ? { ...matched, progress: h.progressSeconds } : null;
            })
            .filter(Boolean)
            .sort((a: any, b: any) => {
               const histA = history.find((h: any) => h.mediaId === a.id);
               const histB = history.find((h: any) => h.mediaId === b.id);
               return (histB?.lastWatched?.seconds || 0) - (histA?.lastWatched?.seconds || 0);
            })
            .slice(0, 10);
          setContinueWatching(continueList);
        }

        // Fetch recommendations
        const recs = await movieService.getRecommendations("primary", allContent);
        setRecommendations(recs);
      } catch (err) {
        console.error(err);
      }
    };
    fetchContent();
  }, []);

  const getContentByGenre = (genre: string) => {
    return content.filter(m => m.genres?.includes(genre));
  };

  const genres = appSettings?.genres || ["Ação", "Drama", "Ficção Científica", "Terror", "Comédia"];

  return (
    <div className="pb-20">
      <Hero movie={content[0]} />
      
      <div className="mt-[-40px] md:mt-[-60px] relative z-10 space-y-12 pl-4 md:pl-12 overflow-hidden">
        {continueWatching.length > 0 && (
          <MovieRow title="Continuar Assistindo" movies={continueWatching} />
        )}
        {recommendations.length > 0 && (
          <MovieRow title="Recomendados para Você" movies={recommendations} />
        )}
        <MovieRow title="Populares" movies={content.filter(m => m.popular)} />
        
        {genres.map(genre => {
          const filtered = getContentByGenre(genre);
          if (filtered.length === 0) return null;
          return <MovieRow key={genre} title={genre} movies={filtered} />;
        })}
      </div>
    </div>
  );
}
