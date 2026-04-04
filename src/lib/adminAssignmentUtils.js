import { supabase } from '@/lib/customSupabaseClient';

/**
 * Assigns an existing user to a restaurant in the admin_users table.
 * Includes comprehensive error handling and logging for RLS debugging.
 * 
 * @param {string} email - The email of the user to assign
 * @param {string} restaurantId - The UUID of the restaurant
 * @returns {Promise<{success: boolean, message: string, details?: any}>}
 */
export const assignAdminUser = async (email, restaurantId) => {
  console.log(`[AssignAdmin] Starting assignment for ${email} to restaurant ${restaurantId}`);
  
  try {
    if (!email || !restaurantId) {
      return { success: false, message: "L'email et l'ID du restaurant sont requis." };
    }

    // 1. Verify user exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error("[AssignAdmin] Database error (Profiles):", profileError);
      return { success: false, message: `Erreur de base de données (Profils): ${profileError.message}` };
    }

    if (!profile) {
      return { success: false, message: "Aucun utilisateur trouvé avec cet email. L'utilisateur doit s'inscrire d'abord." };
    }

    // 2. Verify restaurant exists
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('id', restaurantId)
      .maybeSingle();

    if (restError || !restaurant) {
      return { success: false, message: "Le restaurant sélectionné est introuvable ou invalide." };
    }

    // 3. Prepare Payload
    const adminPayload = {
      user_id: profile.user_id,
      restaurant_id: restaurantId,
      email: profile.email,
      name: profile.full_name || email.split('@')[0],
      role: 'admin',
      status: 'active',
      is_deleted: false,
      updated_at: new Date().toISOString()
    };

    console.log("[AssignAdmin] Payload prepared:", adminPayload);

    // 4. Check if record exists
    const { data: existingAdmin, error: existingAdminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    if (existingAdminError) {
       console.warn("[AssignAdmin] Error checking existing record (might be RLS):", existingAdminError);
    }

    let operationError = null;

    if (existingAdmin) {
      console.log(`[AssignAdmin] Updating existing record ${existingAdmin.id}`);
      const { error } = await supabase
        .from('admin_users')
        .update(adminPayload)
        .eq('user_id', profile.user_id);
      operationError = error;
    } else {
      console.log(`[AssignAdmin] Inserting new record`);
      const { error } = await supabase
        .from('admin_users')
        .insert([adminPayload]);
      operationError = error;
    }

    // 5. Handle RLS or Constraints Errors
    if (operationError) {
      console.error("[AssignAdmin] Operation Error:", operationError);
      
      if (operationError.code === '42501') {
        return { 
          success: false, 
          message: "Violation de la politique de sécurité (RLS). Vous n'avez pas les droits pour assigner cet utilisateur. Vérifiez que votre propre compte est bien un Administrateur global.",
          details: operationError 
        };
      }
      
      return { 
        success: false, 
        message: `Échec de l'enregistrement: ${operationError.message}`,
        details: operationError
      };
    }

    // 6. Ensure profile role is also set to admin
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', profile.user_id);
      
    if (profileUpdateError) {
      console.warn("[AssignAdmin] Failed to update profile role, but admin_users was updated:", profileUpdateError);
    }

    console.log(`[AssignAdmin] Success for ${email}`);
    return { 
      success: true, 
      message: `L'utilisateur ${email} a été assigné au restaurant "${restaurant.name}" avec succès.` 
    };

  } catch (error) {
    console.error("[AssignAdmin] Unexpected Error:", error);
    return { success: false, message: `Erreur inattendue: ${error.message}` };
  }
};