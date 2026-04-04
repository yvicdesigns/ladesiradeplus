import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Copy, GripVertical, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/promoUtils';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';

export const BannerPreviewCard = ({ 
  banner, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onToggleActive,
  dragHandleProps = null,
  isFormPreview = false
}) => {
  const getBackgroundStyle = () => {
    const style = {
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };

    const imgUrl = banner.active_image_url || banner.image_url;

    if (imgUrl && banner.show_image !== false && (banner.banner_type === 'image_only' || banner.banner_type === 'image_text')) {
      style.backgroundImage = `url(${imgUrl})`;
    } else {
      if (banner.background_color_type === 'gradient') {
        const directionMap = {
          'to-bottom': 'to bottom',
          'to-right': 'to right',
          'to-bottom-right': '135deg',
          'to-bottom-left': '225deg'
        };
        const dir = directionMap[banner.background_gradient_direction] || '135deg';
        style.background = `linear-gradient(${dir}, ${banner.background_gradient_color1 || '#F59E0B'}, ${banner.background_gradient_color2 || '#D97706'})`;
      } else {
        style.backgroundColor = banner.background_color_solid || '#D97706';
      }
    }
    return style;
  };

  const hasImage = banner.active_image_url || banner.image_url;

  return (
    <div className={cn(
      "flex flex-col xl:flex-row bg-white rounded-xl border border-border shadow-sm overflow-hidden group transition-all",
      !isFormPreview && "hover:shadow-md"
    )}>
      
      {/* Drag Handle & Order Badge (Admin View Only) */}
      {!isFormPreview && dragHandleProps && (
        <div 
          className="bg-muted/50 w-10 flex flex-col items-center justify-center border-r border-border cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] font-bold mt-2 text-muted-foreground">{banner.display_order}</span>
        </div>
      )}

      {/* Visual Preview Area */}
      <div className="relative w-full xl:w-96 h-48 xl:h-auto shrink-0 bg-muted overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full" style={getBackgroundStyle()} />
        
        {/* Dark Overlay for Text Readability */}
        {(hasImage && banner.banner_type === 'image_text' && banner.show_image) && (
          <div className="absolute inset-0 bg-black/40" />
        )}

        <div className="relative z-10 w-full h-full p-4 flex items-center justify-between">
          <div className="flex flex-col justify-center h-full max-w-[65%] space-y-1.5">
            {banner.show_text !== false && (
              <h3 
                className="text-lg font-bold leading-tight drop-shadow-md line-clamp-2"
                style={{ color: banner.text_color || '#ffffff' }}
              >
                {banner.title || 'Titre de la bannière'}
              </h3>
            )}
            
            {Number(banner.discount_percentage) > 0 && (
               <Badge className="w-fit bg-white text-amber-600 hover:bg-white text-[10px] font-bold px-1.5 py-0 shadow-sm border-none">
                 -{banner.discount_percentage}% OFF
               </Badge>
            )}

            {banner.show_button !== false && (
              <Button 
                size="sm" 
                className="mt-1 h-6 px-3 rounded-full font-bold text-[10px] shadow-md w-fit"
                style={{ 
                  backgroundColor: banner.button_color || '#ffffff', 
                  color: banner.button_text_color || '#D97706' 
                }}
              >
                {banner.button_text || 'Commande'}
              </Button>
            )}
          </div>

          {banner.product_image_url && (
            <div className="absolute right-2 bottom-2 w-24 h-24">
              <img 
                src={banner.product_image_url} 
                alt="Product Preview" 
                className="w-full h-full object-cover rounded-full border-2 border-white/20 shadow-xl"
              />
            </div>
          )}
        </div>

        {/* Status Overlay */}
        {!isFormPreview && !banner.is_active && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-20">
            <Badge variant="secondary" className="font-bold border-border shadow-sm text-sm py-1 px-3">Inactif</Badge>
          </div>
        )}
      </div>

      {/* Details & Actions Area (Admin View Only) */}
      {!isFormPreview && (
        <div className="flex flex-1 flex-col justify-between p-4 bg-card min-w-[300px]">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h4 className="font-bold text-lg text-foreground line-clamp-1">{banner.title}</h4>
              <Badge variant={banner.is_active ? "default" : "outline"} className={banner.is_active ? "bg-amber-500 hover:bg-green-600" : ""}>
                {banner.is_active ? 'Visible' : 'Caché'}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
                <ImageIcon className="h-3 w-3" />
                {banner.banner_type}
              </span>
              {(banner.linked_product_id || banner.product_id) && banner.product ? (
                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-1 rounded-md font-medium">
                  Produit: {banner.product.name}
                </span>
              ) : banner.link_url ? (
                <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md truncate max-w-[150px]">
                  <ExternalLink className="h-3 w-3" />
                  {banner.link_url}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(banner)} className="h-8 px-2 text-muted-foreground hover:text-foreground">
              <Copy className="h-4 w-4 mr-1" /> Dupliquer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(banner)} className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Edit className="h-4 w-4 mr-1" /> Modifier
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(banner)} className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1" /> Supprimer
            </Button>
          </div>
        </div>
      )}

      {/* QR Code Section (Admin View Only) */}
      {!isFormPreview && (
        <div className="flex items-center justify-center p-4 bg-muted/10 border-t xl:border-t-0 xl:border-l border-border shrink-0 min-w-[180px]">
           <QRCodeDisplay 
             qrDataUrl={banner.qr_code_data} 
             title={banner.title} 
           />
        </div>
      )}
    </div>
  );
};