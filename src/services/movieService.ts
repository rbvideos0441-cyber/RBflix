import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  const stringified = JSON.stringify(errInfo);
  console.error('Firestore Error: ', stringified);
  throw new Error(stringified);
}

export const movieService = {
  async getMovies() {
    const path = "movies";
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getSeries() {
    const path = "series";
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getEpisodesBySeries(seriesId: string) {
    const path = "movies";
    try {
      const q = query(collection(db, path), where("seriesId", "==", seriesId), where("isSeries", "==", true));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async updateWatchHistory(profileId: string, mediaId: string, progressSeconds: number, genres?: string[]) {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/profiles/${profileId}/watchHistory/${mediaId}`;
    try {
      await setDoc(doc(db, path), {
        mediaId,
        progressSeconds,
        genres: genres || [],
        lastWatched: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getWatchHistory(profileId: string = "primary") {
    if (!auth.currentUser) return [];
    const path = `users/${auth.currentUser.uid}/profiles/${profileId}/watchHistory`;
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getRecommendations(profileId: string = "primary", allContent: any[]) {
    const history = await this.getWatchHistory(profileId);
    if (!history || history.length === 0) return [];

    // Extract all genres from history
    const watchedGenreFrequency: Record<string, number> = {};
    const watchedIds = new Set(history.map((h: any) => h.mediaId));

    history.forEach((item: any) => {
      (item.genres || []).forEach((genre: string) => {
        watchedGenreFrequency[genre] = (watchedGenreFrequency[genre] || 0) + 1;
      });
    });

    // Sort genres by frequency
    const topGenres = Object.entries(watchedGenreFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre);

    if (topGenres.length === 0) return [];

    // Filter content that matches the top genres and hasn't been watched yet
    // Score based on how many of the top genres it matches
    const recommendations = allContent
      .filter(m => !watchedIds.has(m.id))
      .map(m => {
        let score = 0;
        topGenres.forEach((genre, index) => {
          if (m.genres?.includes(genre)) {
            // Weight higher for genres watched more often
            score += (topGenres.length - index);
          }
        });
        return { ...m, matchScore: score };
      })
      .filter(m => (m as any).matchScore > 0)
      .sort((a, b) => (b as any).matchScore - (a as any).matchScore);

    return recommendations.slice(0, 15);
  },

  async addToFavorites(profileId: string, mediaId: string) {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/profiles/${profileId}/favorites/${mediaId}`;
    try {
      await setDoc(doc(db, path), {
        mediaId,
        addedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getFavorites(profileId: string) {
    if (!auth.currentUser) return [];
    const path = `users/${auth.currentUser.uid}/profiles/${profileId}/favorites`;
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      const favoriteIds = snapshot.docs.map(d => d.data().mediaId);
      
      // Fetch actual movie data (simplified demo approach)
      const allMovies = await this.getMovies();
      return allMovies?.filter(m => favoriteIds.includes(m.id)) || [];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getMovieById(id: string) {
    const path = `movies/${id}`;
    try {
      const docSnap = await getDoc(doc(db, "movies", id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async updateMovie(id: string, data: any) {
    const path = `movies/${id}`;
    try {
      await updateDoc(doc(db, "movies", id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteMovie(id: string) {
    const path = `movies/${id}`;
    try {
      await deleteDoc(doc(db, "movies", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async updateSeries(id: string, data: any) {
    const path = `series/${id}`;
    try {
      await updateDoc(doc(db, "series", id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteSeries(id: string) {
    const path = `series/${id}`;
    try {
      await deleteDoc(doc(db, "series", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getSeriesById(id: string) {
    const path = `series/${id}`;
    try {
      const docSnap = await getDoc(doc(db, "series", id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },
};
