import { motion } from "motion/react";
import { useProfile } from "../App";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

const DUMMY_PROFILES = [
  { id: "1", name: "Guest", avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" },
  { id: "2", name: "Kids", avatarUrl: "https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-v9ll6tbd4imj79fs.jpg" }
];

export default function Profiles() {
  const { setCurrentProfile } = useProfile();
  const navigate = useNavigate();

  const handleSelect = (profile: any) => {
    setCurrentProfile(profile);
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-netflix-dark">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white text-5xl md:text-6xl font-medium mb-10"
      >
        Quem está assistindo?
      </motion.h1>

      <div className="flex gap-6 flex-wrap justify-center px-4">
        {DUMMY_PROFILES.map((profile, i) => (
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleSelect(profile)}
            className="group cursor-pointer flex flex-col items-center"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded overflow-hidden border-2 border-transparent group-hover:border-white transition-all">
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <p className="mt-4 text-zinc-500 group-hover:text-white text-lg md:text-xl transition">
              {profile.name}
            </p>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: DUMMY_PROFILES.length * 0.1 }}
          className="group cursor-pointer flex flex-col items-center"
        >
          <div className="w-32 h-32 md:w-40 md:h-40 rounded flex items-center justify-center border-transparent group-hover:bg-white/10 transition-all">
             <div className="p-8 group-hover:p-10 transition-all">
               <Plus className="w-full h-full text-zinc-500" />
             </div>
          </div>
          <p className="mt-4 text-zinc-500 group-hover:text-white text-lg md:text-xl transition">
            Adicionar Perfil
          </p>
        </motion.div>
      </div>

      <button className="mt-16 px-8 py-2 border border-zinc-500 text-zinc-500 hover:text-white hover:border-white transition uppercase tracking-widest text-sm">
        Gerenciar Perfis
      </button>
    </div>
  );
}
