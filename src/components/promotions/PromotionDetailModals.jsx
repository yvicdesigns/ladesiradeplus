import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatCurrency } from '@/lib/formatters';

export const PromotionDetailsModal = ({ open, onClose, promotion, usage }) => {
  if (!promotion) return null;
  const promoUsage = usage.filter(u => u.promotion_id === promotion.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Promotion Details</DialogTitle></DialogHeader>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div><strong>Name:</strong> {promotion.name}</div>
                <div><strong>Type:</strong> <Badge>{promotion.type}</Badge></div>
                <div><strong>Status:</strong> <Badge variant={promotion.status === 'active' ? 'default' : 'secondary'}>{promotion.status}</Badge></div>
                <div><strong>Discount:</strong> {promotion.discount_value} {promotion.discount_type === 'percentage' ? '%' : 'USD'}</div>
                <div><strong>Start Date:</strong> {formatDate(promotion.start_date)}</div>
                <div><strong>End Date:</strong> {formatDate(promotion.end_date)}</div>
                <div className="col-span-2"><strong>Description:</strong> {promotion.description}</div>
             </div>
          </TabsContent>
          <TabsContent value="usage" className="space-y-4 py-4">
             <Table>
                <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                   {promoUsage.map(u => (
                     <TableRow key={u.id}>
                        <TableCell>{u.customers?.name || 'Unknown'}</TableCell>
                        <TableCell>{formatDate(u.usage_date)}</TableCell>
                        <TableCell>{formatCurrency(u.discount_amount)}</TableCell>
                     </TableRow>
                   ))}
                   {promoUsage.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No usage recorded</TableCell></TableRow>}
                </TableBody>
             </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export const PromoCodeDetailsModal = ({ open, onClose, code, usage }) => {
  if (!code) return null;
  const codeUsage = usage.filter(u => u.promo_code_id === code.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Promo Code Details</DialogTitle></DialogHeader>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div><strong>Code:</strong> <span className="font-mono">{code.code}</span></div>
                <div><strong>Promotion:</strong> {code.promotions?.name}</div>
                <div><strong>Status:</strong> <Badge variant={code.status === 'active' ? 'default' : 'secondary'}>{code.status}</Badge></div>
                <div><strong>Discount:</strong> {code.discount_value} {code.discount_type === 'percentage' ? '%' : 'USD'}</div>
                <div><strong>Start Date:</strong> {formatDate(code.start_date)}</div>
                <div><strong>Expiry Date:</strong> {formatDate(code.expiry_date)}</div>
                <div><strong>Uses:</strong> {code.usage_count} / {code.max_uses || '∞'}</div>
             </div>
          </TabsContent>
          <TabsContent value="usage" className="space-y-4 py-4">
             <Table>
                <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                   {codeUsage.map(u => (
                     <TableRow key={u.id}>
                        <TableCell>{u.customers?.name || 'Unknown'}</TableCell>
                        <TableCell>{formatDate(u.usage_date)}</TableCell>
                        <TableCell>{formatCurrency(u.discount_amount)}</TableCell>
                     </TableRow>
                   ))}
                   {codeUsage.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No usage recorded</TableCell></TableRow>}
                </TableBody>
             </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export const SpecialOfferDetailsModal = ({ open, onClose, offer }) => {
    if (!offer) return null;
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>Offer Details</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><strong>Name:</strong> {offer.name}</div>
                        <div><strong>Type:</strong> <Badge>{offer.offer_type}</Badge></div>
                        <div><strong>Priority:</strong> {offer.priority}</div>
                        <div><strong>Status:</strong> {offer.status}</div>
                        <div className="col-span-2"><strong>Description:</strong> {offer.description}</div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};