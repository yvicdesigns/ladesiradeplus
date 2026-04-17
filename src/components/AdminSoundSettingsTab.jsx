import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { SoundSettingsService } from '@/lib/SoundSettingsService';
import SoundCacheService from '@/lib/SoundCacheService';
import { Play, Save, Loader2, Volume2, Mic, AlertCircle, Wrench, MousePointerClick, Bell, CheckCircle, MessageSquare, RotateCcw, Upload, Trash2, Music, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { useVoice } from '@/hooks/useVoice';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminAudioDiagnosticPanel } from '@/components/AdminAudioDiagnosticPanel';

const AVAILABLE_SOUNDS = [
  { id: 'alert_bell', name: '🔔 Sonnerie Alerte (Recommandé)' },
  { id: 'chime', name: 'Carillon (Mélodique)' },
  { id: 'ding', name: 'Ding (Cloche)' },
  { id: 'beep_high', name: 'Beep (Aigu)' },
  { id: 'beep', name: 'Beep (Standard)' },
  { id: 'beep_low', name: 'Beep (Grave)' },
  { id: 'pop', name: 'Pop (Percussif)' }
];

const MESSAGE_TYPES = [
  { id: 'admin_new_order', label: 'Admin - Nouvelle commande' },
  { id: 'client_order_pending', label: 'Client - En attente' },
  { id: 'client_order_received', label: 'Client - Reçue / Confirmée' },
  { id: 'client_order_preparing', label: 'Client - En préparation' },
  { id: 'client_order_ready', label: 'Client - Prête' },
  { id: 'client_order_sent', label: 'Client - Envoyée' },
  { id: 'client_order_delivered', label: 'Client - Livrée' }
];

