import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Use service account if available, otherwise initialized via cloud project
// In AI Studio environment, we can usually just initializeApp() if env vars are set
const app = initializeApp({
  projectId: firebaseConfig.projectId,
});

const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function seed() {
  const movies = [
    {
      title: "The Silent Forest",
      description: "A breathtaking journey through the untouched wilderness of the Amazon, revealing secrets hidden for millennia.",
      thumbnailUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop",
      hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      year: 2023,
      rating: "PG-13",
      genres: ["Nature", "Documentary"],
      trending: true,
      popular: true
    },
    {
      title: "Urban Echoes",
      description: "Follow the pulse of the world's most vibrant cities as they transform from day to night in stunning detail.",
      thumbnailUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2560&auto=format&fit=crop",
      hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      year: 2024,
      rating: "TV-MA",
      genres: ["Urban", "Action"],
      trending: true,
      popular: false
    },
    {
      title: "Crimson Horizon",
      description: "In a future where the sun never sets, one pilot must navigate the eternal dawn to save humanity.",
      thumbnailUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop",
      hlsUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      year: 2025,
      rating: "R",
      genres: ["Sci-Fi", "Thriller"],
      trending: false,
      popular: true
    }
  ];

  for (const movie of movies) {
    await db.collection('movies').add(movie);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
