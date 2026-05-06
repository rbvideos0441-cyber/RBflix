/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./lib/firebase";
import { userService, UserData } from "./services/userService";
import { settingsService, AppSettings } from "./services/settingsService";

// Components
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profiles from "./pages/Profiles";
import Player from "./pages/Player";
import MyList from "./pages/MyList";
import Admin from "./pages/Admin";
import Plans from "./pages/Plans";
import SeriesDetails from "./pages/SeriesDetails";

// Types
interface Profile {
  id: string;
  name: string;
  avatarUrl: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  appSettings: AppSettings | null;
  loading: boolean;
}

interface ProfileContextType {
  currentProfile: Profile | null;
  setCurrentProfile: (profile: Profile | null) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, userData: null, appSettings: null, loading: true });
const ProfileContext = createContext<ProfileContextType>({ currentProfile: null, setCurrentProfile: () => {} });

export const useAuth = () => useContext(AuthContext);
export const useProfile = () => useContext(ProfileContext);

const ADMIN_EMAILS = ["robsonbatista3@gmail.com"];

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen bg-netflix-dark flex items-center justify-center text-white">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !ADMIN_EMAILS.includes(user.email || "")) return <Navigate to="/" />;
  return <>{children}</>;
}

function SubscriptionProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <div className="h-screen w-screen bg-netflix-dark flex items-center justify-center text-white">Carregando...</div>;
  
  // Admins always have access
  if (user && ADMIN_EMAILS.includes(user.email || "")) return <>{children}</>;
  
  if (!user) return <Navigate to="/login" />;
  
  if (userData?.subscriptionStatus !== "active") {
    if (location.pathname === "/plans") return <>{children}</>;
    return <Navigate to="/plans" />;
  }

  // Check expiration
  if (userData?.subscriptionExpiresAt) {
    const expirationDate = new Date(userData.subscriptionExpiresAt.seconds * 1000);
    if (expirationDate < new Date()) {
      if (location.pathname === "/plans") return <>{children}</>;
      return <Navigate to="/plans" />;
    }
  }
  
  return <>{children}</>;
}

function ProfileProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentProfile } = useProfile();
  if (!currentProfile) return <Navigate to="/profiles" />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const settings = await settingsService.getSettings();
        setAppSettings(settings);
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const data = await userService.syncUser(user);
        setUserData(data);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, appSettings, loading }}>
      <ProfileContext.Provider value={{ currentProfile, setCurrentProfile }}>
        <Router>
          <div className="min-h-screen bg-netflix-dark text-white">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route 
                path="/plans" 
                element={
                  <ProtectedRoute>
                    <Plans />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profiles" 
                element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute>
                      <Profiles />
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <SubscriptionProtectedRoute>
                      <ProfileProtectedRoute>
                        <Layout />
                      </ProfileProtectedRoute>
                    </SubscriptionProtectedRoute>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </ProfileContext.Provider>
    </AuthContext.Provider>
  );
}

function Layout() {
  const location = useLocation();
  const isPlayer = location.pathname.startsWith("/watch/");

  return (
    <>
      {!isPlayer && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/series" element={<Home />} />
        <Route path="/movies" element={<Home />} />
        <Route path="/new" element={<Home />} />
        <Route path="/series/:seriesId" element={<SeriesDetails />} />
        <Route path="/watch/:movieId" element={<Player />} />
        <Route 
          path="/admin" 
          element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

