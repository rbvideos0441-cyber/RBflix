import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { userService } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function Login() {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await userService.syncUser(result.user);
      navigate("/profiles");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div 
      className="relative h-screen w-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: 'url("https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bca1-07b3f8ff1414/da9ad148-f770-4f7d-95f0-3f617a7a0d41/BR-pt-20220502-popsignuptwoweeks-perspective_alpha_website_small.jpg")' }}
    >
      <div className="absolute inset-0 bg-black/60" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-black/75 p-16 rounded-md w-full max-w-[450px]"
      >
        <h1 className="text-3xl font-bold mb-8">Entrar</h1>
        
        {error && <p className="bg-orange-600 text-sm p-3 rounded mb-4">{error}</p>}
        
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-netflix-red py-3 rounded font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Entrar com Google
        </button>
        
        <div className="mt-12 text-zinc-500">
          Novo no StreamNexus? <span className="text-white hover:underline cursor-pointer">Assine agora.</span>
        </div>
        
        <p className="mt-4 text-xs text-zinc-400">
          Esta página é protegida pelo Google reCAPTCHA para garantir que você não é um robô. 
          <span className="text-blue-500 hover:underline cursor-pointer ml-1">Saiba mais.</span>
        </p>
      </motion.div>

      <div className="absolute top-8 left-8">
        <h1 className="text-netflix-red font-bold text-4xl tracking-tighter">STREAMNEXUS</h1>
      </div>
    </div>
  );
}
