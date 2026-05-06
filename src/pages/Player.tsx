import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Hls from "hls.js";
import { ArrowLeft, Play, Pause, RotateCcw, RotateCw, Volume2, Maximize, Settings, List, X } from "lucide-react";
import { movieService } from "../services/movieService";
import { cn } from "../lib/utils";

export default function Player() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [movie, setMovie] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEpisodes, setShowEpisodes] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (movieId) {
        const data = await movieService.getMovieById(movieId);
        setMovie(data);
        const movieData = data as any;
        if (movieData?.isSeries && movieData?.seriesId) {
          const eps = await movieService.getEpisodesBySeries(movieData.seriesId);
          setEpisodes(eps || []);
        }
      }
    };
    fetchData();
  }, [movieId]);

  useEffect(() => {
    let hls: Hls | null = null;
    let isMounted = true;

    if (movie && videoRef.current) {
      const video = videoRef.current;
      
      const startPlayback = async () => {
        if (!video || !isMounted) return;
        try {
          // Fetch history to resume
          if (movieId) {
            const history = await movieService.getWatchHistory("primary") as any[];
            const item = history.find((h: any) => h.mediaId === movieId);
            if (item && item.progressSeconds > 0) {
              console.log("Resuming from", item.progressSeconds);
              video.currentTime = item.progressSeconds;
            }
          }
          
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (error) {
          console.log("Autoplay was prevented or interrupted:", error);
        }
      };

      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(movie.hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isMounted) startPlayback();
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = movie.hlsUrl;
        video.addEventListener('loadedmetadata', () => {
          if (isMounted) startPlayback();
        });
      }
    }

    return () => {
      isMounted = false;
      if (hls) {
        hls.detachMedia();
        hls.destroy();
      }
    };
  }, [movie]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((error) => {
              console.error("Erro ao iniciar reprodução:", error);
            });
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      
      if (isFinite(current) && isFinite(total) && total > 0) {
        setProgress((current / total) * 100);
        setDuration(total);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const total = videoRef.current.duration;
      if (isFinite(total) && total > 0) {
        const time = (parseFloat(e.target.value) / 100) * total;
        if (isFinite(time)) {
          videoRef.current.currentTime = time;
        }
      }
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  // Record history periodically
  useEffect(() => {
    if (!movie || !movieId) return;

    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        movieService.updateWatchHistory(
          "primary", 
          movieId, 
          videoRef.current.currentTime,
          movie.genres
        ).catch(console.error);
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [movie, movieId]);

  // Record history on unmount or pause
  useEffect(() => {
    return () => {
      if (videoRef.current && movieId && movie) {
        movieService.updateWatchHistory(
          "primary", 
          movieId, 
          videoRef.current.currentTime,
          movie.genres
        ).catch(console.error);
      }
    };
  }, [movieId, movie]);

  return (
    <div ref={containerRef} className="h-screen w-screen bg-black relative flex items-center justify-center group">
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Overlays */}
      <div className="absolute inset-x-0 top-0 p-8 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-6 z-50">
        <ArrowLeft className="w-10 h-10 cursor-pointer hover:scale-110 transition" onClick={() => navigate("/")} />
        <h1 className="text-2xl font-medium">{movie?.title}</h1>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
        {/* Progress Bar */}
        <div className="relative w-full h-1 group/progress mb-8">
           <input 
             type="range" 
             className="absolute inset-0 w-full opacity-0 z-20 cursor-pointer"
             min="0" max="100" step="0.1" value={progress}
             onChange={handleSeek}
           />
           <div className="absolute inset-0 bg-white/30 rounded" />
           <div 
             className="absolute inset-y-0 left-0 bg-netflix-red rounded transition-all duration-100" 
             style={{ width: `${progress}%` }} 
           />
           <div 
             className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-netflix-red rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
             style={{ left: `${progress}%` }}
           />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={togglePlay} className="hover:scale-110 transition">
              {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white" />}
            </button>
            <RotateCcw className="w-8 h-8 cursor-pointer" onClick={() => {
              if (videoRef.current && isFinite(videoRef.current.currentTime)) {
                videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
              }
            }} />
            <RotateCw className="w-8 h-8 cursor-pointer" onClick={() => {
              if (videoRef.current && isFinite(videoRef.current.currentTime) && isFinite(videoRef.current.duration)) {
                videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
              }
            }} />
            <div className="flex items-center gap-4 group/vol">
               <Volume2 className="w-8 h-8" />
               <div className="w-0 group-hover/vol:w-24 overflow-hidden transition-all duration-300">
                  <input type="range" className="w-full accent-netflix-red" />
               </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {movie?.isSeries && (
              <button 
                onClick={() => setShowEpisodes(true)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded transition"
              >
                <List className="w-8 h-8" />
                <span className="hidden md:inline font-medium">Episódios</span>
              </button>
            )}
            <Settings className="w-8 h-8" />
            <Maximize className="w-8 h-8 cursor-pointer" onClick={toggleFullscreen} />
          </div>
        </div>
      </div>

      {/* Episodes Drawer */}
      {showEpisodes && (
        <div className="absolute inset-y-0 right-0 w-full md:w-96 bg-zinc-950/95 z-[100] border-l border-zinc-800 flex flex-col p-8 transition-transform duration-300">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Episódios</h2>
              <X className="w-8 h-8 cursor-pointer hover:scale-110 transition" onClick={() => setShowEpisodes(false)} />
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
              {episodes.sort((a, b) => (a.season - b.season) || (a.episode - b.episode)).map((ep) => (
                <div 
                  key={ep.id}
                  onClick={() => {
                    navigate(`/watch/${ep.id}`);
                    setShowEpisodes(false);
                  }}
                  className={cn(
                    "flex gap-4 p-3 rounded-lg cursor-pointer transition",
                    ep.id === movieId ? "bg-white/10 border border-zinc-700" : "hover:bg-white/5"
                  )}
                >
                   <div className="w-24 aspect-video rounded overflow-hidden flex-shrink-0 relative">
                      <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover" />
                      {ep.id === movieId && (
                         <div className="absolute inset-0 bg-netflix-red/20 flex items-center justify-center">
                            <Play className="w-6 h-6 fill-white" />
                         </div>
                      )}
                   </div>
                   <div className="flex-1">
                      <p className="text-xs text-zinc-500 font-bold mb-1">P{ep.season} : E{ep.episode}</p>
                      <h3 className="font-bold text-sm line-clamp-1">{ep.title}</h3>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
