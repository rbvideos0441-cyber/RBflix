import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { OperationType, handleFirestoreError } from "./movieService";

export interface Plan {
  id: string;
  name: string;
  price: string;
  screens: string;
  features: string[];
}

export interface AppSettings {
  whatsappNumber: string;
  siteName: string;
  plans: Plan[];
  genres: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  whatsappNumber: "5500000000000",
  siteName: "StreamNexus",
  plans: [
    {
      id: "basic",
      name: "Plano Individual",
      price: "15",
      screens: "1 Tela",
      features: ["Acesso total", "Sem anúncios", "Qualidade HD"]
    },
    {
      id: "standard",
      name: "Plano Duplo",
      price: "20",
      screens: "2 Telas",
      features: ["Acesso total", "Sem anúncios", "Qualidade Full HD", "Assistir em 2 dispositivos"]
    },
    {
      id: "premium",
      name: "Plano Família",
      price: "25",
      screens: "3 Telas",
      features: ["Acesso total", "Sem anúncios", "Qualidade 4K + HDR", "Assistir em 3 dispositivos"]
    }
  ],
  genres: ["Ação", "Comédia", "Drama", "Terror", "Ficção Científica", "Documentário", "Infantil", "Romance", "Suspense"]
};

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const path = "settings/global";
    try {
      const docRef = doc(db, "settings", "global");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return DEFAULT_SETTINGS;
    }
  },

  async updateSettings(settings: AppSettings) {
    const path = "settings/global";
    try {
      await setDoc(doc(db, "settings", "global"), {
        ...settings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
