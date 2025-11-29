import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Shorts from "./pages/Shorts";
import Scripts from "./pages/Scripts";
import YoutubePost from "./pages/YoutubePost";
import IgScraper from "./pages/IgScraper";
import TinyUrl from "./pages/TinyUrl";
import Voice from "./pages/Voice";
import History from "./pages/History";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  
                  {/* Protected Routes - Tools */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/shorts"
                    element={
                      <ProtectedRoute>
                        <Shorts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/scripts"
                    element={
                      <ProtectedRoute>
                        <Scripts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/youtube-post"
                    element={
                      <ProtectedRoute>
                        <YoutubePost />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ig-scraper"
                    element={
                      <ProtectedRoute>
                        <IgScraper />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tinyurl"
                    element={
                      <ProtectedRoute>
                        <TinyUrl />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/voice"
                    element={
                      <ProtectedRoute>
                        <Voice />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <History />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
