import { useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { userService } from "../services/userService";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await userService.syncUser(result.user);
      navigate("/profiles");
    } catch (err: any) {
      if (err.code === "auth/unauthorized-domain") {
        setError("Erro: Este domínio não está autorizado no Firebase. Adicione o domínio do Railway nas configurações de autenticação do Firebase.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      
      await userService.syncUser(userCredential.user);
      navigate("/profiles");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setError("E-mail ou senha incorretos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold mb-8">{isRegistering ? "Criar Conta" : "Entrar"}</h1>
        
        {error && <p className="bg-orange-600 text-sm p-3 rounded mb-4">{error}</p>}
        
        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <input 
            type="email"
            placeholder="E-mail"
            required
            className="w-full bg-[#333] rounded px-5 py-4 text-white focus:bg-[#444] outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password"
            placeholder="Senha"
            required
            className="w-full bg-[#333] rounded px-5 py-4 text-white focus:bg-[#444] outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-netflix-red py-3 rounded font-bold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Processando..." : (isRegistering ? "Registrar agora" : "Entrar")}
          </button>
          
          {!isRegistering && (
            <button
              type="button"
              onClick={() => setIsRegistering(true)}
              className="w-full bg-zinc-800/50 py-3 rounded font-bold hover:bg-zinc-800 transition mt-2 text-sm border border-zinc-700"
            >
              Criar uma nova conta
            </button>
          )}
        </form>

        <div className="flex items-center gap-4 my-6 opacity-50">
          <hr className="flex-1 border-zinc-600" />
          <span className="text-sm">OU</span>
          <hr className="flex-1 border-zinc-600" />
        </div>
        
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-white text-black py-3 rounded font-bold hover:bg-white/90 transition flex items-center justify-center gap-2 mb-6"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Continuar com Google
        </button>
        
        <div className="mt-8 text-zinc-500">
          {isRegistering ? "Já tem uma conta?" : "Novo no StreamNexus?"} 
          <button 
            type="button"
            className="text-white font-bold hover:underline cursor-pointer ml-1"
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? "Fazer login." : "Criar uma conta agora."}
          </button>
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
