import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSpeech } from '@/hooks/useSpeech';
import { SoundSettingsService } from '@/lib/SoundSettingsService';
import { formatCurrency, formatDeliveryStatusFR } from '@/lib/formatters';
import { Mic, StopCircle, PlayCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export const OrderTrackingVoiceReader = ({ order }) => {
  const { speakText, stopSpeech, isSpeaking, speechEnabled, isSupported } = useSpeech();
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    const loadMessages = async () => {
      const settings = await SoundSettingsService.getAdminSoundSettings();
      setMessages(settings);
    };
    loadMessages();
  }, []);

  if (!order || !messages || !isSupported) return null;

  const replacePlaceholders = (text) => {
    if (!text) return '';
    let result = text;
    result = result.replace('{number}', order.id?.slice(0, 6) || '');
    result = result.replace('{status}', formatDeliveryStatusFR(order.status));
    result = result.replace('{price}', formatCurrency(order.total));
    
    // Construct items string
    const itemsText = order.order_items?.map(i => `${i.quantity} ${i.menu_items?.name || 'article'}`).join(', ');
    result = result.replace('{items}', itemsText || 'votre sélection');
    
    return result;
  };

  const readOrderNumber = () => speakText(replacePlaceholders(messages.order_number_message), {
      speed: messages.voice_speed,
      pitch: messages.voice_pitch
  });
  
  const readOrderStatus = () => speakText(replacePlaceholders(messages.order_status_message), {
      speed: messages.voice_speed,
      pitch: messages.voice_pitch
  });
  
  const readOrderTotal = () => speakText(replacePlaceholders(messages.total_price_message), {
      speed: messages.voice_speed,
      pitch: messages.voice_pitch
  });
  
  const readFullDetails = () => {
    const fullText = [
      replacePlaceholders(messages.order_number_message),
      replacePlaceholders(messages.order_status_message),
      replacePlaceholders(messages.order_details_message),
      replacePlaceholders(messages.total_price_message)
    ].join('. ');
    
    speakText(fullText, {
        speed: messages.voice_speed,
        pitch: messages.voice_pitch
    });
  };

  if (!speechEnabled) return null;

  return (
    <Card className="border-blue-100 bg-blue-50/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
           <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
             <Mic className="w-4 h-4" /> Assistant Vocal
           </h4>
           {isSpeaking && (
             <motion.div 
               animate={{ scale: [1, 1.2, 1] }} 
               transition={{ repeat: Infinity, duration: 1 }}
               className="h-2 w-2 rounded-full bg-red-500"
             />
           )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={readOrderStatus} className="bg-white hover:bg-blue-50 text-xs h-8">
            Lire Statut
          </Button>
          <Button variant="outline" size="sm" onClick={readOrderTotal} className="bg-white hover:bg-blue-50 text-xs h-8">
            Lire Total
          </Button>
          <Button variant="outline" size="sm" onClick={readFullDetails} className="bg-white hover:bg-blue-50 text-xs h-8 col-span-2">
            <Info className="w-3 h-3 mr-2" /> Lire tous les détails
          </Button>
        </div>

        {isSpeaking && (
           <Button 
             variant="destructive" 
             size="sm" 
             onClick={stopSpeech} 
             className="w-full mt-2 h-8 text-xs"
           >
             <StopCircle className="w-3 h-3 mr-2" /> Arrêter la lecture
           </Button>
        )}
      </CardContent>
    </Card>
  );
};