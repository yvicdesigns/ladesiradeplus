import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  ChefHat,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { handleTokenRefreshError } from '@/lib/tokenRefreshHandler';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { handleError, ErrorTypes } from '@/lib/errorHandler';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }));
    }
    
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('error') === 'session_expired') {
      setSessionExpiredMsg(true);
      toast({
        variant: "destructive",
        title: "Session Expirée",
        description: "Votre session a expiré. Veuillez vous reconnecter.",
      });
      navigate('/login', { replace: true });
    }
  }, [location.state, location.search, navigate, toast]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
      if (mode === 'signup' && formData.confirmPassword) {
         if (value !== formData.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: "Les mots de passe saisis ne correspondent pas." }));
         } else {
            setErrors(prev => ({ ...prev, confirmPassword: null }));
         }
      }
    }
    
    if (name === 'confirmPassword') {
       if (value !== formData.password) {
          setErrors(prev => ({ ...prev, confirmPassword: "Les mots de passe saisis ne correspondent pas." }));
       } else {
          setErrors(prev => ({ ...prev, confirmPassword: null }));
       }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!validateEmail(formData.email)) newErrors.email = "Le format de l'adresse email est invalide.";
    if (formData.password.length < 8) newErrors.password = "Le mot de passe doit comporter au minimum 8 caractères.";
    
    if (mode === 'signup') {
      if (!formData.fullName.trim()) newErrors.fullName = "Votre nom complet est obligatoire pour l'inscription.";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Les mots de passe saisis ne correspondent pas.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setLoadingMessage('Vérification des identifiants...');
    setSessionExpiredMsg(false);
    
    // Simulate long loading feedback
    const msgTimer = setTimeout(() => {
      setLoadingMessage('Connexion... cela peut prendre un moment selon le réseau.');
    }, 4000);
    
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        await handleTokenRefreshError(error);
        throw error;
      }

      toast({
        title: "Authentification Réussie",
        description: "Bienvenue sur La Desirade Plus ! Vous êtes connecté.",
        className: "bg-amber-50 border-amber-200",
      });
      
      setTimeout(() => {
        const redirectPath = location.state?.from?.pathname || '/menu';
        navigate(redirectPath, { replace: true });
      }, 300);

    } catch (error) {
      const errorType = handleError(error, 'Login');
      if (errorType === ErrorTypes.TIMEOUT) {
        setErrors({ general: "Délai d'attente dépassé. Veuillez réessayer." });
      } else if (error.message === "Invalid login credentials" || error.message?.includes("invalid_credentials")) {
        setErrors({ general: "L'adresse email ou le mot de passe est incorrect." });
      }
    } finally {
      clearTimeout(msgTimer);
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: existingProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formData.email);

      if (profileError) throw profileError;

      if (existingProfiles && existingProfiles.length > 0) {
        throw new Error("Cette adresse email est déjà associée à un compte existant.");
      }

      const { data: authData, error: authError } = await signUp(formData.email, formData.password, {
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          role: 'customer'
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        try {
           const { error: customerError } = await supabase
             .from('customers')
             .insert({
               user_id: authData.user.id,
               email: formData.email,
               name: formData.fullName,
               phone: formData.phone,
               registration_date: new Date().toISOString()
             });
             
           if (customerError) console.warn("Could not create customer record immediately:", customerError);
        } catch (err) {
           console.warn("Customer creation skipped:", err);
        }
      }

      toast({
        title: "Création de Compte Réussie !",
        description: "Votre compte a été créé. Veuillez consulter votre boîte de réception pour la confirmation.",
        className: "bg-amber-50 border-amber-200",
      });

      setMode('login');
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      
    } catch (error) {
      handleError(error, 'Signup');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      setErrors({ email: "Veuillez saisir une adresse email valide." });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err) {
      setErrors({ general: "Impossible d'envoyer l'email. Vérifiez l'adresse et réessayez." });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/menu`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur Google',
        description: error.message || 'Impossible de se connecter avec Google.',
      });
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setPasswordStrength(0);
    setForgotSent(false);
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    setSessionExpiredMsg(false);
  };

  return (
    <>
      <Helmet>
        <title>{mode === 'login' ? 'Connexion à votre compte' : 'Créer un nouveau compte'} - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-4 bg-gradient-to-br from-green-600 via-green-700 to-amber-800 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
           <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-green-300 rounded-full blur-3xl"></div>
        </div>

        <motion.button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 md:top-6 md:left-6 transition-all duration-300 z-10 hover:bg-white/10 p-1.5 rounded-full text-white/90 hover:text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm md:max-w-[400px] lg:max-w-[450px] z-20"
        >
          <div className="text-center mb-4">
            <motion.div 
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl shadow-black/20 mx-auto mb-4 border-2 border-white/20"
              whileHover={{ rotate: 10, scale: 1.05 }}
            >
              <ChefHat className="h-8 w-8 text-amber-600" />
            </motion.div>
            <h1 className="text-xl font-bold text-white mb-1 drop-shadow-md">
              {mode === 'login' ? 'Connectez-vous' : 'Ouvrir un Nouveau Compte'}
            </h1>
            <p className="text-amber-100 text-sm font-medium">
              {mode === 'login' 
                ? 'Identifiez-vous pour passer votre commande' 
                : 'Rejoignez la communauté pour découvrir nos délices'}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 p-4">
            
            {sessionExpiredMsg && (
              <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm ml-2">
                  Votre session a expiré. Veuillez vous reconnecter.
                </AlertDescription>
              </Alert>
            )}

            {errors.general && (
              <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm ml-2 font-medium">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            <AnimatePresence mode="wait">
              {mode === 'forgot' ? (
                <motion.div
                  key="forgot-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {forgotSent ? (
                    <div className="flex flex-col items-center text-center py-4 gap-3">
                      <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-7 w-7 text-amber-500" />
                      </div>
                      <h3 className="font-bold text-gray-900">Email envoyé !</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Un lien de réinitialisation a été envoyé à <span className="font-bold text-gray-700">{formData.email}</span>.<br />
                        Consultez votre boîte de réception (et vos spams).
                      </p>
                      <button
                        onClick={() => { setMode('login'); setForgotSent(false); }}
                        className="mt-2 text-sm font-bold text-amber-600 hover:underline"
                      >
                        Retour à la connexion
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="text-center mb-2">
                        <p className="text-sm text-gray-500 leading-relaxed">
                          Saisissez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                        </p>
                      </div>

                      {errors.general && (
                        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-sm ml-2 font-medium">{errors.general}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 ml-1">Adresse Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                          <Input
                            type="email"
                            name="email"
                            placeholder="nom.prenom@exemple.com"
                            className={cn(
                              "pl-9 h-9 bg-gray-50 border-gray-200 focus:border-amber-500 focus:ring-amber-500 text-gray-900 text-sm rounded-lg",
                              errors.email && "border-red-500"
                            )}
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={loading}
                            autoFocus
                          />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs ml-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.email}</p>}
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-9 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md transition-all"
                        disabled={loading}
                      >
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi en cours...</> : "Envoyer le lien de réinitialisation"}
                      </Button>

                      <button
                        type="button"
                        onClick={() => { setMode('login'); setErrors({}); }}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium py-1"
                      >
                        ← Retour à la connexion
                      </button>
                    </form>
                  )}
                </motion.div>
              ) : mode === 'login' ? (
                <motion.form
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Adresse Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="nom.prenom@exemple.com"
                        className={cn(
                          "pl-9 h-9 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm rounded-lg transition-all",
                          errors.email && "border-red-500 focus:ring-red-500"
                        )}
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs ml-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Mot de Passe Sécurisé</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        className="pl-9 pr-9 h-9 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm rounded-lg transition-all"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrors({}); setForgotSent(false); }}
                      className="text-xs text-amber-600 font-bold hover:underline transition-all"
                      disabled={loading}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md shadow-green-200 hover:shadow-green-300 transition-all duration-200 transform hover:-translate-y-0.5 mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {loadingMessage || "Chargement..."}
                      </>
                    ) : (
                      "Se Connecter"
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignup}
                  className="space-y-3"
                >
                   <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Nom Légal Complet</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type="text"
                        name="fullName"
                        placeholder="Ex: Jean Dupont"
                        className={cn(
                           "pl-9 h-9 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm rounded-lg transition-all",
                           errors.fullName && "border-red-500 focus:ring-red-500"
                        )}
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-xs ml-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.fullName}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Adresse Email Active</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="votre.email@domaine.com"
                        className={cn(
                           "pl-9 h-9 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm rounded-lg transition-all",
                           errors.email && "border-red-500 focus:ring-red-500"
                        )}
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs ml-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.email}</p>}
                  </div>

                  <div className="space-y-1">
                     <label className="text-xs font-semibold text-gray-700 ml-1">Numéro de Téléphone <span className="text-gray-400 font-normal italic">(Facultatif)</span></label>
                     <div className="relative group">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                        <Input
                           type="tel"
                           name="phone"
                           placeholder="Ex: +242 06 123 4567"
                           className="pl-9 h-9 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm rounded-lg transition-all"
                           value={formData.phone}
                           onChange={handleInputChange}
                           disabled={loading}
                        />
                     </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Définissez un Mot de Passe</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="8 caractères minimum requis"
                        className={cn(
                           "pl-9 pr-9 h-9 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm rounded-lg transition-all",
                           errors.password && "border-red-500 focus:ring-red-500"
                        )}
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                       <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title={showPassword ? "Masquer la saisie" : "Révéler la saisie"}
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {formData.password && (
                       <div className="flex gap-1 mt-1 px-1">
                          {[1, 2, 3, 4].map((level) => (
                             <div 
                                key={level} 
                                className={cn(
                                   "h-1 flex-1 rounded-full transition-all duration-300",
                                   passwordStrength >= level 
                                     ? (passwordStrength < 3 ? "bg-red-400" : passwordStrength === 3 ? "bg-yellow-400" : "bg-amber-500") 
                                     : "bg-gray-200"
                                )}
                             />
                          ))}
                       </div>
                    )}
                    {errors.password && <p className="text-red-500 text-xs ml-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.password}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Confirmation du Mot de Passe</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Veuillez répéter le mot de passe"
                        className={cn(
                           "pl-9 pr-9 h-9 bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 text-sm rounded-lg transition-all",
                           errors.confirmPassword && "border-red-500 focus:ring-red-500",
                           !errors.confirmPassword && formData.confirmPassword && "border-green-500 focus:ring-green-500"
                        )}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs ml-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/>{errors.confirmPassword}</p>}
                    {!errors.confirmPassword && formData.confirmPassword && (
                       <p className="text-amber-600 text-xs ml-1 flex items-center font-medium"><CheckCircle className="w-3 h-3 mr-1"/> Les mots de passe sont identiques</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md shadow-green-200 hover:shadow-green-300 transition-all duration-200 transform hover:-translate-y-0.5 mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finalisation de la création...
                      </>
                    ) : (
                      "Valider l'Inscription au Service"
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {mode !== 'forgot' && <div className="mt-4 text-center">
              {/* Google Sign In */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                  <span className="bg-white px-2 text-gray-400">Ou continuer avec</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 h-10 bg-white border-2 border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Connexion...' : 'Continuer avec Google'}
              </button>

               <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
                  <span className="bg-white px-2 text-gray-400">
                     {mode === 'login' ? 'Vous n\'avez pas encore de compte ?' : 'Vous possédez déjà un compte ?'}
                  </span>
                </div>
              </div>

              <button 
                 onClick={toggleMode}
                 className="w-full py-2 px-4 rounded-lg border-2 border-green-100 text-amber-600 text-sm font-bold hover:bg-amber-50 hover:border-amber-200 transition-all"
                 disabled={loading}
              >
                 {mode === 'login' ? 'Créer un Compte Gratuitement' : 'Accéder à mon Espace Personnel'}
              </button>

            </div>}
          </div>
        </motion.div>

        {/* Accès admin discret */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={() => navigate('/admin/login')}
          className="mt-4 flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs font-medium transition-colors z-20"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Espace Administration
        </motion.button>
      </div>
    </>
  );
};

export default LoginPage;