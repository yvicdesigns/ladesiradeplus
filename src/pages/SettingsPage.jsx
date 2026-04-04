import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Globe, 
  ChevronRight, 
  Shield, 
  Lock, 
  Trash2, 
  ArrowRight, 
  Smartphone, 
  Save, 
  Loader2, 
  MessageSquare,
  Mail,
  Moon,
  Clock,
  Zap,
  Volume2,
  PlayCircle,
  Activity,
  AlertCircle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useVoicePreferences } from '@/hooks/useVoicePreferences';
import { useVoiceDiagnostics } from '@/hooks/useVoiceDiagnostics';
import { useVoice } from '@/hooks/useVoice';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, role } = useAuth();
  
  // App Preferences
  const [darkMode, setDarkMode] = useState(false);

  // Admin Config State (Store's WhatsApp)
  const [adminWhatsappNumber, setAdminWhatsappNumber] = useState('');
  const [isAdminWhatsappLoading, setIsAdminWhatsappLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // User Notification Preferences State
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [userWhatsapp, setUserWhatsapp] = useState('');
  const [isUserWhatsappLoading, setIsUserWhatsappLoading] = useState(false);
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [notificationFrequency, setNotificationFrequency] = useState('immediately');

  // Diagnostic Hook
  const { status: diagStatus, testTTS, testFallback } = useVoiceDiagnostics();

  // Voice Hook with robust testing
  const { testVoice } = useVoice(role);

  // Voice Preferences
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const voicePrefs = useVoicePreferences() || {};
  const { 
    enabled: voiceEnabled = false, 
    setEnabled: setVoiceEnabled = () => {}, 
    language: voiceLanguage = 'fr', 
    setLanguage: setVoiceLanguage = () => {}, 
    volume: voiceVolume = 1, 
    setVolume: setVoiceVolume = () => {}, 
    isSupported = false
  } = voicePrefs;

  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initData = async () => {
        if (!user) return;
        try {
            setLoadingPreferences(true);

            // 1. Check if admin and fetch store config
            const hasAccess = role === 'admin' || role === 'manager';
            setIsAdmin(hasAccess);

            if (hasAccess) {
                const { data } = await supabase.from('admin_config').select('config_value').eq('config_key', 'whatsapp_number').maybeSingle();
                if (data) setAdminWhatsappNumber(data.config_value || '');
            }

            // 2. Fetch User Notification Preferences
            const { data: userPrefs, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();
            
            if (error && error.code !== 'PGRST116') throw error;

            if (userPrefs) {
                setUserWhatsapp(userPrefs.whatsapp_number || '');
                setPushEnabled(userPrefs.push_enabled ?? true);
                setEmailEnabled(userPrefs.email_enabled ?? true);
                setSmsEnabled(userPrefs.sms_enabled ?? false);
                setQuietHoursStart(userPrefs.quiet_hours_start?.slice(0, 5) || '22:00');
                setQuietHoursEnd(userPrefs.quiet_hours_end?.slice(0, 5) || '07:00');
                setNotificationFrequency(userPrefs.notification_frequency || 'immediately');
            } else {
                await supabase.from('notification_preferences').upsert({
                    user_id: user.id,
                    push_enabled: true,
                    email_enabled: true,
                    sms_enabled: false
                }, { onConflict: 'user_id', ignoreDuplicates: true });
            }

        } catch (error) {
            console.error("Error loading settings", error);
            toast({ variant: "destructive", description: "Failed to load preferences." });
        } finally {
            setLoadingPreferences(false);
        }
    };
    initData();
  }, [user, toast, role]);

  const updatePreference = async (field, value) => {
      try {
          const { error } = await supabase
              .from('notification_preferences')
              .upsert({
                  user_id: user.id,
                  [field]: value,
                  updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' });

          if (error) throw error;
      } catch (error) {
          console.error(`Error updating ${field}:`, error);
          toast({ variant: "destructive", description: "Failed to save preference." });
      }
  };

  const handlePushToggle = (checked) => { setPushEnabled(checked); updatePreference('push_enabled', checked); };
  const handleEmailToggle = (checked) => { setEmailEnabled(checked); updatePreference('email_enabled', checked); };
  const handleSmsToggle = (checked) => { setSmsEnabled(checked); updatePreference('sms_enabled', checked); };
  const handleFrequencyChange = (value) => { setNotificationFrequency(value); updatePreference('notification_frequency', value); };

  const handleQuietHoursChange = (field, value) => {
      if (field === 'start') { setQuietHoursStart(value); updatePreference('quiet_hours_start', value); } 
      else { setQuietHoursEnd(value); updatePreference('quiet_hours_end', value); }
  };

  const handleSaveAdminWhatsapp = async () => {
      if (!adminWhatsappNumber || adminWhatsappNumber.trim().length < 8) {
          toast({ variant: "destructive", description: "Veuillez entrer un numéro valide." });
          return;
      }
      setIsAdminWhatsappLoading(true);
      try {
          const { error } = await supabase.from('admin_config').upsert({
              config_key: 'whatsapp_number',
              config_value: adminWhatsappNumber.trim(),
              description: 'Numéro WhatsApp pour la réception des preuves de paiement'
          }, { onConflict: 'config_key' });
          if (error) throw error;
          toast({ title: "Succès", description: "Numéro mis à jour." });
      } catch (err) {
          console.error(err);
          toast({ variant: "destructive", title: "Erreur", description: "Impossible de sauvegarder." });
      } finally { setIsAdminWhatsappLoading(false); }
  }

  const handleSaveUserWhatsapp = async () => {
    const cleanedNumber = userWhatsapp.trim();
    if (!cleanedNumber) { toast({ variant: "destructive", description: "Please enter a WhatsApp number." }); return; }
    if (!/^\+\d+$/.test(cleanedNumber)) { toast({ variant: "destructive", description: "Phone number must start with '+' and contain only digits." }); return; }
    
    setIsUserWhatsappLoading(true);
    try {
        const { error } = await supabase.from('notification_preferences').upsert({
                user_id: user.id,
                whatsapp_number: cleanedNumber,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        if (error) throw error;
        toast({ title: "Success", description: "WhatsApp number saved successfully." });
    } catch (err) {
        console.error(err);
        toast({ variant: "destructive", title: "Error", description: "Failed to save WhatsApp number." });
    } finally { setIsUserWhatsappLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ variant: 'destructive', description: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      toast({ description: "Password updated successfully" });
      setIsPasswordModalOpen(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error) { toast({ variant: 'destructive', description: error.message }); } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id);
      if (profileError) console.error('Error deleting profile:', profileError);
      await signOut();
      navigate('/');
      toast({ title: "Account Deleted", description: "Your account has been removed." });
    } catch (error) { toast({ variant: 'destructive', description: "Could not delete account. Contact support." }); } finally { setLoading(false); setIsDeleteModalOpen(false); }
  };

  const handleTestAudio = async () => {
    console.log("SettingsPage: Test Voice button clicked");
    setIsTestingAudio(true);
    
    try {
      const textToSpeak = voiceLanguage === 'fr' ? "Ceci est un test audio." : "This is an audio test.";
      
      // Additional safety wrapper to guarantee we don't hang indefinitely 
      // if underlying systems fail silently.
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Le délai d'attente a été dépassé (5s).")), 5000);
      });

      console.log("SettingsPage: Executing voice test generation...");
      
      // Prioritize the robust testVoice from useVoice, fallback to testTTS
      const speakAction = testVoice ? testVoice(textToSpeak, voiceLanguage) : testTTS(textToSpeak);
      
      const success = await Promise.race([
        speakAction,
        timeoutPromise
      ]);

      console.log("SettingsPage: Voice test completed. Success:", success);

      if (success) {
        toast({ title: "Test Réussi", description: "L'audio a été lu avec succès.", className: "bg-amber-50 border-amber-200" });
      } else {
        toast({ variant: "destructive", title: "Test Échoué", description: "Impossible de lire la voix. Le son de secours a été activé." });
      }
    } catch (error) {
      console.error("SettingsPage: Error during voice test:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message || "Une erreur inattendue est survenue lors du test audio." });
    } finally {
      console.log("SettingsPage: Resetting testing audio state to false.");
      setIsTestingAudio(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
  const sectionVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, delay: 0.1 } } };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-4 px-4">
      <Helmet><title>Paramètres - La Desirade Plus</title></Helmet>

       <header className="sticky top-0 z-40 bg-white px-4 py-4 flex items-center justify-between shadow-sm mb-4 -mx-4">
          <Button variant="ghost" size="icon" className="text-[#111827] -ml-2" onClick={() => navigate(-1)}>
            <ArrowRight className="w-6 h-6 rotate-180" />
          </Button>
          <h1 className="text-xl font-bold text-[#111827]">Paramètres</h1>
          <div className="w-8"></div> 
        </header>

      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="container mx-auto max-w-2xl space-y-6">

          {/* Voice Notification Settings with Diagnostics */}
          <motion.div variants={sectionVariants} className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
             <div className="p-4 border-b border-blue-100 bg-blue-50/50 flex justify-between items-center">
               <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                 <Volume2 className="w-5 h-5 text-blue-600" /> Notifications Vocales
               </h2>
               {!diagStatus.isSupported && <Badge variant="destructive">Non Supporté</Badge>}
             </div>
             
             <div className="p-4 space-y-4">
               {/* Diagnostic Info Mini */}
               <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100 text-sm space-y-2 mb-4">
                 <div className="flex justify-between items-center text-blue-900">
                    <span className="font-medium flex items-center gap-2"><Activity className="w-4 h-4"/> État du système:</span>
                    <span>{diagStatus.isSupported ? "Opérationnel" : "Mode restreint"}</span>
                 </div>
                 <div className="flex justify-between items-center text-blue-800 text-xs">
                    <span>Voix disponibles:</span>
                    <span>{diagStatus.voiceCount} voix chargées</span>
                 </div>
                 {(!diagStatus.isSupported || diagStatus.voiceCount === 0) && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>Le système utilise le mode de secours (bips). Si vous ne l'entendez pas, assurez-vous d'avoir interagi avec la page.</p>
                    </div>
                 )}
                 {isAdmin && (
                   <Link to="/admin/settings?tab=diagnostics" className="text-xs text-blue-600 underline flex items-center mt-2">
                     Voir les diagnostics avancés
                   </Link>
                 )}
               </div>

               <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                    <label className="text-sm font-medium leading-none text-gray-900">Activer les annonces</label>
                    <p className="text-xs text-gray-500">Annonce vocale lors du changement de statut de commande.</p>
                 </div>
                 <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} className="data-[state=checked]:bg-blue-600"/>
               </div>

               {voiceEnabled && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 border-t border-blue-50">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-xs font-medium text-gray-700">Langue</label>
                       <Select value={voiceLanguage} onValueChange={setVoiceLanguage}>
                         <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="fr">🇫🇷 Français</SelectItem>
                           <SelectItem value="en">🇬🇧 English</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700 flex justify-between">
                          <span>Volume</span>
                          <span>{Math.round((voiceVolume || 1) * 100)}%</span>
                        </label>
                        <Slider value={[voiceVolume || 1]} max={1} step={0.1} onValueChange={([val]) => setVoiceVolume(val)} className="py-2" />
                     </div>
                   </div>
                   
                   <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={handleTestAudio} disabled={isTestingAudio} className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 relative overflow-hidden">
                       {isTestingAudio ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Lecture en cours...</> : <><PlayCircle className="w-4 h-4 mr-2" /> Tester la voix</>}
                     </Button>
                     <Button variant="outline" size="sm" onClick={testFallback} disabled={isTestingAudio} className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50" title="Tester le bip de secours">
                       <Bell className="w-4 h-4 mr-2" /> Test Bip
                     </Button>
                   </div>
                 </motion.div>
               )}
             </div>
          </motion.div>

          {/* Admin Section */}
          {isAdmin && (
            <motion.div variants={sectionVariants} className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
                <div className="p-4 border-b border-green-100 bg-amber-50/50">
                <h2 className="font-semibold text-amber-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#D97706]" /> Configuration Admin (Magasin)
                </h2>
                </div>
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-whatsapp" className="text-gray-700 font-medium">WhatsApp Réception Preuves</Label>
                        <div className="flex gap-2">
                            <Input id="admin-whatsapp" value={adminWhatsappNumber} onChange={(e) => setAdminWhatsappNumber(e.target.value)} placeholder="Ex: 22507070707" className="flex-1"/>
                            <Button onClick={handleSaveAdminWhatsapp} disabled={isAdminWhatsappLoading} className="bg-[#D97706] hover:bg-[#B45309] text-white">
                                {isAdminWhatsappLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">Ce numéro recevra les preuves de paiement des clients.</p>
                    </div>
                </div>
            </motion.div>
          )}

          {/* User Notifications Section */}
          <motion.div variants={sectionVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#D97706]" /> Notifications
              </h2>
            </div>
            
            {loadingPreferences ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
            ) : (
                <div className="p-4 space-y-6">
                
                {/* WhatsApp Notification Field */}
                <div className="space-y-3 pb-4 border-b border-gray-100">
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="user-whatsapp" className="text-gray-900 font-medium flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-600" /> WhatsApp Number
                        </Label>
                        <span className="text-xs text-gray-500">Pour recevoir les mises à jour par WhatsApp.</span>
                    </div>
                    <div className="flex gap-2">
                        <Input id="user-whatsapp" value={userWhatsapp} onChange={(e) => setUserWhatsapp(e.target.value)} placeholder="+33612345678" className="flex-1" type="tel"/>
                        <Button onClick={handleSaveUserWhatsapp} disabled={isUserWhatsappLoading} variant="outline" className="border-gray-200 hover:bg-gray-50">
                            {isUserWhatsappLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <Save className="w-4 h-4 text-gray-500" />}
                        </Button>
                    </div>
                </div>

                {/* Notification Channels */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Push Notifications</p>
                            <p className="text-xs text-gray-500">Alertes sur votre appareil</p>
                        </div>
                        <Switch checked={pushEnabled} onCheckedChange={handlePushToggle} className="data-[state=checked]:bg-[#D97706]"/>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" /> Email Notifications</p>
                            <p className="text-xs text-gray-500">Mises à jour par email</p>
                        </div>
                        <Switch checked={emailEnabled} onCheckedChange={handleEmailToggle} className="data-[state=checked]:bg-[#D97706]"/>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-500" /> SMS Notifications</p>
                            <p className="text-xs text-gray-500">Alertes par SMS (frais possibles)</p>
                        </div>
                        <Switch checked={smsEnabled} onCheckedChange={handleSmsToggle} className="data-[state=checked]:bg-[#D97706]"/>
                    </div>
                </div>

                {/* Quiet Hours */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">Heures Silencieuses</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="start-time" className="text-xs text-gray-500">Début</Label>
                            <Input id="start-time" type="time" value={quietHoursStart} onChange={(e) => handleQuietHoursChange('start', e.target.value)} className="h-9"/>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="end-time" className="text-xs text-gray-500">Fin</Label>
                            <Input id="end-time" type="time" value={quietHoursEnd} onChange={(e) => handleQuietHoursChange('end', e.target.value)} className="h-9"/>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 italic">Aucune notification ne sera envoyée pendant ces heures.</p>
                </div>

                {/* Frequency */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                     <Label className="font-medium text-gray-900">Fréquence des notifications</Label>
                     <Select value={notificationFrequency} onValueChange={handleFrequencyChange}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Choisir la fréquence" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="immediately">Immédiatement</SelectItem>
                            <SelectItem value="hourly">Chaque heure (Résumé)</SelectItem>
                            <SelectItem value="daily">Quotidien (Résumé)</SelectItem>
                        </SelectContent>
                     </Select>
                </div>

                </div>
            )}
          </motion.div>

          {/* Privacy Section */}
          <motion.div variants={sectionVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#D97706]" /> Sécurité et Confidentialité
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {/* Change Password */}
              <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogTrigger asChild>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">Changer le mot de passe</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Changer de mot de passe</DialogTitle>
                    <DialogDescription>Saisissez votre nouveau mot de passe ci-dessous.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nouveau mot de passe</Label>
                      <Input id="new-password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} required/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                      <Input id="confirm-password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} required/>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={loading} className="bg-[#D97706] text-white">
                        {loading ? "Mise à jour..." : "Mettre à jour"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Delete Account */}
              <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogTrigger asChild>
                  <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left text-red-600">
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4" />
                      <span className="font-medium">Supprimer le compte</span>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-600">Supprimer le compte</DialogTitle>
                    <DialogDescription>
                      Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Annuler</Button>
                    <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
                      {loading ? "Suppression..." : "Oui, supprimer mon compte"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

            </div>
          </motion.div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;