import { motion } from "motion/react";
import { Check, MessageCircle, Loader2, QrCode } from "lucide-react";
import { useAuth } from "../App";
import { QRCodeSVG } from "qrcode.react";

export default function Plans() {
  const { user, appSettings, loading } = useAuth();

  const getWhatsAppUrl = (planName?: string, screens?: string, price?: string) => {
    if (!appSettings) return "";
    let message = `Olá! Gostaria de saber mais sobre os planos do ${appSettings.siteName}.`;
    if (planName) {
      message = `Olá! Acabei de me cadastrar no ${appSettings.siteName} e escolhi o ${planName} (${screens}) por R$ ${price}/mês. Gostaria de liberar meu acesso!\n\nEmail da conta: ${user?.email}`;
    }
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${appSettings.whatsappNumber}?text=${encodedMessage}`;
  };

  const handleContact = (planName: string, screens: string, price: string) => {
    const url = getWhatsAppUrl(planName, screens, price);
    if (url) window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-dark flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-netflix-red animate-spin" />
      </div>
    );
  }

  if (!appSettings) return null;

  return (
    <div className="min-h-screen bg-netflix-dark py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-netflix-red font-bold text-4xl tracking-tighter mb-4 uppercase">{appSettings.siteName}</h1>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Escolha o plano ideal para você</h2>
          <p className="text-zinc-400 text-lg">Assista onde quiser. Cancele quando quiser.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {appSettings.plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col hover:border-netflix-red transition-colors group relative overflow-hidden"
            >
              {plan.id === "premium" && (
                <div className="absolute top-0 right-0 bg-netflix-red text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  MAIS POPULAR
                </div>
              )}
              
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">R$ {plan.price}</span>
                <span className="text-zinc-500">/mês</span>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-5 h-5 text-netflix-red" />
                  <span>{plan.screens}</span>
                </div>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-zinc-300">
                    <Check className="w-5 h-5 text-netflix-red" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleContact(plan.name, plan.screens, plan.price)}
                className="w-full bg-netflix-red py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition transform active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                Liberar Acesso
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 bg-zinc-900/50 p-8 md:p-12 rounded-2xl border border-zinc-800 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold mb-4 flex items-center justify-center md:justify-start gap-2">
              <QrCode className="w-8 h-8 text-netflix-red" />
              Atendimento via QR Code
            </h3>
            <p className="text-zinc-400 mb-4 text-lg">
              Está assistindo pela TV? Escaneie o código ao lado com a câmera do seu celular para falar direto com nosso suporte no WhatsApp.
            </p>
            <div className="space-y-2">
              <p className="text-zinc-500 text-sm">✓ Liberação manual imediata</p>
              <p className="text-zinc-500 text-sm">✓ Suporte técnico especializado</p>
              <p className="text-zinc-500 text-sm">✓ Atendimento em menos de 15 minutos</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shrink-0 shadow-2xl transform hover:scale-105 transition-transform">
            <QRCodeSVG 
              value={getWhatsAppUrl()} 
              size={180}
              level="H"
              includeMargin={false}
            />
            <div className="mt-2 text-black text-center font-bold text-xs uppercase tracking-tighter">
               Escanear para Suporte
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
