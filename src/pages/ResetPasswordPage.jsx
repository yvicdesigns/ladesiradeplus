import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, ChefHat } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the token in the URL hash — it auto-sets the session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit comporter au minimum 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Réinitialiser le mot de passe - La Desirade Plus</title>
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-green-600 via-green-700 to-amber-800">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm z-20"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl mx-auto mb-4">
              <ChefHat className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Nouveau mot de passe</h1>
            <p className="text-amber-100 text-sm">Choisissez un mot de passe sécurisé</p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
            {success ? (
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-amber-500" />
                </div>
                <h3 className="font-bold text-gray-900">Mot de passe mis à jour !</h3>
                <p className="text-sm text-gray-500">Vous allez être redirigé vers la page de connexion...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-sm ml-2 font-medium text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Nouveau mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="8 caractères minimum"
                      className="pl-9 pr-9 h-9 bg-gray-50 border-gray-200 text-sm rounded-lg"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Confirmer le mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Répétez le mot de passe"
                      className={cn(
                        "pl-9 h-9 bg-gray-50 border-gray-200 text-sm rounded-lg",
                        confirmPassword && password !== confirmPassword && "border-red-400",
                        confirmPassword && password === confirmPassword && "border-green-400"
                      )}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md transition-all"
                  disabled={loading}
                >
                  {loading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour...</>
                    : 'Enregistrer le nouveau mot de passe'
                  }
                </Button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 font-medium py-1"
                >
                  ← Retour à la connexion
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
