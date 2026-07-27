import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/auth/AuthGuard";
import { LanguageProvider } from "./hooks/useLanguage";

const queryClient = new QueryClient();
const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Suscripciones = lazy(() => import("./pages/Suscripciones"));
const Diagnostico = lazy(() => import("./pages/Diagnostico"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const BusinessBuilderWelcome = lazy(() => import("./pages/BusinessBuilderWelcome"));

const RouteFallback = () => <div className="min-h-screen bg-black" />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/suscripciones" element={<Suscripciones />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/oauth/consent" element={<OAuthConsent />} />
              <Route path="/business-builder" element={
                <AuthGuard>
                  <BusinessBuilderWelcome />
                </AuthGuard>
              } />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <Index />
                </AuthGuard>
              } />
              <Route path="/" element={
                <AuthGuard>
                  <Index />
                </AuthGuard>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
