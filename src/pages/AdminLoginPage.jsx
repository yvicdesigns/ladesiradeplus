import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { supabase } from "@/lib/customSupabaseClient";
import { SoundButtonWrapper as Button } from "@/components/SoundButtonWrapper";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { SoundLink } from "@/components/SoundLink";
import { handleTokenRefreshError } from "@/lib/tokenRefreshHandler";
import { globalCircuitBreaker } from "@/lib/CircuitBreaker";

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signOut, user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const checkAttemptedRef = useRef(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Auto-redirect if already authenticated as admin
  useEffect(() => {
    let isMounted = true;

    const checkExistingAuth = async () => {
      if (!user) {
         if (isMounted) setCheckingAuth(false);
         return;
      }

      // Prevent infinite loops by only checking once per user ID
      if (checkAttemptedRef.current === user.id) {
         if (isMounted) setCheckingAuth(false);
         return;
      }
      
      checkAttemptedRef.current = user.id;

      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("role")
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .maybeSingle();

        if (adminError) throw adminError;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (profileError) throw profileError;

        const isUserAdmin = ['admin', 'manager', 'staff'].includes(adminData?.role) || ['admin', 'manager', 'staff'].includes(profile?.role);

        if (isUserAdmin) {
          console.log("[AdminLoginPage] 🔄 Authenticated admin user detected. Redirecting to /admin");
          if (isMounted) navigate("/admin", { replace: true });
        } else {
          console.log("[AdminLoginPage] Authenticated non-admin user detected. Waiting for manual login.");
        }
      } catch (err) {
        globalCircuitBreaker.logErrorDeduped('AdminLoginPage_CheckAuth', err);
        if (isMounted) setErrorState("Erreur de connexion. Impossible de vérifier les droits.");
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    };

    if (!authLoading) {
      checkExistingAuth();
    }

    return () => { isMounted = false; };
  }, [user, navigate, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorState(null);
    
    if (!formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "Champs Requis",
        description: "Veuillez remplir l'ensemble des champs pour procéder à l'authentification.",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Sign In
      const { data: { session }, error: signInError } = await signIn(formData.email, formData.password);

      if (signInError) {
         await handleTokenRefreshError(signInError);
         throw signInError;
      }

      if (!session?.user) {
        throw new Error("Impossible de valider la session de l'utilisateur actif.");
      }

      // 2. Verify Role
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("is_deleted", false)
        .maybeSingle();

      if (adminError) throw adminError;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
        
      if (profileError) throw profileError;

      const isUserAdmin = ['admin', 'manager', 'staff'].includes(adminUser?.role) || ['admin', 'manager', 'staff'].includes(profile?.role);

      if (!isUserAdmin) {
        await signOut();
        throw new Error("Accès refusé: Vous n'êtes pas administrateur");
      }

      // 3. Success
      toast({
        title: "Accès Autorisé",
        description: "Bienvenue sur le portail d'administration sécurisé de La Desirade Plus.",
        className: "bg-amber-50 border-amber-200",
      });

      // 4. Redirect
      const redirectPath = location.state?.from?.pathname || '/admin';
      navigate(redirectPath, { replace: true });
      
    } catch (error) {
      let desc = error.message;
      if (error.message === "Invalid login credentials") desc = "L'adresse email ou le mot de passe fourni est incorrect.";
      if (error.message === "Load failed" || error.message === "Failed to fetch") desc = "Problème de connexion réseau. Vérifiez votre internet.";
      
      toast({
        variant: "destructive",
        title: "Échec de l'Authentification",
        description: desc,
      });
      setErrorState(desc);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth || authLoading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
       </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Portail d'Administration - Connexion - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 px-4 py-16 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-purple-500/30 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md z-10"
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/50">
            <div className="text-center mb-8">
              <motion.div 
                className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <ShieldCheck className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Portail Administrateur
              </h1>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Accès exclusif réservé à l'équipe de gestion
              </p>
            </div>

            {errorState && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorState}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
                  Adresse Email Professionnelle
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    type="email"
                    required
                    placeholder="manager@votre-domaine.com"
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 focus:scale-[1.01]"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">
                  Mot de Passe de Sécurité
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    type="password"
                    required
                    placeholder="Saisissez votre mot de passe confidentiel"
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 focus:scale-[1.01]"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-600/20 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Vérification de l'accès...
                  </>
                ) : (
                  "Valider et Se Connecter"
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <SoundLink
                to="/"
                className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft className="mr-1 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Retour au Site Principal
              </SoundLink>
            </div>
          </div>
          
          <p className="text-center text-white/60 text-xs mt-6 font-medium">
            &copy; {new Date().getFullYear()} La Desirade Plus. Système d'Information Protégé.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default AdminLoginPage;