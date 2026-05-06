import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { PlusCircle, Film, CheckCircle2, List, Tv, ArrowLeft, Pencil, Trash2, X, Users, ShieldCheck, ShieldAlert, Settings, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { movieService } from "../services/movieService";
import { userService } from "../services/userService";
import { settingsService, AppSettings, Plan } from "../services/settingsService";


export default function Admin() {
  const [tab, setTab] = useState<"movie" | "series" | "episode" | "users" | "settings">("movie");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Lists
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [episodesList, setEpisodesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Edit IDs
  const [editingId, setEditingId] = useState<string | null>(null);

  const [movieData, setMovieData] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    hlsUrl: "",
    year: new Date().getFullYear(),
    rating: "PG-13",
    trending: false,
    popular: false,
    genres: [] as string[]
  });

  const [seriesData, setSeriesData] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    totalSeasons: 1,
    genres: [] as string[]
  });

  const [episodeData, setEpisodeData] = useState({
    seriesId: "",
    title: "",
    description: "",
    hlsUrl: "",
    thumbnailUrl: "",
    season: 1,
    episode: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    fetchSeries();
    fetchMovies();
    fetchEpisodes();
    fetchUsers();
    fetchConfig();
  };

  const fetchConfig = async () => {
    const settings = await settingsService.getSettings();
    setAppSettings(settings);
  };

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchSeries = async () => {
    try {
      const q = query(collection(db, "series"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setSeriesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching series:", err);
    }
  };

  const fetchMovies = async () => {
    try {
      const q = query(collection(db, "movies"), where("isSeries", "==", false));
      const snapshot = await getDocs(q);
      setMoviesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching movies:", err);
    }
  };

  const fetchEpisodes = async () => {
    try {
      const q = query(collection(db, "movies"), where("isSeries", "==", true));
      const snapshot = await getDocs(q);
      setEpisodesList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching episodes:", err);
    }
  };

  const toggleGenre = (genre: string, currentGenres: string[], setFn: any) => {
    if (currentGenres.includes(genre)) {
      setFn(currentGenres.filter(g => g !== genre));
    } else {
      setFn([...currentGenres, genre]);
    }
  };

  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await movieService.updateMovie(editingId, { ...movieData });
      } else {
        await addDoc(collection(db, "movies"), {
          ...movieData,
          isSeries: false,
          createdAt: serverTimestamp()
        });
      }
      setSuccess(true);
      fetchMovies();
      resetForms();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar filme.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await movieService.updateSeries(editingId, { ...seriesData });
      } else {
        await addDoc(collection(db, "series"), {
          ...seriesData,
          createdAt: serverTimestamp()
        });
      }
      setSuccess(true);
      fetchSeries();
      resetForms();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar série.");
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!episodeData.seriesId) {
      alert("Por favor, selecione uma série.");
      return;
    }
    setLoading(true);
    try {
      const parentSeries = seriesList.find(s => s.id === episodeData.seriesId);
      const finalData = {
        ...episodeData,
        description: episodeData.description || parentSeries?.description || "",
        thumbnailUrl: episodeData.thumbnailUrl || parentSeries?.thumbnailUrl || "",
        season: episodeData.season || 1,
        isSeries: true,
        genres: parentSeries?.genres || [],
        year: (parentSeries as any)?.year || new Date().getFullYear(),
        rating: (parentSeries as any)?.rating || "PG-13",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
         await movieService.updateMovie(editingId, finalData);
         console.log("Episode updated:", editingId);
      } else {
        const docRef = await addDoc(collection(db, "movies"), finalData);
        console.log("Episode added with ID:", docRef.id);
      }
      
      setSuccess(true);
      await fetchEpisodes();
      resetForms();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error saving episode:", err);
      alert(`Erro ao salvar episódio: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: "movie" | "series") => {
    if (!window.confirm("Certeza que deseja excluir este conteúdo?")) return;
    
    setLoading(true);
    try {
      if (type === "movie") {
        await movieService.deleteMovie(id);
        fetchMovies();
        fetchEpisodes();
      } else {
        await movieService.deleteSeries(id);
        fetchSeries();
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir.");
    } finally {
      setLoading(false);
    }
  };

  const startEditMovie = (movie: any) => {
    setEditingId(movie.id);
    setMovieData({
      title: movie.title,
      description: movie.description,
      thumbnailUrl: movie.thumbnailUrl,
      hlsUrl: movie.hlsUrl,
      year: movie.year,
      rating: movie.rating || "PG-13",
      trending: movie.trending || false,
      popular: movie.popular || false,
      genres: movie.genres || []
    });
    setTab("movie");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditSeries = (series: any) => {
    setEditingId(series.id);
    setSeriesData({
      title: series.title,
      description: series.description,
      thumbnailUrl: series.thumbnailUrl,
      totalSeasons: series.totalSeasons,
      genres: series.genres || []
    });
    setTab("series");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEditEpisode = (ep: any) => {
    setEditingId(ep.id);
    setEpisodeData({
      seriesId: ep.seriesId,
      title: ep.title,
      description: ep.description,
      hlsUrl: ep.hlsUrl,
      thumbnailUrl: ep.thumbnailUrl,
      season: ep.season,
      episode: ep.episode
    });
    setTab("episode");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateStatus = async (uid: string, status: "active" | "incomplete") => {
    setLoading(true);
    try {
      let expiresAt = null;
      if (status === "active") {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        expiresAt = date;
      }
      await userService.updateSubscription(uid, "basic", status, expiresAt);
      fetchUsers();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status.");
    } finally {
      setLoading(false);
    }
  };
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appSettings) return;
    setLoading(true);
    try {
      await settingsService.updateSettings(appSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  const addFeature = (planIndex: number) => {
    if (!appSettings) return;
    const newPlans = [...appSettings.plans];
    newPlans[planIndex].features.push("");
    setAppSettings({ ...appSettings, plans: newPlans });
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    if (!appSettings) return;
    const newPlans = [...appSettings.plans];
    newPlans[planIndex].features.splice(featureIndex, 1);
    setAppSettings({ ...appSettings, plans: newPlans });
  };

  const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
    if (!appSettings) return;
    const newPlans = [...appSettings.plans];
    newPlans[planIndex].features[featureIndex] = value;
    setAppSettings({ ...appSettings, plans: newPlans });
  };

  const updatePlan = (index: number, field: keyof Plan, value: any) => {
    if (!appSettings) return;
    const newPlans = [...appSettings.plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setAppSettings({ ...appSettings, plans: newPlans });
  };

  const resetForms = () => {
    setEditingId(null);
    setMovieData({ title: "", description: "", thumbnailUrl: "", hlsUrl: "", year: new Date().getFullYear(), rating: "PG-13", trending: false, popular: false, genres: [] });
    setSeriesData({ title: "", description: "", thumbnailUrl: "", totalSeasons: 1, genres: [] });
    setEpisodeData({ seriesId: "", title: "", description: "", hlsUrl: "", thumbnailUrl: "", season: 1, episode: 1 });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="pt-32 px-4 md:px-12 max-w-6xl mx-auto pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition mb-6 group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Voltar para o Início
      </Link>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <PlusCircle className="w-10 h-10 text-netflix-red" />
          <h1 className="text-4xl font-bold">Painel Administrativo</h1>
        </div>
        
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button 
            onClick={() => { setTab("movie"); resetForms(); }}
            className={`px-4 py-2 rounded-md transition ${tab === "movie" ? "bg-netflix-red text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Filmes
          </button>
          <button 
            onClick={() => { setTab("series"); resetForms(); }}
            className={`px-4 py-2 rounded-md transition ${tab === "series" ? "bg-netflix-red text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Séries
          </button>
          <button 
            onClick={() => { setTab("episode"); resetForms(); }}
            className={`px-4 py-2 rounded-md transition ${tab === "episode" ? "bg-netflix-red text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Episódios
          </button>
          <button 
            onClick={() => { setTab("users"); resetForms(); }}
            className={`px-4 py-2 rounded-md transition ${tab === "users" ? "bg-netflix-red text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Usuários
          </button>
          <button 
            onClick={() => { setTab("settings"); resetForms(); }}
            className={`px-4 py-2 rounded-md transition ${tab === "settings" ? "bg-netflix-red text-white" : "text-zinc-400 hover:text-white"}`}
          >
            Configurações
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg shadow-2xl mb-12">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-medium flex items-center gap-2">
             {tab === "movie" && <Film className="w-5 h-5 text-netflix-red" />}
             {tab === "series" && <Tv className="w-5 h-5 text-netflix-red" />}
             {tab === "episode" && <List className="w-5 h-5 text-netflix-red" />}
             {tab === "users" && <Users className="w-5 h-5 text-netflix-red" />}
             {tab === "settings" && <Settings className="w-5 h-5 text-netflix-red" />}
             {tab === "settings" ? "Configurações Gerais" : tab === "users" ? "Gerenciar Usuários" : (editingId ? "Editar" : "Adicionar") + (tab === "movie" ? " Filme" : tab === "series" ? " Série" : " Episódio")}
           </h2>
           {editingId && (
             <button onClick={resetForms} className="flex items-center gap-1 text-zinc-400 hover:text-white transition text-sm">
                <X className="w-4 h-4" /> Cancelar Edição
             </button>
           )}
        </div>

        {tab === "settings" && appSettings && (
          <form onSubmit={handleSettingsSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Nome da Plataforma</label>
                <input 
                  required 
                  className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" 
                  value={appSettings.siteName} 
                  onChange={e => setAppSettings({...appSettings, siteName: e.target.value})} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-zinc-400 font-bold uppercase tracking-wider">WhatsApp para Suporte (apenas números)</label>
                <input 
                  required 
                  placeholder="Ex: 5511999999999"
                  className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" 
                  value={appSettings.whatsappNumber} 
                  onChange={e => setAppSettings({...appSettings, whatsappNumber: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold border-b border-zinc-800 pb-2">Planos de Assinatura</h3>
              <div className="grid grid-cols-1 gap-8">
                {appSettings.plans.map((plan, pIdx) => (
                  <div key={plan.id} className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Nome do Plano</label>
                        <input className="bg-zinc-900 border border-zinc-700 p-2 rounded text-sm" value={plan.name} onChange={e => updatePlan(pIdx, "name", e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Preço (mensal)</label>
                        <input className="bg-zinc-900 border border-zinc-700 p-2 rounded text-sm" value={plan.price} onChange={e => updatePlan(pIdx, "price", e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Telas</label>
                        <input className="bg-zinc-900 border border-zinc-700 p-2 rounded text-sm" value={plan.screens} onChange={e => updatePlan(pIdx, "screens", e.target.value)} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Vantagens / Características</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {plan.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex gap-2">
                            <input className="flex-1 bg-zinc-900 border border-zinc-700 p-2 rounded text-sm" value={feature} onChange={e => updateFeature(pIdx, fIdx, e.target.value)} />
                            <button type="button" onClick={() => removeFeature(pIdx, fIdx)} className="p-2 text-zinc-500 hover:text-netflix-red transition"><Minus className="w-4 h-4" /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addFeature(pIdx)} className="flex items-center justify-center gap-2 border border-dashed border-zinc-700 p-2 rounded text-xs text-zinc-500 hover:text-white hover:border-zinc-500 transition">
                          <Plus className="w-4 h-4" /> Adicionar Vantagem
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 mt-8">
              <h3 className="text-lg font-bold border-b border-zinc-800 pb-2">Categorias de Conteúdo</h3>
              <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
                <div className="flex flex-wrap gap-2 mb-4">
                  {appSettings.genres.map((genre, gIdx) => (
                    <div key={gIdx} className="flex items-center bg-zinc-900 border border-zinc-700 rounded-full pl-3 pr-1 py-1">
                      <span className="text-sm">{genre}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newGenres = [...appSettings.genres];
                          newGenres.splice(gIdx, 1);
                          setAppSettings({...appSettings, genres: newGenres});
                        }}
                        className="ml-2 p-1 text-zinc-500 hover:text-netflix-red transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    id="new-genre"
                    className="flex-1 bg-zinc-900 border border-zinc-700 p-2 rounded text-sm" 
                    placeholder="Nova categoria..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          setAppSettings({...appSettings, genres: [...appSettings.genres, input.value.trim()]});
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-genre') as HTMLInputElement;
                      if (input.value.trim()) {
                        setAppSettings({...appSettings, genres: [...appSettings.genres, input.value.trim()]});
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-netflix-red rounded text-xs font-bold hover:bg-red-700 transition"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            <button disabled={loading} className="w-full bg-netflix-red py-4 rounded font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? "Salvando..." : "Salvar Configurações"}
            </button>
          </form>
        )}

        {tab === "users" && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-netflix-red" /> 
              Gerenciar Acessos
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {usersList.map((usr: any) => (
                <div key={usr.id} className="bg-zinc-800 p-4 rounded-lg flex items-center justify-between border border-zinc-700">
                  <div>
                    <p className="font-bold">{usr.email}</p>
                    <p className="text-xs text-zinc-400">UID: {usr.id}</p>
                    <div className="mt-1 flex items-center gap-2">
                       {usr.subscriptionStatus === "active" ? (
                         <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                           <ShieldCheck className="w-3 h-3" /> ATIVO
                         </span>
                       ) : (
                         <span className="text-[10px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                           <ShieldAlert className="w-3 h-3" /> PENDENTE
                         </span>
                       )}
                       {usr.subscriptionExpiresAt && (
                         <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase">
                            Expira: {new Date(usr.subscriptionExpiresAt.seconds * 1000).toLocaleDateString()}
                         </span>
                       )}
                       {usr.subscriptionPlan && (
                         <span className="text-[10px] bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full uppercase font-bold">
                            {usr.subscriptionPlan}
                         </span>
                       )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {usr.subscriptionStatus === "active" ? (
                      <button 
                        onClick={() => handleUpdateStatus(usr.id, "incomplete")}
                        className="px-4 py-2 bg-orange-600/20 text-orange-500 hover:bg-orange-600 hover:text-white rounded transition text-sm font-bold"
                      >
                        Bloquear
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus(usr.id, "active")}
                        className="px-4 py-2 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white rounded transition text-sm font-bold"
                      >
                        Liberar Acesso
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab !== "users" && tab === "movie" && (
          <form onSubmit={handleMovieSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Título</label>
              <input required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={movieData.title} onChange={e => setMovieData({...movieData, title: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Ano</label>
              <input type="number" required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={movieData.year} onChange={e => setMovieData({...movieData, year: Number(e.target.value)})} />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-zinc-400">Descrição</label>
              <textarea rows={3} required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition resize-none" value={movieData.description} onChange={e => setMovieData({...movieData, description: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">URL Thumbnail</label>
              <input required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={movieData.thumbnailUrl} onChange={e => setMovieData({...movieData, thumbnailUrl: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">URL HLS (.m3u8)</label>
              <input required placeholder="Ex: /output/meu-filme/master.m3u8" className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={movieData.hlsUrl} onChange={e => setMovieData({...movieData, hlsUrl: e.target.value})} />
              <p className="text-[10px] text-zinc-500">Dica: Use /output/</p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-zinc-400 mb-2 block">Categorias</label>
              <div className="flex flex-wrap gap-2">
                {appSettings?.genres.map(g => (
                  <button 
                    key={g} 
                    type="button"
                    onClick={() => toggleGenre(g, movieData.genres, (genres: string[]) => setMovieData({...movieData, genres}))}
                    className={`px-3 py-1 rounded-full text-xs transition border ${movieData.genres.includes(g) ? "bg-netflix-red border-netflix-red text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-8 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-netflix-red" checked={movieData.trending} onChange={e => setMovieData({...movieData, trending: e.target.checked})} /> Em alta
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-netflix-red" checked={movieData.popular} onChange={e => setMovieData({...movieData, popular: e.target.checked})} /> Popular
              </label>
            </div>

            <button disabled={loading} className="md:col-span-2 bg-netflix-red py-4 rounded font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? "Salvando..." : editingId ? "Atualizar Filme" : "Salvar Filme"}
            </button>
          </form>
        )}

        {tab === "series" && (
          <form onSubmit={handleSeriesSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Título da Série</label>
              <input required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={seriesData.title} onChange={e => setSeriesData({...seriesData, title: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Total de Temporadas</label>
              <input type="number" required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={seriesData.totalSeasons} onChange={e => setSeriesData({...seriesData, totalSeasons: Number(e.target.value)})} />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-zinc-400">Descrição</label>
              <textarea rows={3} required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition resize-none" value={seriesData.description} onChange={e => setSeriesData({...seriesData, description: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-zinc-400">URL Thumbnail</label>
              <input required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={seriesData.thumbnailUrl} onChange={e => setSeriesData({...seriesData, thumbnailUrl: e.target.value})} />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-zinc-400 mb-2 block">Categorias</label>
              <div className="flex flex-wrap gap-2">
                {appSettings?.genres.map(g => (
                  <button 
                    key={g} 
                    type="button"
                    onClick={() => toggleGenre(g, seriesData.genres, (genres: string[]) => setSeriesData({...seriesData, genres}))}
                    className={`px-3 py-1 rounded-full text-xs transition border ${seriesData.genres.includes(g) ? "bg-netflix-red border-netflix-red text-white" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button disabled={loading} className="md:col-span-2 bg-netflix-red py-4 rounded font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? "Salvando..." : editingId ? "Atualizar Série" : "Salvar Série"}
            </button>
          </form>
        )}

        {tab === "episode" && (
          <form onSubmit={handleEpisodeSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Selecionar Série</label>
              <select 
                required 
                className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" 
                value={episodeData.seriesId} 
                onChange={e => setEpisodeData({...episodeData, seriesId: e.target.value})}
              >
                <option value="">Selecione uma série...</option>
                {seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Título do Episódio</label>
              <input required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={episodeData.title} onChange={e => setEpisodeData({...episodeData, title: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Temporada <span className="text-[10px] text-zinc-500">(Opcional - Padrão: 1)</span></label>
              <input type="number" className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={episodeData.season} onChange={e => setEpisodeData({...episodeData, season: Number(e.target.value)})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">Episódio Nº</label>
              <input type="number" required className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={episodeData.episode} onChange={e => setEpisodeData({...episodeData, episode: Number(e.target.value)})} />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm text-zinc-400">Descrição do Episódio <span className="text-[10px] text-zinc-500">(Opcional - Usa a da série se vazio)</span></label>
              <textarea rows={2} className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition resize-none" value={episodeData.description} onChange={e => setEpisodeData({...episodeData, description: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">URL Thumbnail <span className="text-[10px] text-zinc-500">(Opcional - Usa a da série se vazio)</span></label>
              <input className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={episodeData.thumbnailUrl} onChange={e => setEpisodeData({...episodeData, thumbnailUrl: e.target.value})} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-zinc-400">URL HLS (.m3u8)</label>
              <input required placeholder="Ex: /output/serie/ep1/master.m3u8" className="bg-zinc-800 border border-zinc-700 p-3 rounded focus:outline-none focus:border-white transition" value={episodeData.hlsUrl} onChange={e => setEpisodeData({...episodeData, hlsUrl: e.target.value})} />
            </div>

            <button disabled={loading || !episodeData.seriesId} className="md:col-span-2 bg-netflix-red py-4 rounded font-bold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? "Salvando..." : editingId ? "Atualizar Episódio" : "Salvar Episódio"}
            </button>
          </form>
        )}

        {success && (
          <div className="mt-6 flex items-center gap-2 text-green-500 justify-center animate-bounce">
            <CheckCircle2 /> Operação concluída com sucesso!
          </div>
        )}
      </div>

      {/* Lists Section */}
      {tab !== "users" && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold border-b border-zinc-800 pb-4">Gerenciar {tab === "movie" ? "Filmes" : tab === "series" ? "Séries" : "Episódios"}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tab === "episode" ? (
              <div className="space-y-12">
                {/* Grouped by series */}
                {seriesList.map(series => {
                  const seriesEpisodes = episodesList.filter(ep => ep.seriesId === series.id);
                  if (seriesEpisodes.length === 0) return null;
                  return (
                    <div key={series.id} className="space-y-4">
                      <h3 className="text-xl font-bold text-netflix-red flex items-center gap-2">
                         <Tv className="w-5 h-5" /> {series.title}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {seriesEpisodes.sort((a, b) => (a.season - b.season) || (a.episode - b.episode)).map((item: any) => (
                          <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col group">
                            <div className="relative aspect-video">
                              <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button 
                                  onClick={() => startEditEpisode(item)}
                                  className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 transition"
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(item.id, "movie")}
                                  className="p-3 bg-netflix-red text-white rounded-full hover:bg-red-700 transition"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            <div className="p-4 flex-1">
                              <p className="text-xs text-netflix-red font-bold uppercase mb-1">T{item.season} : E{item.episode}</p>
                              <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Orphan episodes (without a series) */}
                {episodesList.filter(ep => !seriesList.find(s => s.id === ep.seriesId)).length > 0 && (
                  <div className="space-y-4 pt-8 border-t border-zinc-800">
                    <h3 className="text-xl font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                       <ShieldAlert className="w-5 h-5" /> episódios sem série vinculada
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {episodesList.filter(ep => !seriesList.find(s => s.id === ep.seriesId)).map((item: any) => (
                        <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col group border-red-900/30">
                          <div className="p-4">
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <p className="text-xs text-zinc-500 mt-1 truncate">Série-ID: {item.seriesId}</p>
                            <div className="mt-4 flex gap-2">
                              <button onClick={() => startEditEpisode(item)} className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded">Editar</button>
                              <button onClick={() => handleDelete(item.id, "movie")} className="text-xs bg-red-900/20 text-red-500 hover:bg-red-900/40 px-3 py-1 rounded">Excluir</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {episodesList.length === 0 && (
                  <div className="py-20 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                    Nenhum episódio encontrado.
                  </div>
                )}
              </div>
            ) : (
              (tab === "movie" ? moviesList : seriesList).map((item: any) => (
                <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col group">
                  <div className="relative aspect-video">
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button 
                        onClick={() => tab === "movie" ? startEditMovie(item) : startEditSeries(item)}
                        className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 transition"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, tab === "series" ? "series" : "movie")}
                        className="p-3 bg-netflix-red text-white rounded-full hover:bg-red-700 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                    {item.genres && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.genres.slice(0, 3).map((g: string) => (
                          <span key={g} className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {(tab === "movie" ? moviesList : tab === "series" ? seriesList : episodesList).length === 0 && (
              <p className="text-zinc-500 col-span-full py-12 text-center bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                 Nenhum item encontrado.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
