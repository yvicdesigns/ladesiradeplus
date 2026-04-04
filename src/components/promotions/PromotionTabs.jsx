import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Copy, Eye, RotateCcw, Filter } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { ConfirmationActionModal } from '@/components/notifications/NotificationModals';
import { PromotionModal, PromoCodeModal, SpecialOfferModal, PromotionRuleModal } from './PromotionModals';
import { PromotionDetailsModal, PromoCodeDetailsModal, SpecialOfferDetailsModal } from './PromotionDetailModals';

// --- Shared Helpers ---
const StatusBadge = ({ status }) => {
    const colors = { active: 'bg-amber-100 text-amber-800', draft: 'bg-gray-100 text-gray-800', paused: 'bg-amber-100 text-amber-800', expired: 'bg-red-100 text-red-800', archived: 'bg-gray-800 text-white' };
    return <Badge className={colors[status] || ''} variant="outline">{status}</Badge>;
};

const TypeBadge = ({ type }) => {
    const colors = { percentage: 'bg-blue-100 text-blue-800', fixed_amount: 'bg-amber-100 text-amber-800', free_shipping: 'bg-amber-100 text-amber-800', buy_one_get_one: 'bg-pink-100 text-pink-800', bundle: 'bg-purple-100 text-purple-800', loyalty: 'bg-cyan-100 text-cyan-800' };
    return <Badge className={colors[type] || ''} variant="outline">{type?.replace(/_/g, ' ')}</Badge>;
};

// --- Promotions Tab ---
export const PromotionsTab = ({ promotions, usage, createPromotion, updatePromotion, deletePromotion, togglePromotionStatus, duplicatePromotion }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null); // { type: 'create'|'edit'|'delete'|'details', data: null }

    const filtered = promotions.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Input placeholder="Search promotions..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} />
                <Button onClick={() => setModal({ type: 'create' })}><Plus className="w-4 h-4 mr-2" /> Create Promotion</Button>
            </div>
            <Card>
                <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Discount</TableHead><TableHead>Date Range</TableHead><TableHead>Status</TableHead><TableHead>Usage</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filtered.map(p => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.name}</TableCell>
                                <TableCell><TypeBadge type={p.type} /></TableCell>
                                <TableCell>{p.discount_value ?? 0} {p.discount_type === 'percentage' ? '%' : '$'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {p.start_date ? formatDate(p.start_date) : '-'} — {p.end_date ? formatDate(p.end_date) : 'Forever'}
                                </TableCell>
                                <TableCell><StatusBadge status={p.status} /></TableCell>
                                <TableCell>{p.current_uses || 0} / {p.usage_limit || '∞'}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'details', data: p })}><Eye className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" onClick={() => duplicatePromotion(p)} title="Duplicate"><Copy className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: p })}><Edit className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModal({ type: 'delete', data: p })}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <PromotionModal 
                open={modal?.type === 'create' || modal?.type === 'edit'} 
                promotion={modal?.type === 'edit' ? modal.data : null}
                onClose={() => setModal(null)}
                onSave={data => modal?.type === 'edit' ? updatePromotion(modal.data.id, data) : createPromotion(data)}
            />
            <PromotionDetailsModal
                open={modal?.type === 'details'}
                onClose={() => setModal(null)}
                promotion={modal?.data}
                usage={usage}
            />
            <ConfirmationActionModal
                open={modal?.type === 'delete'}
                onClose={() => setModal(null)}
                title="Delete Promotion"
                description="Are you sure? This action cannot be undone."
                onConfirm={() => deletePromotion(modal.data.id)}
                variant="destructive"
            />
        </div>
    );
};

// --- Promo Codes Tab ---
export const PromoCodesTab = ({ promoCodes, promotions, usage, createPromoCode, updatePromoCode, deletePromoCode, resetPromoCodeCounter }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null);

    const filtered = promoCodes.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Input placeholder="Search codes..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} />
                <Button onClick={() => setModal({ type: 'create' })}><Plus className="w-4 h-4 mr-2" /> Create Code</Button>
            </div>
            <Card>
                <Table>
                    <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Promotion</TableHead><TableHead>Discount</TableHead><TableHead>Status</TableHead><TableHead>Usage</TableHead><TableHead>Expiry</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filtered.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-mono font-bold">{c.code}</TableCell>
                                <TableCell className="text-sm">{c.promotions?.name}</TableCell>
                                <TableCell>{c.discount_value ?? 0}{c.discount_type === 'percentage' ? '%' : '$'}</TableCell>
                                <TableCell><StatusBadge status={c.status} /></TableCell>
                                <TableCell>{c.usage_count} / {c.max_uses || '∞'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{c.expiry_date ? formatDate(c.expiry_date) : 'Never'}</TableCell>
                                <TableCell className="text-right space-x-1">
                                     <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'details', data: c })}><Eye className="w-4 h-4"/></Button>
                                     <Button size="icon" variant="ghost" onClick={() => resetPromoCodeCounter(c.id)} title="Reset Usage"><RotateCcw className="w-4 h-4"/></Button>
                                     <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: c })}><Edit className="w-4 h-4"/></Button>
                                     <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModal({ type: 'delete', data: c })}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            <PromoCodeModal
                open={modal?.type === 'create' || modal?.type === 'edit'}
                code={modal?.type === 'edit' ? modal.data : null}
                promotions={promotions}
                onClose={() => setModal(null)}
                onSave={data => modal?.type === 'edit' ? updatePromoCode(modal.data.id, data) : createPromoCode(data)}
            />
            <PromoCodeDetailsModal
                open={modal?.type === 'details'}
                onClose={() => setModal(null)}
                code={modal?.data}
                usage={usage}
            />
            <ConfirmationActionModal
                open={modal?.type === 'delete'}
                onClose={() => setModal(null)}
                title="Delete Promo Code"
                description="Are you sure?"
                onConfirm={() => deletePromoCode(modal.data.id)}
                variant="destructive"
            />
        </div>
    );
};

