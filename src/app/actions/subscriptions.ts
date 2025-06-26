'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
    companyId: z.string().uuid("ID de empresa inválido."),
    startDate: z.date({ required_error: "La fecha de inicio es requerida."}),
    endDate: z.date({ required_error: "La fecha de fin es requerida."}),
});

export async function createSubscription(data: { companyId: string, startDate: Date, endDate: Date }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Autenticación requerida.' };
    }

    // Check if the current user is an admin
    const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
    
    if (adminError || !adminData) {
        return { success: false, message: 'No tienes permisos para realizar esta acción.' };
    }
    
    const parsed = subscriptionSchema.safeParse(data);

    if (!parsed.success) {
        return { success: false, message: `Datos de formulario inválidos: ${parsed.error.errors.map(e => e.message).join(', ')}` };
    }
    
    const { companyId, startDate, endDate } = parsed.data;

    // TODO: Could add logic to check for existing/overlapping subscriptions for the same company.
    // For now, we'll just insert a new one.

    const { error: insertError } = await supabase.from('subscriptions').insert({
        company_id: companyId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
    });

    if (insertError) {
        console.error("Error al crear la suscripción:", insertError);
        return { success: false, message: 'No se pudo crear la suscripción en la base de datos.' };
    }

    return { success: true, message: '¡Suscripción creada exitosamente!' };
}
