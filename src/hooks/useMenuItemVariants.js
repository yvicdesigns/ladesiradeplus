import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useMenuItemVariants = (menuItemId) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!menuItemId) { setVariants([]); return; }
    setLoading(true);
    supabase
      .from('menu_item_variants')
      .select('*, menu_item_variant_options(*)')
      .eq('menu_item_id', menuItemId)
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          setVariants(data.map(v => ({
            ...v,
            menu_item_variant_options: (v.menu_item_variant_options || []).sort((a, b) => a.sort_order - b.sort_order)
          })));
        }
        setLoading(false);
      });
  }, [menuItemId]);

  return { variants, loading, setVariants };
};

export const saveVariants = async (menuItemId, variants) => {
  // Delete all existing variants for this item (cascade deletes options)
  await supabase.from('menu_item_variants').delete().eq('menu_item_id', menuItemId);

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    if (!v.name?.trim()) continue;

    const { data: variantRow, error } = await supabase
      .from('menu_item_variants')
      .insert({ menu_item_id: menuItemId, name: v.name.trim(), is_required: v.is_required ?? true, sort_order: i })
      .select()
      .single();

    if (error || !variantRow) continue;

    const options = (v.options || []).filter(o => o.label?.trim());
    for (let j = 0; j < options.length; j++) {
      await supabase.from('menu_item_variant_options').insert({
        variant_id: variantRow.id,
        label: options[j].label.trim(),
        price_adjustment: parseFloat(options[j].price_adjustment) || 0,
        sort_order: j,
      });
    }
  }
};