export const AdminSoundSettingsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [testingSound, setTestingSound] = useState(null);
  const [uploading, setUploading] = useState(null);
  const loadedRef = useRef(false);
  const fileInputRef = useRef(null);
  
  // Use voice hook to preview voice settings
  const { speak, isSpeaking } = useVoice('admin');
  
  const [settings, setSettings] = useState(SoundSettingsService.getDefaultSettings());

  useEffect(() => {
    if (!loadedRef.current) {
        loadSettings();
        loadedRef.current = true;
    }
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await SoundSettingsService.getAdminSoundSettings();
      if (data) {
        setSettings(prev => ({
            ...prev,
            ...data
        }));
        
        // Update cache so app reflects loaded DB state immediately
        SoundCacheService.updateSettings({
            global: data.default_sound_volume,
            button: data.button_volume,
            notification: data.notification_volume,
            success: data.success_volume,
            buttonType: data.button_sound_type,
            notificationType: data.notification_sound_type,
            successType: data.success_sound_type
        });
      }
    } catch (err) {
      console.error("Failed to load sound settings:", err);
      setError("Impossible de charger les paramètres audio.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await SoundSettingsService.saveAdminSoundSettings(settings);
      
      // Update cache
      SoundCacheService.updateSettings({
        global: settings.default_sound_volume,
        button: settings.button_volume,
        notification: settings.notification_volume,
        success: settings.success_volume,
        buttonType: settings.button_sound_type,
        notificationType: settings.notification_sound_type,
        successType: settings.success_sound_type
      });

      toast({ title: "Succès", description: "Configuration audio sauvegardée." });
    } catch (err) {
      console.error("Failed to save sound settings:", err);
      setError("Erreur lors de la sauvegarde.");
      toast({ variant: "destructive", title: "Erreur", description: "Échec de la sauvegarde." });
    } finally {
      setSaving(false);
    }
  };

  const testSpecificSound = async (type, volume, categoryId) => {
    setTestingSound(categoryId);
    try {
      await SoundCacheService.playGeneratedSound(type, volume);
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setTestingSound(null), 500);
  };

  const testVoice = (text) => {
    if(!text) return;
    speak(text);
  };

  const resetVoiceTexts = (type) => {
    const defaults = SoundSettingsService.getDefaultSettings();
    setSettings(prev => {
        const next = { ...prev };
        if(type === 'admin') {
            next.admin_new_order_voice_text = defaults.admin_new_order_voice_text;
        } else if(type === 'client') {
            next.client_order_pending_voice_text = defaults.client_order_pending_voice_text;
            next.client_order_received_voice_text = defaults.client_order_received_voice_text;
            next.client_order_preparing_voice_text = defaults.client_order_preparing_voice_text;
            next.client_order_ready_voice_text = defaults.client_order_ready_voice_text;
            next.client_order_sent_voice_text = defaults.client_order_sent_voice_text;
            next.client_order_delivered_voice_text = defaults.client_order_delivered_voice_text;
        }
        return next;
    });
    toast({ description: "Textes réinitialisés (non sauvegardé)" });
  };

  const handleFileUpload = async (event, messageType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(messageType);
    try {
      const publicUrl = await SoundSettingsService.uploadAudioFile(file, messageType);
      setSettings(prev => ({
        ...prev,
        [`${messageType}_audio_url`]: publicUrl,
        [`${messageType}_audio_enabled`]: true // Auto-enable on upload
      }));
      toast({ title: "Fichier uploadé", description: "Le fichier audio a été ajouté avec succès." });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ variant: "destructive", title: "Erreur", description: "Échec de l'upload du fichier." });
    } finally {
      setUploading(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteAudioFile = (messageType) => {
    setSettings(prev => ({
      ...prev,
      [`${messageType}_audio_url`]: '',
      [`${messageType}_audio_enabled`]: false
    }));
  };

  const testAudioFile = (url) => {
    if (!url) return;
    const audio = new Audio(url);
    audio.volume = settings.default_sound_volume; // Use global volume for test
    audio.play().catch(e => console.error("Audio play error", e));
  };

  return (
    <div className="space-y-6">
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="config" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="config" className="flex gap-2"><Volume2 className="h-4 w-4" /> Configuration</TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex gap-2"><Activity className="h-4 w-4" /> Diagnostics</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" asChild className="hidden md:flex">
            <Link to="/admin/sound-test">
              <Wrench className="w-4 h-4 mr-2" />
              Ouvrir le laboratoire audio
            </Link>
          </Button>
        </div>

        <TabsContent value="config" className="space-y-6">
          {/* Volume & Type Control Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Volume2 className="h-5 w-5" /> Volumes & Sons</CardTitle>
              <CardDescription>Personnalisez le type de son et le volume pour chaque catégorie.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                
                {/* Global Volume */}
                <div className="space-y-3 pb-4 border-b">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold flex items-center gap-2"><Volume2 className="w-4 h-4" /> Volume Global (Défaut)</Label>
                    <span className="text-sm font-mono">{Math.round(settings.default_sound_volume * 100)}%</span>
                  </div>
                  <Slider 
                    value={[settings.default_sound_volume]} 
                    max={1} step={0.05} 
                    onValueChange={([val]) => setSettings(s => ({...s, default_sound_volume: val}))} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Button Sounds */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border">
                      <div className="flex items-center gap-2 text-primary font-semibold">
                          <MousePointerClick className="w-4 h-4" /> Boutons
                      </div>
                      
                      <div className="space-y-2">
                          <Label className="text-xs">Type de son</Label>
                          <Select 
                            value={settings.button_sound_type} 
                            onValueChange={(val) => setSettings(s => ({...s, button_sound_type: val}))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_SOUNDS.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-xs">Volume</Label>
                            <span className="text-xs text-muted-foreground">{Math.round(settings.button_volume * 100)}%</span>
                          </div>
                          <Slider 
                              value={[settings.button_volume]} 
                              max={1} step={0.05} 
                              onValueChange={([val]) => setSettings(s => ({...s, button_volume: val}))} 
                          />
                      </div>

                      <Button 
                          variant="secondary" size="sm" className="w-full mt-2"
                          disabled={testingSound === 'button'}
                          onClick={() => testSpecificSound(settings.button_sound_type, settings.button_volume, 'button')}
                      >
                          {testingSound === 'button' ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : <Play className="w-3 h-3 mr-2" />}
                          Tester
                      </Button>
                    </div>

                    {/* Notification Sounds */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border">
                      <div className="flex items-center gap-2 text-amber-600 font-semibold">
                          <Bell className="w-4 h-4" /> Notifications
                      </div>
                      
                      <div className="space-y-2">
                          <Label className="text-xs">Type de son</Label>
                          <Select 
                            value={settings.notification_sound_type} 
                            onValueChange={(val) => setSettings(s => ({...s, notification_sound_type: val}))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_SOUNDS.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-xs">Volume</Label>
                            <span className="text-xs text-muted-foreground">{Math.round(settings.notification_volume * 100)}%</span>
                          </div>
                          <Slider 
                              value={[settings.notification_volume]} 
                              max={1} step={0.05} 
                              onValueChange={([val]) => setSettings(s => ({...s, notification_volume: val}))} 
                          />
                      </div>

                      <Button 
                          variant="secondary" size="sm" className="w-full mt-2"
                          disabled={testingSound === 'notification'}
                          onClick={() => testSpecificSound(settings.notification_sound_type, settings.notification_volume, 'notification')}
                      >
                          {testingSound === 'notification' ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : <Play className="w-3 h-3 mr-2" />}
                          Tester
                      </Button>
                    </div>

                    {/* Success Sounds */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border">
                      <div className="flex items-center gap-2 text-amber-600 font-semibold">
                          <CheckCircle className="w-4 h-4" /> Succès
                      </div>
                      
                      <div className="space-y-2">
                          <Label className="text-xs">Type de son</Label>
                          <Select 
                            value={settings.success_sound_type} 
                            onValueChange={(val) => setSettings(s => ({...s, success_sound_type: val}))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_SOUNDS.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>

                      <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-xs">Volume</Label>
                            <span className="text-xs text-muted-foreground">{Math.round(settings.success_volume * 100)}%</span>
                          </div>
                          <Slider 
                              value={[settings.success_volume]} 
                              max={1} step={0.05} 
                              onValueChange={([val]) => setSettings(s => ({...s, success_volume: val}))} 
                          />
                      </div>

                      <Button 
                          variant="secondary" size="sm" className="w-full mt-2"
                          disabled={testingSound === 'success'}
                          onClick={() => testSpecificSound(settings.success_sound_type, settings.success_volume, 'success')}
                      >
                          {testingSound === 'success' ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : <Play className="w-3 h-3 mr-2" />}
                          Tester
                      </Button>
                    </div>
                </div>

            </CardContent>
          </Card>

          {/* Voice Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5" /> Synthèse Vocale</CardTitle>
              <CardDescription>Configuration des annonces vocales pour les commandes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-0.5">
                    <Label>Admin Voice Notifications</Label>
                    <p className="text-xs text-gray-500">Activer la voix pour le panel admin</p>
                  </div>
                  <Switch 
                    checked={settings.admin_voice_enabled}
                    onCheckedChange={(val) => setSettings({...settings, admin_voice_enabled: val})}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-0.5">
                    <Label>Client Voice Tracking</Label>
                    <p className="text-xs text-gray-500">Autoriser la voix pour les clients</p>
                  </div>
                  <Switch 
                    checked={settings.client_voice_enabled}
                    onCheckedChange={(val) => setSettings({...settings, client_voice_enabled: val})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <Label>Vitesse ({settings.voice_speed}x)</Label>
                  <Slider 
                    value={[settings.voice_speed]} 
                    min={0.5} max={2} step={0.1} 
                    onValueChange={([val]) => setSettings({...settings, voice_speed: val})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hauteur ({settings.voice_pitch})</Label>
                  <Slider 
                    value={[settings.voice_pitch]} 
                    min={0.5} max={2} step={0.1} 
                    onValueChange={([val]) => setSettings({...settings, voice_pitch: val})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Audio Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Music className="h-5 w-5" /> Voix réelles (Fichiers Audio)</CardTitle>
              <CardDescription>Upload de fichiers MP3/WAV pour remplacer la synthèse vocale.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {MESSAGE_TYPES.map((type) => (
                <div key={type.id} className="p-4 border rounded-xl bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <Switch 
                            checked={settings[`${type.id}_audio_enabled`]}
                            onCheckedChange={(val) => setSettings({...settings, [`${type.id}_audio_enabled`]: val})}
                          />
                          <Label className="font-semibold">{type.label}</Label>
                      </div>
                      {settings[`${type.id}_audio_url`] && (
                          <Button variant="ghost" size="sm" onClick={() => deleteAudioFile(type.id)} className="text-red-500 hover:text-red-700 h-8">
                              <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                          </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                          {settings[`${type.id}_audio_url`] ? (
                            <div className="flex items-center gap-2 text-sm bg-white p-2 rounded border text-amber-700">
                                <Music className="w-4 h-4" />
                                <span className="truncate max-w-[200px]">{settings[`${type.id}_audio_url`].split('/').pop()}</span>
                            </div>
                          ) : (
                            <div className="relative">
                                <Input 
                                  type="file" 
                                  accept="audio/*" 
                                  className="cursor-pointer"
                                  onChange={(e) => handleFileUpload(e, type.id)}
                                  disabled={uploading === type.id}
                                />
                                {uploading === type.id && (
                                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                  </div>
                                )}
                            </div>
                          )}
                      </div>
                      <Button 
                          variant="outline" 
                          size="icon" 
                          disabled={!settings[`${type.id}_audio_url`]}
                          onClick={() => testAudioFile(settings[`${type.id}_audio_url`])}
                      >
                          <Play className="w-4 h-4" />
                      </Button>
                    </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Custom Voice Texts Section */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Textes de synthèse (Fallback)</CardTitle>
                <CardDescription>Messages utilisés si aucun fichier audio n'est activé.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Admin Texts */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-semibold text-sm text-gray-900">Admin - Messages</h3>
                        <Button variant="ghost" size="sm" onClick={() => resetVoiceTexts('admin')} className="h-8 text-xs">
                            <RotateCcw className="w-3 h-3 mr-1" /> Réinitialiser
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Nouvelle commande</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.admin_new_order_voice_text}
                                    onChange={(e) => setSettings({...settings, admin_new_order_voice_text: e.target.value})}
                                />
                                <Button variant="outline" size="icon" onClick={() => testVoice(settings.admin_new_order_voice_text)}>
                                    <Play className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Texts */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-semibold text-sm text-gray-900">Client - Suivi de commande</h3>
                        <Button variant="ghost" size="sm" onClick={() => resetVoiceTexts('client')} className="h-8 text-xs">
                            <RotateCcw className="w-3 h-3 mr-1" /> Réinitialiser
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs">Statut: En attente (Pending)</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.client_order_pending_voice_text}
                                    onChange={(e) => setSettings({...settings, client_order_pending_voice_text: e.target.value})}
                                />
                                <Button variant="outline" size="icon" onClick={() => testVoice(settings.client_order_pending_voice_text)}>
                                    <Play className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Statut: Reçue / Confirmée</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.client_order_received_voice_text}
                                    onChange={(e) => setSettings({...settings, client_order_received_voice_text: e.target.value})}
                                />
                                <Button variant="outline" size="icon" onClick={() => testVoice(settings.client_order_received_voice_text)}>
                                    <Play className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Statut: En préparation</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.client_order_preparing_voice_text}
                                    onChange={(e) => setSettings({...settings, client_order_preparing_voice_text: e.target.value})}
                                />
                                <Button variant="outline" size="icon" onClick={() => testVoice(settings.client_order_preparing_voice_text)}>
                                    <Play className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Statut: Prête</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.client_order_ready_voice_text}
                                    onChange={(e) => setSettings({...settings, client_order_ready_voice_text: e.target.value})}
                                />
                                <Button variant="outline" size="icon" onClick={() => testVoice(settings.client_order_ready_voice_text)}>
                                    <Play className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Statut: Envoyée (In Transit)</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.client_order_sent_voice_text}
                                    onChange={(e) => setSettings({...settings, client_order_sent_voice_text: e.target.value})}
                                />
                                <Button variant="outline" size="icon" onClick={() => testVoice(settings.client_order_sent_voice_text)}>
                                    <Play className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Statut: Livrée</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={settings.client_order_delivered_voice_text}
                                    onChange={(e) => setSettings({...settings, client_order_delivered_voice_text: e.target.value})}
                                />
                                <Button variant="outline" size="icon" onClick={() => testVoice(settings.client_order_delivered_voice_text)}>
                                    <Play className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pb-10">
            <Button 
              onClick={handleSave} 
              disabled={saving || loading}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Sauvegarder la configuration
            </Button>
          </div>
        </TabsContent>
        
        {/* DIAGNOSTICS TAB */}
        <TabsContent value="diagnostics" className="space-y-6">
          <AdminAudioDiagnosticPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};