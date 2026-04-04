import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, formatOrderStatus, ORDER_STATUSES } from '@/lib/formatters';
import { supabase } from '@/lib/customSupabaseClient';
import { Printer, X, Check, Truck, Ban, Image } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export const OrderDetailDrawer = ({ order, open, onClose }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (order && open) {
      const fetchItems = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('order_items')
          .select('*, menu_items(name)')
          .eq('order_id', order.id);
        setItems(data || []);
        setLoading(false);
      };
      fetchItems();
    }
  }, [order, open]);

  const updateStatus = async (status) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', order.id);

    if (error) {
      console.error('Error updating status:', error);
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } else {
      toast({ title: t('admin.order_drawer.status_updated'), description: t('admin.order_drawer.status_msg', { status }) });
      onClose();
    }
  };

  if (!order) return null;

  const showPaymentProofSection = order.payment_screenshot_url;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle>{t('admin.order_drawer.title', { id: order.id.slice(0, 8) })}</SheetTitle>
            <Badge className={formatOrderStatus(order.status)}>{order.status}</Badge>
          </div>
          <SheetDescription>
            {t('admin.order_drawer.placed_on')} {formatDateTime(order.created_at)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          {/* Order Items */}
          <div>
            <h4 className="font-semibold mb-3">{t('admin.order_drawer.items_title')}</h4>
            <div className="space-y-3">
              {loading ? <p className="text-sm text-muted-foreground">{t('admin.order_drawer.loading')}</p> : items.map((item) => (
                <div key={item.id} className="flex justify-between items-start py-2 border-b last:border-0">
                  <div className="flex gap-3">
                    <span className="font-medium w-6 text-center bg-gray-100 rounded text-sm py-0.5">
                      {item.quantity}x
                    </span>
                    <div>
                      <p className="font-medium text-sm">{item.menu_items?.name}</p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground italic">{t('admin.order_drawer.note')}: {item.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <span className="font-semibold">{t('admin.order_drawer.total_amount')}</span>
              <span className="font-bold text-lg">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">{t('admin.order_drawer.customer_section')}</p>
              <p className="text-sm font-medium mt-1">{order.customer_name || t('admin.order_drawer.guest')}</p>
              {order.delivery_address && (
                <p className="text-xs text-gray-600 mt-1">{order.delivery_address}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">{t('admin.order_drawer.payment_section')}</p>
              <p className="text-sm font-medium mt-1 uppercase">{order.payment_method || 'Card'}</p>
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <Check className="h-3 w-3" /> {t('admin.order_drawer.paid')}
              </p>
            </div>
             {/* Payment Proof Screenshot */}
            {showPaymentProofSection && (
              <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('admin.order_drawer.proof_section')}</p>
                  {order.payment_screenshot_url ? (
                    <a 
                      href={order.payment_screenshot_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 text-blue-600 underline hover:text-blue-800 transition-colors text-sm"
                    >
                      <Image className="h-4 w-4" /> {t('admin.order_drawer.view_proof')}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <Image className="h-4 w-4 text-gray-400" /> {t('admin.order_drawer.no_image')}
                    </span>
                  )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            {order.status === ORDER_STATUSES.PENDING && (
              <>
                <Button variant="outline" className="w-full border-red-200 hover:bg-red-50 text-red-700" onClick={() => updateStatus(ORDER_STATUSES.CANCELLED)}>
                  <Ban className="h-4 w-4 mr-2" /> {t('admin.order_drawer.reject')}
                </Button>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => updateStatus(ORDER_STATUSES.CONFIRMED)}>
                  <Check className="h-4 w-4 mr-2" /> {t('admin.order_drawer.accept')}
                </Button>
              </>
            )}
            
            {(order.status === ORDER_STATUSES.CONFIRMED || order.status === 'accepted') && (
              <Button className="w-full col-span-2 bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus(ORDER_STATUSES.PREPARING)}>
                {t('admin.order_drawer.start_prep')}
              </Button>
            )}

            {order.status === ORDER_STATUSES.PREPARING && (
              <Button className="w-full col-span-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => updateStatus(ORDER_STATUSES.READY)}>
                {t('admin.order_drawer.mark_ready')}
              </Button>
            )}

             {order.status === ORDER_STATUSES.READY && (
              <Button className="w-full col-span-2 bg-purple-600 hover:bg-purple-700" onClick={() => updateStatus(ORDER_STATUSES.COMPLETED)}>
                <Truck className="h-4 w-4 mr-2" /> {t('admin.order_drawer.mark_completed')}
              </Button>
            )}
            
            <Button variant="secondary" className="w-full col-span-2 mt-2">
              <Printer className="h-4 w-4 mr-2" /> {t('admin.order_drawer.print_ticket')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};