// --- Special Offers Tab ---
export const SpecialOffersTab = ({ specialOffers, createSpecialOffer, updateSpecialOffer, deleteSpecialOffer, duplicateSpecialOffer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null);

    const filtered = specialOffers.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                <Input placeholder="Search offers..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} />
                <Button onClick={() => setModal({ type: 'create' })}><Plus className="w-4 h-4 mr-2" /> Create Offer</Button>
            </div>
            <Card>
                <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead>Dates</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filtered.map(o => (
                            <TableRow key={o.id}>
                                <TableCell className="font-medium">{o.name}</TableCell>
                                <TableCell><TypeBadge type={o.offer_type} /></TableCell>
                                <TableCell>{o.priority}</TableCell>
                                <TableCell><StatusBadge status={o.status} /></TableCell>
                                <TableCell className="text-sm text-muted-foreground">{o.start_date ? formatDate(o.start_date) : '-'} — {o.end_date ? formatDate(o.end_date) : '-'}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'details', data: o })}><Eye className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" onClick={() => duplicateSpecialOffer(o)}><Copy className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: o })}><Edit className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModal({ type: 'delete', data: o })}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
            <SpecialOfferModal
                open={modal?.type === 'create' || modal?.type === 'edit'}
                offer={modal?.type === 'edit' ? modal.data : null}
                onClose={() => setModal(null)}
                onSave={data => modal?.type === 'edit' ? updateSpecialOffer(modal.data.id, data) : createSpecialOffer(data)}
            />
            <SpecialOfferDetailsModal
                open={modal?.type === 'details'}
                onClose={() => setModal(null)}
                offer={modal?.data}
            />
             <ConfirmationActionModal
                open={modal?.type === 'delete'}
                onClose={() => setModal(null)}
                title="Delete Offer"
                onConfirm={() => deleteSpecialOffer(modal.data.id)}
                variant="destructive"
            />
        </div>
    );
};

// --- Usage Tab ---
export const UsageTab = ({ usage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = usage.filter(u => 
        (u.customers?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.promo_codes?.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                 <Input placeholder="Search customer or code..." className="w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} />
                 <Button variant="outline">Export CSV</Button>
            </div>
            <Card>
                <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Code/Promo</TableHead><TableHead>Discount Amount</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filtered.map(u => (
                            <TableRow key={u.id}>
                                <TableCell>{formatDate(u.usage_date)}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{u.customers?.name}</div>
                                    <div className="text-xs text-muted-foreground">{u.customers?.email}</div>
                                </TableCell>
                                <TableCell>
                                    {u.promo_codes?.code ? <span className="font-mono font-bold">{u.promo_codes.code}</span> : u.promotions?.name}
                                </TableCell>
                                <TableCell className="font-bold text-amber-600">{formatCurrency(u.discount_amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
};

// --- Rules Tab ---
export const RulesTab = ({ rules, promotions, createRule, updateRule, deleteRule }) => {
    const [modal, setModal] = useState(null);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setModal({ type: 'create' })}><Plus className="w-4 h-4 mr-2" /> Add Rule</Button>
            </div>
            <Card>
                <Table>
                    <TableHeader><TableRow><TableHead>Promotion</TableHead><TableHead>Rule Type</TableHead><TableHead>Value</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {rules.map(r => (
                            <TableRow key={r.id}>
                                <TableCell className="font-medium">{r.promotions?.name}</TableCell>
                                <TableCell><Badge variant="outline">{r.rule_type?.replace('_', ' ')}</Badge></TableCell>
                                <TableCell>{r.rule_value}</TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button size="icon" variant="ghost" onClick={() => setModal({ type: 'edit', data: r })}><Edit className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setModal({ type: 'delete', data: r })}><Trash2 className="w-4 h-4"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
            <PromotionRuleModal
                open={modal?.type === 'create' || modal?.type === 'edit'}
                rule={modal?.type === 'edit' ? modal.data : null}
                promotions={promotions}
                onClose={() => setModal(null)}
                onSave={data => modal?.type === 'edit' ? updateRule(modal.data.id, data) : createRule(data)}
            />
            <ConfirmationActionModal
                open={modal?.type === 'delete'}
                onClose={() => setModal(null)}
                title="Delete Rule"
                onConfirm={() => deleteRule(modal.data.id)}
                variant="destructive"
            />
        </div>
    );
};