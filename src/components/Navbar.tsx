import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, User as UserIcon } from "lucide-react";
import { useProfile, useAuth } from "../App";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { cn } from "../lib/utils";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { currentProfile, setCurrentProfile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentProfile(null);
    navigate("/login");
  };

  const { appSettings } = useAuth();
  const siteName = appSettings?.siteName || "StreamNexus";

  return (
    <nav 
      className={cn(
        "fixed top-0 w-full z-[100] transition-colors duration-300 flex items-center justify-between px-4 md:px-12 py-4",
        isScrolled ? "bg-netflix-dark" : "bg-gradient-to-b from-black/70 to-transparent"
      )}
    >
      <div className="flex items-center gap-10">
        <Link to="/" className="text-netflix-red font-bold text-2xl md:text-3xl tracking-tighter uppercase">
          {siteName}
        </Link>
        <div className="hidden md:flex gap-4 text-sm font-light text-zinc-200">
          <Link to="/" className="hover:text-zinc-400 transition">Início</Link>
          <Link to="/series" className="hover:text-zinc-400 transition">Séries</Link>
          <Link to="/movies" className="hover:text-zinc-400 transition">Filmes</Link>
          <Link to="/new" className="hover:text-zinc-400 transition">Bombando</Link>
          <Link to="/my-list" className="hover:text-zinc-400 transition">Minha Lista</Link>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Search className="w-5 h-5 cursor-pointer hover:text-zinc-400 transition" />
        <Bell className="w-5 h-5 cursor-pointer hover:text-zinc-400 transition" />
        
        <div className="group relative">
          <div className="flex items-center gap-2 cursor-pointer py-2">
            <img 
              src={currentProfile?.avatarUrl} 
              alt="Avatar" 
              className="w-8 h-8 rounded"
            />
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white group-hover:rotate-180 transition-transform" />
          </div>
          
          <div className="absolute right-0 top-full pt-1 w-48 hidden group-hover:block transition-all">
            <div className="bg-black/90 border border-zinc-800 shadow-xl overflow-hidden rounded-sm">
              <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Perfil</p>
                <p className="text-sm font-medium text-white">{currentProfile?.name}</p>
              </div>
              <div className="py-1">
                <Link to="/profiles" className="block px-3 py-2 text-sm hover:bg-zinc-800 transition">Trocar Perfil</Link>
                <Link to="/admin" className="block px-3 py-2 text-sm hover:bg-zinc-800 transition">Painel Admin</Link>
                <Link to="/account" className="block px-3 py-2 text-sm hover:bg-zinc-800 transition">Minha Conta</Link>
              </div>
              <div className="border-t border-zinc-800 py-1">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 text-netflix-red transition"
                >
                  Sair do {siteName}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
